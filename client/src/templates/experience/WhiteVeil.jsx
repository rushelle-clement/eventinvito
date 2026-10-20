// Template 12 — White Veil: modern Western elegance in ivory and gold, with sheer white drapes.
//
// Opening ("The Veil"): on a warm champagne glow, a fine gold rod draws itself across the top and
// two sheer white voile drapes hang from it, swaying very slightly as if in a breeze, the
// invitation softly visible through them. A glint of light runs along the rod, then the drapes
// draw apart to the sides and gather, and a few gold-foil flecks drift down. The names, date, venue and "Open Invitation" button appear. Tapping it starts
// the music (if chosen) and opens the full invitation.
//
// The drapes and swag are photographic sheer fabric made transparent (/public/white-veil);
// the gold rod, lines and flecks are drawn in code.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import './whiteVeil.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1300
const ART = `${import.meta.env.BASE_URL}white-veil/`
const img = (name) => `${ART}${name}.webp`

// Gold-foil flecks: fixed positions per index, so they never jump on re-render
function rand(i, k) {
  const x = Math.sin(i * 47.13 + k * 19.71) * 15731.743
  return x - Math.floor(x)
}
function Flecks({ count = 16, className = '' }) {
  return (
    <div className={`wv-flecks ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const d = 9 + rand(i, 1) * 8
        return (
          <span
            key={i}
            style={{
              left: `${(rand(i, 2) * 100).toFixed(1)}%`,
              '--d': `${d.toFixed(1)}s`,
              '--dl': `${(-rand(i, 3) * d).toFixed(1)}s`,
              '--sz': `${(3 + rand(i, 4) * 5).toFixed(1)}px`,
              '--sx': `${((rand(i, 5) - 0.5) * 60).toFixed(0)}px`,
              '--rot': `${(rand(i, 6) * 720 - 360).toFixed(0)}deg`,
            }}
          />
        )
      })}
    </div>
  )
}

// A sheer drape hanging from the rod (left or right); `gathered` = already drawn to the side
function Drape({ side, className = '' }) {
  return (
    <span className={`wv-drape ${side} ${className}`} aria-hidden="true">
      <img src={img('drape')} alt="" decoding="async" />
    </span>
  )
}

function GoldRule({ className = '' }) {
  return <span className={`wv-rule ${className}`} aria-hidden="true" />
}

// ---------- the design ----------

export default function WhiteVeil({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
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
    const delay = skipped || prefersReducedMotion() ? 0 : 5400
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
      {/* ---------- Opening: the veil ---------- */}
      {phase !== 'open' && (
        <div
          className={`wv-opening ${skipped ? 'is-skipped' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <span className="wv-light" aria-hidden="true" />

          <div className="wv-open-card">
            <div className="wv-open-text" lang={lang}>
              <p className={`wv-eyebrow ${local} wv-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
              <p className="wv-open-names wv-step s2">
                <span>{one}</span>
                <span className="wv-amp">{t.and}</span>
                <span>{two}</span>
              </p>
              <GoldRule className="wv-step s3" />
              <p className={`wv-open-date ${local} wv-step s3`}>{date}</p>
              {invitation.venueName && <p className={`wv-open-venue ${local} wv-step s4`}>{invitation.venueName}</p>}
              <button ref={openBtnRef} type="button" className="wv-open-btn wv-step s5" onClick={open} disabled={phase !== 'closed'}>
                {t.openInvitation}
              </button>
            </div>
          </div>

          {/* in front of the card: the rod, the drapes and the flecks (clipped, never scroll) */}
          <div className="wv-front" aria-hidden="true">
            <span className="wv-rod">
              <span className="wv-glint" />
            </span>
            <Drape side="left" />
            <Drape side="right" />
            <Flecks />
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip wv-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`wv-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="wv-hero">
            <div className="wv-hero-drapes" aria-hidden="true">
              <Drape side="left" className="is-gathered" />
              <Drape side="right" className="is-gathered" />
              <img className="wv-hero-swag" src={img('swag')} alt="" decoding="async" />
              <Flecks count={10} />
            </div>
            <div className="wv-section">
              <div className="wv-card">
                <Reveal variant="fade">
                  {!guestNamedInLine(invitation) && <p className="wv-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                </Reveal>
                {invitation.blessing && (
                  <Reveal variant="fade" delay={80}>
                    <p className="wv-blessing">{invitation.blessing}</p>
                  </Reveal>
                )}
                <Reveal delay={150}>
                  {!hasParentsLines(invitation) && <p className={`wv-eyebrow ${local} mt-6`}>{t.together}</p>}
                  {invitation.hostLine && <p className="wv-hostline">{invitation.hostLine}</p>}
                </Reveal>
                <h1 ref={headingRef} tabIndex={-1} className="wv-names outline-none">
                  <span className="wv-name" style={{ animationDelay: '0.3s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="wv-amp" style={{ animationDelay: '0.6s' }}>
                    {t.and}
                  </span>
                  <span className="wv-name" style={{ animationDelay: '0.8s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>
                <Reveal delay={900}>
                  <GoldRule />
                  <p className="wv-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                </Reveal>
                <Reveal delay={1100}>
                  <p className="wv-date">{date || '—'}</p>
                  {time && <p className={`wv-when ${local}`}>{time}</p>}
                  {invitation.venueName && <p className={`wv-venue ${local}`}>{invitation.venueName}</p>}
                </Reveal>
              </div>
            </div>
          </section>

          <section className="wv-section">
            <div className="wv-details">
              <Reveal className="wv-panel">
                <CalendarDays className="wv-icon" size={20} aria-hidden="true" />
                <p className={`wv-eyebrow ${local}`}>{t.when}</p>
                <p className="wv-panel-title">{date || '—'}</p>
                {time && (
                  <p className="wv-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="wv-panel" delay={120}>
                <MapPin className="wv-icon" size={20} aria-hidden="true" />
                <p className={`wv-eyebrow ${local}`}>{t.where}</p>
                <p className="wv-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="wv-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="wv-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="wv-sub inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: church ceremony, Poruwa ceremony, reception… */}
          {ceremonies.length > 0 && (
            <section className="wv-section" aria-labelledby="wv-cer-h">
              <Reveal className="wv-panel">
                <h2 id="wv-cer-h" className={`wv-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <GoldRule />
                <ol className="wv-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="wv-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="wv-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="wv-sub">{c.venue}</p>}
                      {c.note && <p className="wv-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="wv-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`wv-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
                <GoldRule />
              </Reveal>
              <div className={`wv-photos count-${Math.min(photos.length, 6)}`}>
                {photos.slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="wv-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="wv-section wv-last" aria-labelledby="wv-rsvp-h">
            <Reveal className="wv-panel">
              <p className={`wv-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="wv-rsvp-h" className="wv-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="wv-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <img className="wv-sign-swag" src={img('swag')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="wv-sign">
                {one} <span className="wv-amp">{t.and}</span> {two}
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
