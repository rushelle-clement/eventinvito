// Template 5 — White Rose Elegance: pure white, ivory, pearl and champagne, with sage leaves.
//
// Opening ("The White Rose Unfolding"): a soft ivory screen with a pearl glow; a white rose bud
// emerges from the light and blooms (bud → half open → full bloom) while real white petals drift
// and tiny lights shimmer. The rose then lifts and fades away, revealing a framed invitation card
// with a white-rose garland, where the couple's names, the date and venue appear, followed by
// "View Invitation". Tapping it starts the music (if chosen) and opens the full invitation.
//
// The flowers are photographic cut-outs in /public/white-rose (transparent WebP).

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import './whiteRose.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1400
const ART = `${import.meta.env.BASE_URL}white-rose/`
const PETAL_IMGS = [1, 2, 3, 4].map((n) => `${ART}petal-${n}.webp`)

// ---------- artwork ----------

// The opening rose: three photographs of the same rose (bud, half open, full bloom) cross-fade
function Bloom() {
  return (
    <div className="wr-bloom" aria-hidden="true">
      <img className="wr-stage st1" src={`${ART}stage-1.webp`} alt="" fetchPriority="high" decoding="async" />
      <img className="wr-stage st2" src={`${ART}stage-2.webp`} alt="" decoding="async" />
      <img className="wr-stage st3" src={`${ART}stage-3.webp`} alt="" decoding="async" />
    </div>
  )
}

// Real white rose petals drifting down (hidden with reduced motion, like the other designs' petals)
function seeded(i, k) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}
function DriftingPetals({ count = 8 }) {
  return (
    <div className="ei-petals is-fixed wr-petals" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const dur = 12 + seeded(i, 1) * 8
        return (
          <span
            key={i}
            className="ei-petal wr-real-petal"
            style={{
              left: `${seeded(i, 2) * 100}%`,
              '--d': `${dur.toFixed(2)}s`,
              '--delay': `${(-seeded(i, 3) * dur).toFixed(2)}s`,
              '--s': (0.6 + seeded(i, 4) * 0.6).toFixed(2),
              '--spin': `${(seeded(i, 6) > 0.5 ? 1 : -1) * (120 + seeded(i, 7) * 240)}deg`,
            }}
          >
            <img src={PETAL_IMGS[i % PETAL_IMGS.length]} alt="" decoding="async" />
          </span>
        )
      })}
    </div>
  )
}

// The white-rose garland across the top of a card, and the bouquet in its lower corner
function Garland({ className = '' }) {
  return <img className={`wr-garland ${className}`} src={`${ART}garland.webp`} alt="" aria-hidden="true" decoding="async" />
}
function Corner({ className = '' }) {
  return <img className={`wr-corner ${className}`} src={`${ART}corner.webp`} alt="" aria-hidden="true" decoding="async" />
}

