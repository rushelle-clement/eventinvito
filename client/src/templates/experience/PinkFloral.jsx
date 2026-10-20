// Template 6 — Pink Floral Romance: blush, peach, ivory, soft lavender and sage, with gold edges.
//
// Opening ("A Flutter of Butterflies"): a blush paper screen with a few drifting petals. Pastel
// butterflies flutter in from the edges and gather around the centre while a pink-and-peach
// watercolour wash blooms beneath them. As they fly off, the invitation card is revealed through
// the watercolour shape — like paint spreading on paper. One butterfly comes back to rest on the
// card; the names, date, venue and "Open Invitation" button follow. Tapping it starts the music
// (if chosen) and opens the full invitation.
//
// The artwork is watercolour illustration in /public/pink-floral (transparent WebP).

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import { DriftingPieces, Flyer, Resting } from './floralParts'
import './pinkFloral.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1300
const ART = `${import.meta.env.BASE_URL}pink-floral/`
const img = (name) => `${ART}${name}.webp`
const DRIFT = ['petal-1', 'petal-3', 'heart-1', 'petal-5', 'leaf-1', 'petal-2', 'heart-2', 'petal-6', 'petal-7', 'petal-4'].map(img)

// The butterflies of the opening (offsets from the screen's centre, in vmin — see floralParts)
const FLIGHT = [
  { b: 1, from: [-80, -40], hover: [-30, -28], exit: [-90, -90], size: 24, delay: 0.3, flap: 'open' },
  { b: 2, from: [85, -55], hover: [30, -30], exit: [95, -80], size: 21, delay: 0.6, flap: 'side' },
  { b: 5, from: [-90, 50], hover: [-30, 24], exit: [-100, 40], size: 20, delay: 0.9, flap: 'open' },
  { b: 3, from: [90, 60], hover: [32, 20], exit: [100, 90], size: 19, delay: 0.5, flap: 'side' },
  { b: 6, from: [10, 90], hover: [4, 36], exit: [30, 110], size: 16, delay: 1.1, flap: 'side' },
]

// ---------- artwork ----------

function Corner({ className = '' }) {
  return <img className={`pf-corner ${className}`} src={img('corner')} alt="" aria-hidden="true" decoding="async" />
}

// "Saturday | 12 | December 2026", with each part in the guest's language
function DateBlock({ iso, lang }) {
  if (!iso) return <p className="pf-date-plain">—</p>
  return (
    <p className="pf-date">
      <span className="pf-date-side">{formatDate(iso, lang, { weekday: 'long' })}</span>
      <span className="pf-date-day">{formatDate(iso, lang, { day: 'numeric' })}</span>
      <span className="pf-date-side">{formatDate(iso, lang, { month: 'long', year: 'numeric' })}</span>
    </p>
  )
}

// ---------- the design ----------

