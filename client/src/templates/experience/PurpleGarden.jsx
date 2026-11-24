// Template 8 — Purple Enchanted Garden: lavender, lilac, periwinkle, ivory and champagne gold.
//
// Opening ("Twilight Wisteria"): a dreamy lavender twilight with tiny fireflies drifting. Wisteria
// strands slowly descend from the top and lilac sprigs grow up from the lower corners. A trail of
// soft light travels to the centre and opens into a gentle glow, out of which the invitation card
// (an arched garden gate, crowned with wisteria) appears. The names emerge from the glow, then the
// date, venue and "Enter the Garden" button. Tapping it starts the music (if chosen) and opens
// the full invitation.
//
// The flowers and butterflies are watercolour illustration in /public/purple-garden
// (transparent WebP); the fireflies, light trail and glow are drawn in code.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt, Sparkle } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange, galleryClass } from './shared'
import { formatDate } from '../strings'
import { DriftingPieces, Flyer, Resting } from './floralParts'
import './purpleGarden.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1300
const ART = `${import.meta.env.BASE_URL}purple-garden/`
const img = (name) => `${ART}${name}.webp`
const DRIFT = [1, 2, 3, 4, 5, 6].map((n) => img(`petal-${n}`))

// The wisteria curtain: [left %, which strand, width (vmin), delay s, mirrored]
const STRANDS = [
  [-3, 4, 21, 0.8, false],
  [17, 2, 14, 1.25, true],
  [42, 1, 12, 1.6, false],
  [66, 3, 15, 1.1, true],
  [84, 4, 21, 0.95, true],
]

// Fireflies: fixed positions per index, so they never jump on re-render
function rand(i, k) {
  const x = Math.sin(i * 91.17 + k * 47.31) * 24634.6345
  return x - Math.floor(x)
}
function Fireflies({ count = 22, className = '' }) {
  return (
    <div className={`pg-fireflies ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(rand(i, 1) * 100).toFixed(1)}%`,
            top: `${(10 + rand(i, 2) * 85).toFixed(1)}%`,
            '--dx': `${((rand(i, 3) - 0.5) * 80).toFixed(0)}px`,
            '--dy': `${((rand(i, 4) - 0.5) * 70).toFixed(0)}px`,
            '--fd': `${(7 + rand(i, 5) * 8).toFixed(1)}s`,
            '--bd': `${(1.8 + rand(i, 6) * 2.4).toFixed(1)}s`,
            '--dl': `${(rand(i, 7) * 3).toFixed(1)}s`,
            '--sz': `${(2.5 + rand(i, 8) * 3).toFixed(1)}px`,
          }}
        />
      ))}
    </div>
  )
}

// The trail of light: a few glowing orbs following the same curve, one after another
function LightTrail() {
  return (
    <div className="pg-trail" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className="pg-orb" style={{ '--i': i }}>
          <span />
        </span>
      ))}
    </div>
  )
}

