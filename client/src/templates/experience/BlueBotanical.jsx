// Template 7 — Blue Botanical Elegance: dusty blue, white, silver and muted green.
//
// Opening ("The Botanical Sketch"): on pale dusty-blue paper, fine silver-blue branches draw
// themselves in from the edges, their leaves sketched one by one and then softly washed with
// colour. White flowers bloom along the branches, which settle into a frame; the centre softly
// brightens and the invitation card appears inside the frame. A butterfly drifts in to rest on it.
// The names, date, venue and "Open Invitation" button follow. Tapping it starts the music
// (if chosen) and opens the full invitation.
//
// The branches are drawn in code (SVG line art); flowers, butterflies and leaves are watercolour
// illustration in /public/blue-botanical (transparent WebP).

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import { DriftingPieces, Flyer, Resting } from './floralParts'
import './blueBotanical.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1300
const ART = `${import.meta.env.BASE_URL}blue-botanical/`
const img = (name) => `${ART}${name}.webp`
const DRIFT = ['leaf-2', 'leaf-6', 'leaf-4', 'leaf-3'].map(img)

// ---------- the self-drawing branches ----------
// Each branch is a cubic curve (in a 400 × 560 frame around the card) with leaves along it.
// Leaves are placed and timed from the curve, so each one is sketched as the stem reaches it.

const BRANCHES = [
  { p: [[18, 556], [-10, 400], [-2, 150], [70, 10]], delay: 0.3, dur: 2.4, leaves: 13, size: 30 },
  { p: [[384, 4], [410, 160], [404, 380], [334, 554]], delay: 0.6, dur: 2.4, leaves: 13, size: 30 },
  { p: [[44, 26], [120, -8], [220, 6], [300, 24]], delay: 1.2, dur: 1.6, leaves: 8, size: 22 },
  { p: [[360, 540], [286, 572], [180, 560], [96, 538]], delay: 1.3, dur: 1.6, leaves: 8, size: 22 },
]

function point([a, b, c, d], t) {
  const u = 1 - t
  const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0]
  const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0])
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1])
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI }
}

const leafPath = (l, w) =>
  `M0 0 C ${(l * 0.3).toFixed(1)} ${-w}, ${(l * 0.78).toFixed(1)} ${-w}, ${l} 0 C ${(l * 0.78).toFixed(1)} ${w}, ${(l * 0.3).toFixed(1)} ${w}, 0 0 Z`