// Thin, overlapping gold geometric frame lines (stretch to any card size)
function GoldFrame({ className = '' }) {
  return (
    <svg className={`wr-goldframe ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon points="9,3 72,1.2 98,8 98.6,78 93,98.8 28,99 1.4,93 2.4,22" />
      <polygon points="2.6,8 38,1.6 95,3 97.2,58 99,95 62,98 5,97.4 1,52" />
    </svg>
  )
}

function Lights() {
  return (
    <div className="wr-lights" aria-hidden="true">
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            '--tw': `${2.4 + ((i * 7) % 10) / 4}s`,
            '--td': `${((i * 13) % 20) / 5}s`,
          }}
        />
      ))}
    </div>
  )
}

// "2026-12-12" → "12 | 12 | 2026"
function numericDate(iso) {
  return iso.slice(0, 10).split('-').reverse().join(' | ')
}

// ---------- the design ----------

export default function WhiteRose({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed') // closed → opening → revealing → open
  const [skipped, setSkipped] = useState(false)
  const timers = useRef([])
  const viewBtnRef = useRef(null)
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
    const delay = skipped || prefersReducedMotion() ? 0 : 6900
    const id = setTimeout(() => viewBtnRef.current?.focus({ preventScroll: true }), delay)
    return () => clearTimeout(id)
  }, [phase, poster, skipped])

  function view() {
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
  const eyebrow = latin ? 'wr-eyebrow' : 'wr-eyebrow is-local'

  return (
    <>
      {/* ---------- Opening: the white rose unfolding ---------- */}
      {phase !== 'open' && (
        <div
          className={`wr-opening ${skipped ? 'is-skipped' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.viewInvitation}
        >
          <span className="wr-glow" aria-hidden="true" />
          <Lights />
          <DriftingPetals />
          <Bloom />

          <div className="wr-open-frame">
            <span className="wr-frame-line" aria-hidden="true" />
            <GoldFrame className="wr-open-gold" />

            <Garland className="wr-open-garland" />

            <div className="wr-open-text" lang={lang}>
              <p className={`${eyebrow} wr-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
              <p className="wr-open-names wr-step s2">
                <span>{one}</span>
                <span className="wr-open-amp">{t.and}</span>
                <span>{two}</span>
              </p>
              <span className="wr-open-rule wr-step s3" aria-hidden="true" />
              <p className="wr-open-date wr-step s3">{date}</p>
              {invitation.venueName && <p className="wr-open-venue wr-step s4">{invitation.venueName}</p>}
              <button ref={viewBtnRef} type="button" className="wr-view-btn wr-step s5" onClick={view} disabled={phase !== 'closed'}>
                {t.viewInvitation}
              </button>
            </div>
            <span className="wr-corner-space" aria-hidden="true" />
            <Corner className="wr-open-corner" />
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip wr-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`wr-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="wr-section wr-hero">
            <div className="wr-card">
              <GoldFrame />
              <Garland />
              <Reveal variant="fade">
                {!guestNamedInLine(invitation) && <p className="wr-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
              </Reveal>
              {invitation.blessing && (
                <Reveal variant="fade" delay={80}>
                  <p className="wr-blessing">{invitation.blessing}</p>
                </Reveal>
              )}
              <h1 ref={headingRef} tabIndex={-1} className="wr-names outline-none">
                <span className="wr-name" style={{ animationDelay: '0.3s' }}>
                  <Parents text={invitation.partnerOneParents} />
                  {one}
                </span>
                <span className="wr-amp" style={{ animationDelay: '0.6s' }}>
                  {t.and}
                </span>
                <span className="wr-name" style={{ animationDelay: '0.8s' }}>
                  <Parents text={invitation.partnerTwoParents} />
                  {two}
                </span>
              </h1>
              <Reveal delay={900}>
                {!hasParentsLines(invitation) && <p className={`wr-together ${latin ? '' : 'is-local'}`}>{t.together}</p>}
                {invitation.hostLine && <p className="wr-hostline">{invitation.hostLine}</p>}
                <p className="wr-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
              </Reveal>
              <Reveal delay={1100}>
                {invitation.eventDate && (
                  <p className="wr-date">
                    <span className="sr-only">{date}</span>
                    <span aria-hidden="true">{numericDate(invitation.eventDate)}</span>
                  </p>
                )}
                <p className={`wr-when ${latin ? '' : 'is-local'}`}>
                  <span aria-hidden="true">{formatDate(invitation.eventDate, lang, { weekday: 'long' })}</span>
                  {time && <span>{time}</span>}
                </p>
                {invitation.venueName && <p className={`wr-venue ${latin ? '' : 'is-local'}`}>{invitation.venueName}</p>}
              </Reveal>
              <span className="wr-corner-space" aria-hidden="true" />
              <Corner />
            </div>
          </section>

          <section className="wr-section">
            <div className="wr-details">
              <Reveal className="wr-panel">
                <p className={eyebrow}>{t.when}</p>
                <CalendarDays className="wr-icon" size={22} aria-hidden="true" />
                <p className="wr-panel-title">{date || '—'}</p>
                {time && (
                  <p className="wr-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="wr-panel" delay={120}>
                <p className={eyebrow}>{t.where}</p>
                <MapPin className="wr-icon" size={22} aria-hidden="true" />
                <p className="wr-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="wr-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="wr-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="wr-sub inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: church ceremony, Poruwa ceremony, reception… */}
          {ceremonies.length > 0 && (
            <section className="wr-section" aria-labelledby="wr-cer-h">
              <Reveal className="wr-panel">
                <h2 id="wr-cer-h" className={eyebrow}>
                  {t.programme}
                </h2>
                <ol className="wr-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="wr-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="wr-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="wr-sub">{c.venue}</p>}
                      {c.note && <p className="wr-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="wr-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`${eyebrow} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`wr-photos count-${Math.min(photos.length, 6)}`}>
                {photos.slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="wr-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="wr-section wr-last" aria-labelledby="wr-rsvp-h">
            <Reveal className="wr-panel">
              <p className={eyebrow}>{t.kindlyReply}</p>
              <h2 id="wr-rsvp-h" className="wr-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="wr-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <img className="wr-sign-rose" src={`${ART}rose.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="wr-sign">
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
