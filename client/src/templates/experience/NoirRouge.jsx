// Noir Rouge: black paper, crimson satin and red roses. Modern and dramatic.
//
// Opening: a black card lies on black paper beside a long-stem red rose, tied with a crimson
// satin ribbon and bow. "Open Invitation" → the bow lifts away, the ribbon slips off both
// sides and the card comes forward into the invitation: ivory type on black, red accents and
// rose corners. The paper, ribbon bow and roses are photographs (/public/noir-rouge); the
// card, the satin band and every line are drawn in code.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, numericDate, runTimeline, timeRange, galleryClass } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './noirRouge.css'

// After the tap (ms): bow lifts 0–0.7s, ribbon slips off 0.45–1.3s, card comes forward 1.2–2s
const REVEAL_AT = 1900
const DONE_AT = 2600
const ART = `${import.meta.env.BASE_URL}noir-rouge/`
const img = (name) => `${ART}${name}.webp`

function Paper() {
  return (
    <picture className="nr-paper" aria-hidden="true">
      <source media="(min-aspect-ratio: 1/1)" srcSet={img('paper')} />
      <img src={img('paper-tall')} alt="" decoding="async" />
    </picture>
  )
}

function Rule() {
  return (
    <span className="nr-rule" aria-hidden="true">
      <span />
    </span>
  )
}

export default function NoirRouge({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
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
    timers.current = runTimeline(setPhase, REVEAL_AT, DONE_AT)
  }
  function skip() {
    timers.current.forEach(clearTimeout)
    setPhase('open')
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const photos = invitation.photos || []

  return (
    <>
      {/* ---------- Opening: the tied card ---------- */}
      {phase !== 'open' && (
        <div className={`nr-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={t.openInvitation}>
          <Paper />

          <div className="nr-stage" lang={lang}>
            <p className={`nr-eyebrow ${local} nr-guest`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>

            <div className="nr-card-wrap">
              <img className="nr-stem" src={img('rose')} alt="" aria-hidden="true" decoding="async" />
              <div className="nr-card">
                <span className="nr-card-frame" aria-hidden="true" />
                <img className="nr-card-roses" src={img('rose-corner')} alt="" aria-hidden="true" decoding="async" />
                <p className={`nr-eyebrow ${local} nr-card-eyebrow`}>{t.theWeddingOf}</p>
                <p className="nr-card-names">
                  <span>{one}</span>
                  <span className="nr-amp">{t.and}</span>
                  <span>{two}</span>
                </p>
                <p className="nr-card-date">{latin ? numericDate(invitation.eventDate) : date}</p>
                {/* the satin band (two halves, so it can slip off both sides) and the bow */}
                <span className="nr-band l" aria-hidden="true" />
                <span className="nr-band r" aria-hidden="true" />
                <img className="nr-bow" src={img('ribbon')} alt="" aria-hidden="true" decoding="async" />
              </div>
            </div>

            <button ref={openBtnRef} type="button" className="nr-open-btn" onClick={open} disabled={phase !== 'closed'}>
              {t.openInvitation}
            </button>
          </div>

          {phase !== 'closed' && (
            <button type="button" className="ei-skip" onClick={skip} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`nr-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="nr-hero">
            <Paper />
            <img className="nr-corner tl" src={img('rose-corner')} alt="" aria-hidden="true" decoding="async" />
            <img className="nr-corner br" src={img('rose-corner')} alt="" aria-hidden="true" decoding="async" />
            <div className="nr-hero-inner">
              {!guestNamedInLine(invitation) && (
                <Reveal variant="fade">
                  <p className={`nr-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>
                </Reveal>
              )}
              <Reveal delay={150}>
                {invitation.blessing && <p className="nr-blessing">{invitation.blessing}</p>}
                {!hasParentsLines(invitation) && <p className={`nr-eyebrow ${local} mt-6`}>{t.together}</p>}
                {invitation.hostLine && <p className="nr-hostline">{invitation.hostLine}</p>}
              </Reveal>

              <h1 ref={headingRef} tabIndex={-1} className="nr-names outline-none">
                <span className="nr-name" style={{ animationDelay: '0.3s' }}>
                  <Parents text={invitation.partnerOneParents} />
                  {one}
                </span>
                <span className="nr-amp" style={{ animationDelay: '0.6s' }}>
                  {t.and}
                </span>
                <span className="nr-name" style={{ animationDelay: '0.85s' }}>
                  <Parents text={invitation.partnerTwoParents} />
                  {two}
                </span>
              </h1>

              <Reveal delay={1000}>
                <Rule />
                <p className="nr-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
              </Reveal>
              <Reveal delay={1200}>
                <p className="nr-date">{date || '—'}</p>
                {invitation.venueName && <p className={`nr-venue ${local}`}>{invitation.venueName}</p>}
              </Reveal>
            </div>
          </section>

          {photos.length > 0 && (
            <section className="nr-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`nr-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`nr-photos ${galleryClass(photos.length, 4)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 120} className="nr-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="nr-section">
            <div className="nr-details">
              <Reveal className="nr-panel">
                <CalendarDays className="nr-icon" size={20} aria-hidden="true" />
                <p className={`nr-eyebrow ${local}`}>{t.when}</p>
                <p className="nr-panel-title">{date || '—'}</p>
                {time && (
                  <p className="nr-sub">
                    <Clock size={14} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="nr-panel" delay={120}>
                <MapPin className="nr-icon" size={20} aria-hidden="true" />
                <p className={`nr-eyebrow ${local}`}>{t.where}</p>
                <p className="nr-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="nr-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="nr-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="nr-sub">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {ceremonies.length > 0 && (
            <section className="nr-section" aria-labelledby="nr-cer-h">
              <Reveal className="nr-panel">
                <h2 id="nr-cer-h" className={`nr-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="nr-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="nr-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                      <p className="nr-cer-name">{c.name}</p>
                      {c.venue && <p className="nr-sub">{c.venue}</p>}
                      {c.note && <p className="nr-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          <section className="nr-section pb-16" aria-labelledby="nr-rsvp-h">
            <Reveal className="nr-panel nr-rsvp">
              <p className={`nr-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="nr-rsvp-h" className="nr-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="nr-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-14 text-center">
              <img className="nr-sign-rose" src={img('rose')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="nr-sign">
                {one} <span className="nr-amp">{t.and}</span> {two}
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