const SKETCH = BRANCHES.map((br, bi) => {
  const [a, b, c, d] = br.p
  const stem = `M${a[0]} ${a[1]} C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}`
  const leaves = Array.from({ length: br.leaves }, (_, i) => {
    const t = 0.1 + (0.86 * i) / (br.leaves - 1)
    const { x, y, angle } = point(br.p, t)
    const side = i % 2 ? 1 : -1
    const len = br.size * (1 - t * 0.45)
    return {
      key: `${bi}-${i}`,
      transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(angle + side * 42).toFixed(1)})`,
      d: leafPath(len.toFixed(1), (len * 0.34).toFixed(1)),
      rib: `M0 0 L ${(len * 0.86).toFixed(1)} 0`,
      tone: (bi + i) % 3,
      at: br.delay + t * br.dur,
    }
  })
  const tip = point(br.p, 1)
  return { stem, leaves, delay: br.delay, dur: br.dur, tip }
})

function Sketch() {
  return (
    <svg className="bb-sketch" viewBox="0 0 400 560" preserveAspectRatio="none" aria-hidden="true">
      {SKETCH.map((br, bi) => (
        <g key={bi}>
          <path className="bb-stem" d={br.stem} pathLength="1" style={{ '--at': `${br.delay}s`, '--dur': `${br.dur}s` }} />
          {br.leaves.map((l) => (
            <g key={l.key} transform={l.transform}>
              <path className={`bb-leaf tone-${l.tone}`} d={l.d} pathLength="1" style={{ '--at': `${l.at.toFixed(2)}s` }} />
              <path className="bb-rib" d={l.rib} pathLength="1" style={{ '--at': `${(l.at + 0.25).toFixed(2)}s` }} />
            </g>
          ))}
          <circle className="bb-berry" cx={br.tip.x.toFixed(1)} cy={br.tip.y.toFixed(1)} r="2.6" style={{ '--at': `${(br.delay + br.dur).toFixed(2)}s` }} />
        </g>
      ))}
    </svg>
  )
}

// White flowers that bloom along the branches (positions in % of the frame)
const BLOOMS = [
  { f: 1, cls: 'b1', at: 2.4 },
  { f: 5, cls: 'b2', at: 2.7 },
  { f: 2, cls: 'b3', at: 3.0 },
  { f: 6, cls: 'b4', at: 3.2 },
]

function Corner({ className = '' }) {
  return <img className={`bb-corner ${className}`} src={img('corner')} alt="" aria-hidden="true" decoding="async" />
}

// A fine divider: a line with a tiny sprig in the middle
function Divider({ className = '' }) {
  return (
    <svg className={`bb-divider ${className}`} viewBox="0 0 200 20" aria-hidden="true">
      <path d="M4 10 H 84 M116 10 H 196" />
      <path d="M100 16 C 98 10, 98 6, 100 2 M100 12 C 94 10, 90 7, 88 3 M100 12 C 106 10, 110 7, 112 3" />
      <circle cx="100" cy="2" r="1.6" />
    </svg>
  )
}

// ---------- the design ----------

export default function BlueBotanical({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed') // closed → revealing → open
  const [skipped, setSkipped] = useState(false)
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const { one, two } = names(invitation)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Keyboard users land on the button once it appears; after opening, on the invitation
  useEffect(() => {
    if (poster) return undefined
    if (phase === 'open') {
      headingRef.current?.focus({ preventScroll: true })
      return undefined
    }
    if (phase !== 'closed') return undefined
    const delay = skipped || prefersReducedMotion() ? 0 : 6500
    const id = setTimeout(() => openBtnRef.current?.focus({ preventScroll: true }), delay)
    return () => clearTimeout(id)
  }, [phase, poster, skipped])

  function open() {
    music.play() // inside the tap, so browsers allow sound
    timers.current.forEach(clearTimeout)
    if (prefersReducedMotion()) {
      setPhase('open')
      return
    }
    setPhase('revealing')
    timers.current = [setTimeout(() => setPhase('open'), DONE_AT)]
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const photos = invitation.photos || []
  const local = latin ? '' : 'is-local'

  return (
    <>
      {/* ---------- Opening: the botanical sketch ---------- */}
      {phase !== 'open' && (
        <div
          className={`bb-opening ${skipped ? 'is-skipped' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <span className="bb-glow" aria-hidden="true" />
          <div className="bb-flock" aria-hidden="true">
            <Flyer src={img('butterfly-1')} from={[-85, -10]} hover={[-24, -34]} exit={[-95, -85]} size={17} delay={1.6} dur={6} />
            <Flyer src={img('butterfly-3')} from={[90, 40]} hover={[30, 30]} exit={[100, 95]} size={15} delay={2.1} dur={6} flap="side" />
          </div>

          <div className="bb-stage">
            <div className="bb-wreath" aria-hidden="true">
              <Sketch />
              {BLOOMS.map((b) => (
                <img key={b.f} className={`bb-bloom ${b.cls}`} style={{ '--at': `${b.at}s` }} src={img(`flower-${b.f}`)} alt="" decoding="async" />
              ))}
              <Resting src={img('butterfly-2')} className="bb-open-rest" />
            </div>

            <div className="bb-open-card">
              <div className="bb-open-text" lang={lang}>
                <p className={`bb-eyebrow ${local} bb-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
                <p className="bb-open-names bb-step s2">
                  <span>{one}</span>
                  <span className="bb-amp">{t.and}</span>
                  <span>{two}</span>
                </p>
                <Divider className="bb-step s3" />
                <p className={`bb-open-date ${local} bb-step s3`}>{date}</p>
                {invitation.venueName && <p className={`bb-open-venue ${local} bb-step s4`}>{invitation.venueName}</p>}
                <button ref={openBtnRef} type="button" className="bb-open-btn bb-step s5" onClick={open} disabled={phase !== 'closed'}>
                  {t.openInvitation}
                </button>
              </div>
            </div>
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip bb-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`bb-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <DriftingPieces srcs={DRIFT} count={5} className="bb-invite-drift" duration={[16, 26]} />
          <section className="bb-section bb-hero">
            <div className="bb-card">
              <Corner className="tl" />
              <Corner className="br" />
              <Resting src={img('butterfly-1')} className="bb-card-rest" />
              <div className="bb-card-body">
                <Reveal variant="fade">
                  {!guestNamedInLine(invitation) && <p className="bb-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                </Reveal>
                {invitation.blessing && (
                  <Reveal variant="fade" delay={80}>
                    <p className="bb-blessing">{invitation.blessing}</p>
                  </Reveal>
                )}
                <Reveal delay={150}>
                  {!hasParentsLines(invitation) && <p className={`bb-eyebrow ${local} mt-6`}>{t.together}</p>}
                  {invitation.hostLine && <p className="bb-hostline">{invitation.hostLine}</p>}
                </Reveal>
                <h1 ref={headingRef} tabIndex={-1} className="bb-names outline-none">
                  <span className="bb-name" style={{ animationDelay: '0.3s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="bb-amp" style={{ animationDelay: '0.6s' }}>
                    {t.and}
                  </span>
                  <span className="bb-name" style={{ animationDelay: '0.8s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>
                <Reveal delay={900}>
                  <Divider />
                  <p className="bb-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                </Reveal>
                <Reveal delay={1100}>
                  <p className="bb-date">
                    <span className="bb-date-rule" aria-hidden="true" />
                    <span>{date || '—'}</span>
                    <span className="bb-date-rule" aria-hidden="true" />
                  </p>
                  {time && <p className={`bb-when ${local}`}>{time}</p>}
                  {invitation.venueName && <p className={`bb-venue ${local}`}>{invitation.venueName}</p>}
                </Reveal>
              </div>
            </div>
          </section>

          <section className="bb-section">
            <div className="bb-details">
              <Reveal className="bb-panel">
                <img className="bb-panel-leaf" src={img('leaf-3')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <p className={`bb-eyebrow ${local}`}>{t.when}</p>
                <CalendarDays className="bb-icon" size={20} aria-hidden="true" />
                <p className="bb-panel-title">{date || '—'}</p>
                {time && (
                  <p className="bb-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="bb-panel" delay={120}>
                <img className="bb-panel-leaf" src={img('leaf-5')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <p className={`bb-eyebrow ${local}`}>{t.where}</p>
                <MapPin className="bb-icon" size={20} aria-hidden="true" />
                <p className="bb-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="bb-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="bb-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="bb-sub inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: church ceremony, Poruwa ceremony, reception… */}
          {ceremonies.length > 0 && (
            <section className="bb-section" aria-labelledby="bb-cer-h">
              <Reveal className="bb-panel">
                <h2 id="bb-cer-h" className={`bb-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <Divider />
                <ol className="bb-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="bb-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="bb-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="bb-sub">{c.venue}</p>}
                      {c.note && <p className="bb-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="bb-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`bb-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`bb-photos count-${Math.min(photos.length, 6)}`}>
                {photos.slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="bb-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="bb-section bb-last" aria-labelledby="bb-rsvp-h">
            <Reveal className="bb-panel">
              <p className={`bb-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="bb-rsvp-h" className="bb-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="bb-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <img className="bb-sign-flower" src={img('flower-3')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="bb-sign">
                {one} {t.and} {two}
              </p>
              {guestName && (
                <p className="mx-auto mt-4 max-w-sm text-[12px]" style={{ color: 'var(--ei-muted)' }}>
                  {t.personalNote(guestName)}
                </p>
              )}
            </Reveal>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
