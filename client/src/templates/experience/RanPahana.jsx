// Ran Pahana: red silk brocade, gold Kandyan liyawel and the traditional brass oil lamp.
//
// Opening: on red brocade, a gold-framed panel with the names, and an unlit oil lamp below it.
// "Open Invitation" → the guest lights the lamp: the flame rises from the wick, its warm light
// grows until it fills the screen, and the invitation appears in red and gold.
// The brocade, liyawel, lotus, lamp and flame are illustrations (/public/ran-pahana).

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, numericDate, runTimeline, timeRange, galleryClass } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './ranPahana.css'

// After the tap (ms): flame rises 0.15–0.9s, its light fills the screen 0.7–2.1s
const REVEAL_AT = 2100
const DONE_AT = 2800
const ART = `${import.meta.env.BASE_URL}ran-pahana/`
const img = (name) => `${ART}${name}.webp`

function Brocade() {
  return (
    <picture className="rp-brocade" aria-hidden="true">
      <source media="(min-aspect-ratio: 1/1)" srcSet={img('brocade')} />
      <img src={img('brocade-tall')} alt="" decoding="async" />
    </picture>
  )
}

// Four gold liyawel corners (the art is a top-left corner; the others are mirrored)
function Corners({ className = '' }) {
  return ['tl', 'tr', 'bl', 'br'].map((at) => (
    <img key={at} className={`rp-corner ${at} ${className}`} src={img('liyawel-corner')} alt="" aria-hidden="true" decoding="async" />
  ))
}

// The brass lamp; the flame is a separate layer so it can be lit and flicker
function Lamp({ lit, className = '', lampRef }) {
  return (
    <span ref={lampRef} className={`rp-lamp ${lit ? 'is-lit' : ''} ${className}`} aria-hidden="true">
      <img src={img('lamp-unlit')} alt="" decoding="async" />
      <span className="rp-flame">
        <img src={img('flame')} alt="" decoding="async" />
      </span>
    </span>
  )
}

function Border({ className = '' }) {
  return <img className={`rp-border ${className}`} src={img('liyawel-border')} alt="" aria-hidden="true" decoding="async" />
}