// "Saturday · 12 December 2026", with a little gold sparkle either side
function DateLine({ iso, lang }) {
  if (!iso) return <p className="pg-date">—</p>
  return (
    <>
      <p className="pg-weekday">{formatDate(iso, lang, { weekday: 'long' })}</p>
      <p className="pg-date">
        <Sparkle size={12} className="pg-spark" aria-hidden="true" />
        <span>{formatDate(iso, lang, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <Sparkle size={12} className="pg-spark" aria-hidden="true" />
      </p>
    </>
  )
}

// ---------- the design ----------

export default function PurpleGarden({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed') // closed → revealing → open
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
    const delay = prefersReducedMotion() ? 0 : 6900
    const id = setTimeout(() => openBtnRef.current?.focus({ preventScroll: true }), delay)
    return () => clearTimeout(id)
  }, [phase, poster])

  function enter() {
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
      {/* ---------- Opening: twilight wisteria ---------- */}
      {phase !== 'open' && (
        <div
          className={`pg-opening ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.enterGarden}
        >
          <Fireflies />
          <div className="pg-curtain" aria-hidden="true">
            {STRANDS.map(([left, n, w, delay, flip], i) => (
              <span key={i} className="pg-strand" style={{ left: `${left}%`, '--w': `calc(${w} * var(--ei-vmin, 1vmin))`, '--dl': `${delay}s`, '--sw': `${5 + (i % 3)}s` }}>
                <img className={flip ? 'is-flipped' : ''} src={img(`wisteria-${n}`)} alt="" decoding="async" />
              </span>
            ))}
          </div>
          <div className="pg-ground" aria-hidden="true">
            <img className="pg-grow left" src={img('sprig-1')} alt="" decoding="async" />
            <img className="pg-grow right" src={img('sprig-2')} alt="" decoding="async" />
          </div>
          <div className="pg-flock" aria-hidden="true">
            <Flyer src={img('butterfly-1')} from={[-80, 30]} hover={[-28, -6]} exit={[-95, -70]} size={15} delay={1.4} dur={6.4} />
            <Flyer src={img('butterfly-2')} from={[85, 10]} hover={[30, 18]} exit={[100, -60]} size={14} delay={2} dur={6.4} flap="side" />
          </div>
          <LightTrail />
          <span className="pg-burst" aria-hidden="true" />

          <div className="pg-open-card">
            <img className="pg-garland" src={img('garland')} alt="" aria-hidden="true" decoding="async" />
            <Resting src={img('butterfly-3')} className="pg-open-rest" />
            <div className="pg-open-text" lang={lang}>
              <p className={`pg-eyebrow ${local} pg-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
              <p className="pg-open-names pg-emerge">
                <span>{one}</span>
                <span className="pg-amp">{t.and}</span>
                <span>{two}</span>
              </p>
              <p className={`pg-open-date ${local} pg-step s3`}>{date}</p>
              {invitation.venueName && <p className={`pg-open-venue ${local} pg-step s4`}>{invitation.venueName}</p>}
              <button ref={openBtnRef} type="button" className="pg-open-btn pg-step s5" onClick={enter} disabled={phase !== 'closed'}>
                {t.enterGarden}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`pg-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <Fireflies count={12} className="pg-invite-fireflies" />
          <DriftingPieces srcs={DRIFT} count={6} className="pg-invite-drift" duration={[15, 24]} />
          <section className="pg-section pg-hero">
            <div className="pg-card">
              <img className="pg-garland" src={img('garland')} alt="" aria-hidden="true" decoding="async" />
              <Resting src={img('butterfly-5')} className="pg-card-rest" />
              <div className="pg-card-body">
                <Reveal variant="fade">
                  {!guestNamedInLine(invitation) && <p className="pg-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                </Reveal>
                {invitation.blessing && (
                  <Reveal variant="fade" delay={80}>
                    <p className="pg-blessing">{invitation.blessing}</p>
                  </Reveal>
                )}
                <Reveal delay={150}>
                  {/* the hosts' own line replaces "together with their families" */}{!hasParentsLines(invitation) && !invitation.hostLine && <p className={`pg-eyebrow ${local} mt-6`}>{t.together}</p>}
                  {invitation.hostLine && <p className="pg-hostline">{invitation.hostLine}</p>}
                </Reveal>
                <h1 ref={headingRef} tabIndex={-1} className="pg-names outline-none">
                  <span className="pg-name" style={{ animationDelay: '0.3s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="pg-amp" style={{ animationDelay: '0.6s' }}>
                    {t.and}
                  </span>
                  <span className="pg-name" style={{ animationDelay: '0.8s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>
                <Reveal delay={900}>
                  <p className="pg-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                </Reveal>
                <Reveal delay={1100}>
                  <span className="sr-only">{date}</span>
                  <div aria-hidden="true">
                    <DateLine iso={invitation.eventDate} lang={lang} />
                  </div>
                  {time && <p className={`pg-when ${local}`}>{time}</p>}
                  {invitation.venueName && <p className={`pg-venue ${local}`}>{invitation.venueName}</p>}
                </Reveal>
              </div>
              <img className="pg-card-sprig left" src={img('sprig-1')} alt="" aria-hidden="true" decoding="async" />
              <img className="pg-card-sprig right" src={img('sprig-2')} alt="" aria-hidden="true" decoding="async" />
            </div>
          </section>

          <section className="pg-section">
            <div className="pg-details">
              <Reveal className="pg-panel">
                <CalendarDays className="pg-icon" size={20} aria-hidden="true" />
                <p className={`pg-eyebrow ${local}`}>{t.when}</p>
                <p className="pg-panel-title">{date || '—'}</p>
                {time && (
                  <p className="pg-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="pg-panel" delay={120}>
                <MapPin className="pg-icon" size={20} aria-hidden="true" />
                <p className={`pg-eyebrow ${local}`}>{t.where}</p>
                <p className="pg-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="pg-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="pg-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="pg-sub inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: church ceremony, Poruwa ceremony, reception… */}
          {ceremonies.length > 0 && (
            <section className="pg-section" aria-labelledby="pg-cer-h">
              <Reveal className="pg-panel">
                <Sparkle className="pg-icon" size={18} aria-hidden="true" />
                <h2 id="pg-cer-h" className={`pg-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="pg-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="pg-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="pg-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="pg-sub">{c.venue}</p>}
                      {c.note && <p className="pg-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="pg-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`pg-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`pg-photos ${galleryClass(photos.length, 6)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="pg-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="pg-section pg-last" aria-labelledby="pg-rsvp-h">
            <Reveal className="pg-panel">
              <p className={`pg-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="pg-rsvp-h" className="pg-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="pg-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <img className="pg-sign-wisteria" src={img('wisteria-1')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="pg-sign">
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
