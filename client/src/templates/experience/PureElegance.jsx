// Template 1 — Pure Elegance: ivory linen, champagne roses and gold, classic letterpress luxury.
//
// Opening: an ivory linen envelope sealed with a gold wax seal (the couple's initials pressed
// into it) rests between champagne roses. "Open Invitation" → the seal lifts away, the flap
// folds open, and a letterpress card slides up out of the envelope → the scene dissolves into
// the invitation, which unfolds as a set of matching cards.
//
// The envelope, wax seal and roses are illustrations (/public/pure-elegance); the paper,
// borders, gold lettering and the flap/card movement are drawn in code.
//
// Photos: the first is the cover, in a gold-ringed portrait above the names; with more than one,
// a gallery of all of them (cover included) follows the details, like the other Premium designs.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './pureElegance.css'

// Timeline after the tap (ms): seal lifts, flap opens, card slides up, then the scene dissolves
const REVEAL_AT = 2900
const DONE_AT = 3800
const ART = `${import.meta.env.BASE_URL}pure-elegance/`
const img = (name) => `${ART}${name}.webp`

function initials(a, b) {
  const first = (s) => (s || '').trim().charAt(0).toUpperCase() || '·'
  return `${first(a)}&${first(b)}`
}

// The gold wax seal with the couple's initials pressed into it
function Seal({ invitation, className = '' }) {
  return (
    <span className={`pl-seal ${className}`} aria-hidden="true">
      <img src={img('wax-seal')} alt="" decoding="async" />
      <span className="pl-seal-text">{initials(invitation.partnerOne, invitation.partnerTwo)}</span>
    </span>
  )
}

// Champagne roses (the art is a top-left piece; `at` turns it for other corners)
function Roses({ at, className = '' }) {
  return <img className={`pl-roses ${at} ${className}`} src={img('florals')} alt="" aria-hidden="true" decoding="async" />
}

function GoldRule({ className = '' }) {
  return (
    <span className={`pl-rule ${className}`} aria-hidden="true">
      <span />
    </span>
  )
}

