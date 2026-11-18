// White Lily: black and white with white lilies, built around the couple's photos.
//
// Opening: on black textured paper, a single closed white lily bud with the couple's names.
// "Open Invitation" → the bud opens into a full lily, five petals drift away and a soft white light
// fills the screen, then the invitation appears.
// The invitation: white cotton paper with black type and lily sprays in the corners, then sections
// that alternate black and white: the photos, the details, the celebrations and the reply.
// The lilies and papers are images in /public/white-lily; everything else is drawn in code.

import { useEffect, useRef, useState } from 'react'
import { MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, names, runTimeline, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './whiteLily.css'

const REVEAL_AT = 2400
const DONE_AT = 3200

const img = (name) => `${import.meta.env.BASE_URL}white-lily/${name}.webp`
const first = (s) => (s || '').trim().charAt(0).toUpperCase()

// The papers, as CSS variables, so every section can use them
const PAPERS = {
  '--wl-dark': `url(${img('bg-dark')})`,
  '--wl-dark-tall': `url(${img('bg-dark-tall')})`,
  '--wl-light': `url(${img('bg-light')})`,
  '--wl-light-tall': `url(${img('bg-light-tall')})`,
}

// The petals that drift away when the lily opens: where they fly (vw / vh), how far they turn
const PETALS = [
  { n: 1, x: -38, y: -30, r: -140, d: 0 },
  { n: 2, x: 36, y: -36, r: 120, d: 0.08 },
  { n: 3, x: -30, y: 34, r: 160, d: 0.16 },
  { n: 4, x: 42, y: 18, r: -110, d: 0.1 },
  { n: 5, x: 6, y: -46, r: 200, d: 0.2 },
]

// "12 · DECEMBER · 2026" (English); other languages show their own written date
function DateLine({ iso, lang }) {
  if (!iso) return null
  if (lang !== 'en') return <p className="wl-date is-local">{formatDate(iso, lang)}</p>
  return (
    <p className="wl-date">
      <span>{formatDate(iso, 'en', { weekday: 'long' })}</span>
      <span className="wl-date-day">{formatDate(iso, 'en', { day: 'numeric' })}</span>
      <span>{formatDate(iso, 'en', { month: 'long', year: 'numeric' })}</span>
    </p>
  )
}

function Heading({ id, children, local }) {
  return (
    <Reveal className="wl-heading">
      <span className="wl-hair" aria-hidden="true" />
      <h2 id={id} className={`wl-eyebrow ${local}`}>
        {children}
      </h2>
      <span className="wl-hair" aria-hidden="true" />
    </Reveal>
  )
}

export default function WhiteLily({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
  const { one, two } = names(invitation)
  const photos = invitation.photos || []
  const cover = photos[0]?.url
  // With more than one photo, the gallery shows them all (cover included)
  const gallery = photos.length > 1 ? photos : []

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

  return (
    <>
      {/* ---------- Opening ---------- */}
      {phase !== 'open' && (
        <div
          className={`wl-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          style={PAPERS}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <div className="wl-stage" lang={lang}>
            <p className={`wl-eyebrow ${local} wl-fade wl-in-1`}>{guestName ? t.forGuest(guestName) : t.theWeddingOf}</p>
            <div className="wl-flower" aria-hidden="true">
              <img className="wl-bud" src={img('bud')} alt="" decoding="async" />
              <img className="wl-bloom" src={img('bloom')} alt="" decoding="async" />
              <span className="wl-petals">
                {PETALS.map((p) => (
                  <img
                    key={p.n}
                    src={img(`petal-${p.n}`)}
                    alt=""
                    decoding="async"
                    style={{ '--x': `${p.x}vw`, '--y': `${p.y}vh`, '--r': `${p.r}deg`, animationDelay: `${0.9 + p.d}s` }}
                  />
                ))}
              </span>
              <span className="wl-glow" />
            </div>
            <p className="wl-open-names wl-fade wl-in-2">
              <span>{one}</span>
              <span className="wl-amp">{t.and}</span>
              <span>{two}</span>
            </p>
            {invitation.eventDate && (
              <p className="wl-open-date wl-fade wl-in-3">
                <span className="wl-hair" aria-hidden="true" />
                {latin ? formatDate(invitation.eventDate, 'en', { day: 'numeric', month: 'long', year: 'numeric' }) : date}
                <span className="wl-hair" aria-hidden="true" />
              </p>
            )}
            <button ref={openBtnRef} type="button" className="wl-open-btn" onClick={open} disabled={phase !== 'closed'}>
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
        <main className={`wl-invite ${phase === 'revealing' ? 'is-entering' : ''}`} style={PAPERS} lang={lang}>
          <section className="wl-hero wl-light">
            <img className="wl-corner is-left" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
            <img className="wl-corner is-right" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
            <div className="wl-hero-inner">
              <Reveal variant="fade">
                {invitation.blessing && <p className="wl-blessing">{invitation.blessing}</p>}
                {!guestNamedInLine(invitation) && <p className={`wl-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                {!hasParentsLines(invitation) && <p className={`wl-eyebrow ${local}`}>{t.together}</p>}
                {invitation.hostLine && <p className="wl-hostline">{invitation.hostLine}</p>}
              </Reveal>

              <h1 ref={headingRef} tabIndex={-1} className="wl-names outline-none">
                <span className="wl-name" style={{ animationDelay: '0.2s' }}>
                  <Parents text={invitation.partnerOneParents} />
                  {one}
                </span>
                <span className="wl-amp" style={{ animationDelay: '0.45s' }}>
                  {t.and}
                </span>
                <span className="wl-name" style={{ animationDelay: '0.65s' }}>
                  <Parents text={invitation.partnerTwoParents} />
                  {two}
                </span>
              </h1>

              <Reveal delay={700}>
                <span className="wl-rule" aria-hidden="true" />
                <p className="wl-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
              </Reveal>
              <Reveal delay={850}>
                <DateLine iso={invitation.eventDate} lang={lang} />
                {time && <p className="wl-time">{time}</p>}
                {invitation.venueName && <p className={`wl-venue ${local}`}>{invitation.venueName}</p>}
              </Reveal>

              {cover && gallery.length === 0 && (
                <Reveal variant="scale" className="wl-cover">
                  <img src={cover} alt="" decoding="async" />
                </Reveal>
              )}
            </div>
          </section>

          {gallery.length > 0 && (
            <section className="wl-band wl-dark" aria-labelledby="wl-moments-h">
              <div className="wl-section">
                <Heading id="wl-moments-h" local={local}>
                  {t.ourMoments}
                </Heading>
                <div className={`wl-photos ${galleryClass(gallery.length, 6)}`}>
                  {gallery.map((p, i) => (
                    <Reveal key={p.id} variant="up" delay={(i % 3) * 120} className="wl-photo">
                      <img src={p.url} alt="" loading="lazy" />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="wl-band wl-light" aria-label={`${t.when} · ${t.where}`}>
            <div className="wl-section">
              <div className="wl-details">
                <Reveal className="wl-card">
                  <p className={`wl-eyebrow ${local}`}>{t.when}</p>
                  <p className="wl-card-title">{date || '—'}</p>
                  {time && <p className="wl-sub">{time}</p>}
                </Reveal>
                <Reveal className="wl-card" delay={120}>
                  <p className={`wl-eyebrow ${local}`}>{t.where}</p>
                  <p className="wl-card-title">{invitation.venueName || '—'}</p>
                  {invitation.address && <p className="wl-sub">{invitation.address}</p>}
                  {invitation.mapUrl && (
                    <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="wl-link">
                      <MapPin size={14} aria-hidden="true" /> {t.viewMap}
                    </a>
                  )}
                </Reveal>
              </div>
              {invitation.dressCode && (
                <Reveal className="wl-dress">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </Reveal>
              )}
            </div>
          </section>

          {ceremonies.length > 0 && (
            <section className="wl-band wl-dark" aria-labelledby="wl-cer-h">
              <div className="wl-section">
                <Heading id="wl-cer-h" local={local}>
                  {t.programme}
                </Heading>
                <ol className="wl-timeline">
                  {ceremonies.map((c, i) => (
                    <Reveal as="li" key={`${c.name}-${i}`} delay={i * 100}>
                      <p className="wl-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                      <p className="wl-cer-name">{c.name}</p>
                      {c.venue && <p className="wl-sub">{c.venue}</p>}
                      {c.note && <p className="wl-sub italic">{c.note}</p>}
                    </Reveal>
                  ))}
                </ol>
              </div>
            </section>
          )}

          <section className="wl-band wl-light wl-end" aria-labelledby="wl-rsvp-h">
            <div className="wl-section">
              <Reveal className="wl-card wl-rsvp">
                <p className={`wl-eyebrow ${local}`}>{t.kindlyReply}</p>
                <h2 id="wl-rsvp-h" className="wl-card-title big">
                  {t.rsvpPrompt}
                </h2>
                {invitation.rsvpDeadline && (
                  <p className="wl-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
                )}
                <div className="mx-auto max-w-md">{rsvp}</div>
              </Reveal>
              <Reveal className="wl-sign-off">
                <img className="wl-sign-lily" src={img('bloom')} alt="" aria-hidden="true" loading="lazy" />
                <p className="wl-monogram" aria-hidden="true">
                  {first(invitation.partnerOne) || '·'}
                  <span className="wl-amp">&</span>
                  {first(invitation.partnerTwo) || '·'}
                </p>
                <p className="wl-sign">
                  {one} <span className="wl-amp">{t.and}</span> {two}
                </p>
                {guestName && <p className="wl-note">{t.personalNote(guestName)}</p>}
              </Reveal>
            </div>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