export default function PinkFloral({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
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
    const delay = skipped || prefersReducedMotion() ? 0 : 6700
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
      {/* ---------- Opening: a flutter of butterflies ---------- */}
      {phase !== 'open' && (
        <div
          className={`pf-opening ${skipped ? 'is-skipped' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <DriftingPieces srcs={DRIFT} fixed count={8} className="pf-drift" />
          <img className="pf-wash" src={img('wash')} alt="" aria-hidden="true" decoding="async" />
          <div className="pf-flock" aria-hidden="true">
            {FLIGHT.map((f) => (
              <Flyer key={f.b} src={img(`butterfly-${f.b}`)} {...f} />
            ))}
          </div>

          <div className="pf-open-card" style={{ '--pf-mask': `url(${img('wash-mask')})` }}>
            <Corner className="tl" />
            <Corner className="br" />
            <Resting src={img('butterfly-7')} className="pf-open-rest" />
            <div className="pf-open-text" lang={lang}>
              <p className={`pf-eyebrow ${local} pf-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
              <p className="pf-open-names pf-step s2">
                <span>{one}</span>
                <span className="pf-amp">{t.and}</span>
                <span>{two}</span>
              </p>
              <img className="pf-divider pf-step s3" src={img('garland')} alt="" aria-hidden="true" decoding="async" />
              <p className={`pf-open-date ${local} pf-step s3`}>{date}</p>
              {invitation.venueName && <p className={`pf-open-venue ${local} pf-step s4`}>{invitation.venueName}</p>}
              <button ref={openBtnRef} type="button" className="pf-open-btn pf-step s5" onClick={open} disabled={phase !== 'closed'}>
                {t.openInvitation}
              </button>
            </div>
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip pf-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`pf-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <DriftingPieces srcs={DRIFT} count={6} className="pf-invite-drift" />
          <section className="pf-section pf-hero">
            <div className="pf-card">
              <Corner className="tl" />
              <Corner className="br" />
              <Resting src={img('butterfly-4')} className="pf-card-rest" />
              <div className="pf-card-body">
                <Reveal variant="fade">
                  {!guestNamedInLine(invitation) && <p className="pf-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                </Reveal>
                {invitation.blessing && (
                  <Reveal variant="fade" delay={80}>
                    <p className="pf-blessing">{invitation.blessing}</p>
                  </Reveal>
                )}
                <Reveal delay={150}>
                  {!hasParentsLines(invitation) && <p className={`pf-eyebrow ${local} mt-6`}>{t.together}</p>}
                  {invitation.hostLine && <p className="pf-hostline">{invitation.hostLine}</p>}
                </Reveal>
                <h1 ref={headingRef} tabIndex={-1} className="pf-names outline-none">
                  <span className="pf-name" style={{ animationDelay: '0.3s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="pf-amp" style={{ animationDelay: '0.6s' }}>
                    {t.and}
                  </span>
                  <span className="pf-name" style={{ animationDelay: '0.8s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>
                <Reveal delay={900}>
                  <img className="pf-divider" src={img('garland')} alt="" aria-hidden="true" decoding="async" />
                  <p className="pf-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                </Reveal>
                <Reveal delay={1100}>
                  <span className="sr-only">{date}</span>
                  <div aria-hidden="true">
                    <DateBlock iso={invitation.eventDate} lang={lang} />
                  </div>
                  {time && <p className={`pf-when ${local}`}>{time}</p>}
                  {invitation.venueName && <p className={`pf-venue ${local}`}>{invitation.venueName}</p>}
                </Reveal>
              </div>
            </div>
          </section>

          <section className="pf-section">
            <div className="pf-details">
              <Reveal className="pf-panel">
                <span className="pf-icon" aria-hidden="true">
                  <CalendarDays size={20} />
                </span>
                <p className={`pf-eyebrow ${local}`}>{t.when}</p>
                <p className="pf-panel-title">{date || '—'}</p>
                {time && (
                  <p className="pf-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="pf-panel" delay={120}>
                <span className="pf-icon" aria-hidden="true">
                  <MapPin size={20} />
                </span>
                <p className={`pf-eyebrow ${local}`}>{t.where}</p>
                <p className="pf-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="pf-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="pf-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="pf-sub inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: church ceremony, Poruwa ceremony, reception… */}
          {ceremonies.length > 0 && (
            <section className="pf-section" aria-labelledby="pf-cer-h">
              <Reveal className="pf-panel">
                <img className="pf-panel-sprig" src={img('sprig')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <h2 id="pf-cer-h" className={`pf-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="pf-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="pf-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="pf-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="pf-sub">{c.venue}</p>}
                      {c.note && <p className="pf-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="pf-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`pf-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`pf-photos count-${Math.min(photos.length, 6)}`}>
                {photos.slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="pf-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="pf-section pf-last" aria-labelledby="pf-rsvp-h">
            <Reveal className="pf-panel">
              <p className={`pf-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="pf-rsvp-h" className="pf-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="pf-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <img className="pf-sign-garland" src={img('garland')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="pf-sign">
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