export default function PureElegance({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed') // closed → opening → revealing → open
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
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
    const id = setTimeout(() => openBtnRef.current?.focus({ preventScroll: true }), prefersReducedMotion() ? 0 : 1600)
    return () => clearTimeout(id)
  }, [phase, poster])

  function open() {
    music.play() // inside the tap, so browsers allow sound
    timers.current.forEach(clearTimeout)
    if (prefersReducedMotion()) {
      setPhase('open')
      return
    }
    setPhase('opening')
    timers.current = [setTimeout(() => setPhase('revealing'), REVEAL_AT), setTimeout(() => setPhase('open'), DONE_AT)]
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const photos = invitation.photos || []
  const cover = photos[0]?.url

  return (
    <>
      {/* ---------- Opening: the envelope ---------- */}
      {phase !== 'open' && (
        <div
          className={`pl-opening ${phase === 'opening' || phase === 'revealing' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <Roses at="tl" className="pl-scene-roses" />
          <Roses at="br" className="pl-scene-roses" />

          <div className="pl-stage" lang={lang}>
            <p className={`pl-eyebrow ${local} pl-step s1`}>{t.youAreInvited}</p>
            <p className="pl-for pl-step s1">{guestName ? t.forGuest(guestName) : `${one} ${t.and} ${two}`}</p>

            <div className="pl-envelope pl-step s0">
              <span className="pl-env-inside" aria-hidden="true" />
              {/* the card inside, which slides out */}
              <div className="pl-env-card" aria-hidden="true">
                <Roses at="tl" className="pl-card-roses" />
                <p className={`pl-card-eyebrow ${local}`}>{t.theWeddingOf}</p>
                <p className="pl-card-names">
                  <span>{one}</span>
                  <span className="pl-amp">{t.and}</span>
                  <span>{two}</span>
                </p>
                {date && <p className="pl-card-date">{date}</p>}
              </div>
              <span className="pl-env-pocket" aria-hidden="true" />
              <span className="pl-env-flap" aria-hidden="true" />
              <span className="pl-env-flap-back" aria-hidden="true" />
              <Seal invitation={invitation} />
            </div>

            <button ref={openBtnRef} type="button" className="pl-open-btn pl-step s2" onClick={open} disabled={phase !== 'closed'}>
              {t.openInvitation}
            </button>
            <p className="pl-hint pl-step s2">{t.tapToOpen}</p>
          </div>

        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`pl-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="pl-section pl-hero">
            <article className="pl-paper pl-main">
              <Roses at="tl" />
              <Roses at="br" />
              <div className="pl-main-body">
                {invitation.blessing && (
                  <Reveal variant="fade">
                    <p className="pl-blessing">{invitation.blessing}</p>
                  </Reveal>
                )}
                {!guestNamedInLine(invitation) && (
                  <Reveal variant="fade">
                    <p className={`pl-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>
                  </Reveal>
                )}
                {cover && (
                  <Reveal variant="scale" delay={100}>
                    <div className="pl-portrait">
                      <img src={cover} alt="" />
                    </div>
                  </Reveal>
                )}
                <Reveal delay={200}>
                  {/* the hosts' own line replaces "together with their families" */}{!hasParentsLines(invitation) && !invitation.hostLine && <p className={`pl-eyebrow ${local}`}>{t.together}</p>}
                  {invitation.hostLine && <p className="pl-hostline">{invitation.hostLine}</p>}
                </Reveal>

                <h1 ref={headingRef} tabIndex={-1} className="pl-names outline-none">
                  <span className="pl-name" style={{ animationDelay: '0.4s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="pl-amp" style={{ animationDelay: '0.7s' }}>
                    {t.and}
                  </span>
                  <span className="pl-name" style={{ animationDelay: '0.9s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>

                <Reveal delay={1000}>
                  <GoldRule />
                  <p className="pl-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                </Reveal>

                <Reveal delay={1200}>
                  <p className="pl-date">{date || '—'}</p>
                  {time && <p className={`pl-when ${local}`}>{time}</p>}
                  {invitation.venueName && <p className={`pl-venue ${local}`}>{invitation.venueName}</p>}
                </Reveal>
              </div>
            </article>
          </section>

          <section className="pl-section">
            <div className="pl-details">
              <Reveal className="pl-paper pl-panel">
                <CalendarDays className="pl-icon" size={22} aria-hidden="true" />
                <p className={`pl-eyebrow ${local}`}>{t.when}</p>
                <p className="pl-panel-title">{date || '—'}</p>
                {time && (
                  <p className="pl-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="pl-paper pl-panel" delay={120}>
                <MapPin className="pl-icon" size={22} aria-hidden="true" />
                <p className={`pl-eyebrow ${local}`}>{t.where}</p>
                <p className="pl-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="pl-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="pl-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="pl-chip">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: church ceremony, Poruwa ceremony, reception… */}
          {ceremonies.length > 0 && (
            <section className="pl-section" aria-labelledby="pl-cer-h">
              <Reveal className="pl-paper pl-panel">
                <h2 id="pl-cer-h" className={`pl-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <GoldRule />
                <ol className="pl-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="pl-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="pl-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="pl-sub">{c.venue}</p>}
                      {c.note && <p className="pl-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 1 && (
            <section className="pl-section" aria-labelledby="pl-photos-h">
              <Reveal className="pl-paper pl-panel">
                <h2 id="pl-photos-h" className={`pl-eyebrow ${local}`}>
                  {t.ourMoments}
                </h2>
                <GoldRule />
                <div className={`pl-photos ${galleryClass(photos.length, 6)}`}>
                  {photos.map((p, i) => (
                    <Reveal key={p.id} variant="scale" delay={i * 100} className="pl-photo">
                      <img src={p.url} alt="" loading="lazy" />
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            </section>
          )}

          <section className="pl-section" aria-labelledby="pl-rsvp-h">
            <Reveal className="pl-paper pl-panel">
              <p className={`pl-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="pl-rsvp-h" className="pl-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="pl-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
          </section>

          <section className="pl-section pl-last">
            <Reveal className="text-center">
              <Seal invitation={invitation} className="is-small" />
              <p className="pl-sign">
                {one} <span className="pl-amp">{t.and}</span> {two}
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