export default function RanPahana({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const [glowAt, setGlowAt] = useState({ x: '50%', y: '70%' })
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const lampRef = useRef(null)
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
  const { one, two } = names(invitation)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (poster) return // thumbnails never take keyboard focus
    if (phase === 'closed') openBtnRef.current?.focus({ preventScroll: true })
    if (phase === 'open') headingRef.current?.focus({ preventScroll: true })
  }, [phase, poster])

  function open() {
    music.play() // inside the tap, so browsers allow sound
    // The light spreads from the flame
    const r = lampRef.current?.getBoundingClientRect()
    if (r) setGlowAt({ x: `${Math.round(r.left + r.width * 0.172)}px`, y: `${Math.round(r.top + r.height * 0.3)}px` })
    timers.current = runTimeline(setPhase, REVEAL_AT, DONE_AT)
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const photos = invitation.photos || []

  return (
    <>
      {/* ---------- Opening: light the lamp ---------- */}
      {phase !== 'open' && (
        <div
          className={`rp-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          style={{ '--gx': glowAt.x, '--gy': glowAt.y }}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <Brocade />

          <div className="rp-stage" lang={lang}>
            <p className={`rp-eyebrow ${local} rp-guest`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>

            <div className="rp-frame">
              <Corners />
              <img className="rp-frame-lotus" src={img('lotus')} alt="" aria-hidden="true" decoding="async" />
              <div className="rp-frame-body">
                {invitation.blessing && <p className="rp-frame-blessing">{invitation.blessing}</p>}
                <p className={`rp-eyebrow ${local}`}>{t.theWeddingOf}</p>
                <p className="rp-frame-names">
                  <span>{one}</span>
                  <span className="rp-amp">{t.and}</span>
                  <span>{two}</span>
                </p>
                <p className="rp-frame-date">{latin ? numericDate(invitation.eventDate) : date}</p>
              </div>
            </div>

            <Lamp lit={phase !== 'closed'} lampRef={lampRef} className="rp-open-lamp" />

            <button ref={openBtnRef} type="button" className="rp-open-btn" onClick={open} disabled={phase !== 'closed'}>
              {t.openInvitation}
            </button>
          </div>

          <span className="rp-glow" aria-hidden="true" />
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`rp-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="rp-hero">
            <Brocade />
            <Corners className="is-page" />
            <div className="rp-hero-inner">
              <Reveal variant="fade">
                <img className="rp-hero-lotus" src={img('lotus')} alt="" aria-hidden="true" decoding="async" />
                {invitation.blessing && <p className="rp-blessing">{invitation.blessing}</p>}
                {!guestNamedInLine(invitation) && <p className={`rp-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>}
              </Reveal>
              <Reveal delay={150}>
                {/* the hosts' own line replaces "together with their families" */}{!hasParentsLines(invitation) && !invitation.hostLine && <p className={`rp-eyebrow ${local} mt-6`}>{t.together}</p>}
                {invitation.hostLine && <p className="rp-hostline">{invitation.hostLine}</p>}
              </Reveal>

              <h1 ref={headingRef} tabIndex={-1} className="rp-names outline-none">
                <span className="rp-name" style={{ animationDelay: '0.3s' }}>
                  <Parents text={invitation.partnerOneParents} />
                  {one}
                </span>
                <span className="rp-amp" style={{ animationDelay: '0.6s' }}>
                  {t.and}
                </span>
                <span className="rp-name" style={{ animationDelay: '0.85s' }}>
                  <Parents text={invitation.partnerTwoParents} />
                  {two}
                </span>
              </h1>

              <Reveal delay={1000}>
                <Border className="is-divider" />
                <p className="rp-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
              </Reveal>
              <Reveal delay={1200}>
                <p className="rp-date">{date || '—'}</p>
                {time && <p className="rp-time">{time}</p>}
                {invitation.venueName && <p className={`rp-venue ${local}`}>{invitation.venueName}</p>}
              </Reveal>
            </div>
          </section>

          {photos.length > 0 && (
            <section className="rp-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`rp-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`rp-photos ${galleryClass(photos.length, 4)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 120} className="rp-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="rp-section">
            <div className="rp-details">
              <Reveal className="rp-panel">
                <Corners className="is-small" />
                <CalendarDays className="rp-icon" size={20} aria-hidden="true" />
                <p className={`rp-eyebrow ${local}`}>{t.when}</p>
                <p className="rp-panel-title">{date || '—'}</p>
                {time && (
                  <p className="rp-sub">
                    <Clock size={14} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="rp-panel" delay={120}>
                <Corners className="is-small" />
                <MapPin className="rp-icon" size={20} aria-hidden="true" />
                <p className={`rp-eyebrow ${local}`}>{t.where}</p>
                <p className="rp-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="rp-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="rp-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="rp-sub">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {ceremonies.length > 0 && (
            <section className="rp-section" aria-labelledby="rp-cer-h">
              <Reveal className="rp-panel">
                <Corners className="is-small" />
                <h2 id="rp-cer-h" className={`rp-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="rp-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="rp-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                      <p className="rp-cer-name">{c.name}</p>
                      {c.venue && <p className="rp-sub">{c.venue}</p>}
                      {c.note && <p className="rp-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          <section className="rp-section pb-16" aria-labelledby="rp-rsvp-h">
            <Reveal className="rp-panel rp-rsvp">
              <Corners className="is-small" />
              <p className={`rp-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="rp-rsvp-h" className="rp-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="rp-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-14 text-center">
              <Lamp lit className="rp-sign-lamp" />
              <p className="rp-sign">
                {one} <span className="rp-amp">{t.and}</span> {two}
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
