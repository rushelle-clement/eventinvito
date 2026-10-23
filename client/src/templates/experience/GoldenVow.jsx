// Golden Vow: modern gold, ivory and white, built around the couple's photos.
//
// Opening: on ivory, the couple's cover photo in a tall arch with a fine gold outline, the names
// in large serif type and the date between gold hairlines. "Open Invitation" → the arch opens
// out until the photo fills the screen, then the invitation appears.
// The invitation: an editorial hero (names beside the arched photo on wide screens), a modern
// three-part date, a staggered photo gallery, numbered details, a gold timeline and a monogram.
// Without photos the arch holds the couple's monogram on gold and ivory. All drawn in code.

import { useEffect, useRef, useState } from 'react'
import { MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, names, runTimeline, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './goldenVow.css'

const REVEAL_AT = 1700
const DONE_AT = 2500

const first = (s) => (s || '').trim().charAt(0).toUpperCase()

// The arch: the photo, or the couple's monogram on gold and ivory
function Arch({ photo, one, two, className = '', children }) {
  return (
    <span className={`gv-arch ${photo ? 'has-photo' : 'is-monogram'} ${className}`}>
      <span className="gv-arch-window">
        {photo ? (
          <img src={photo} alt="" decoding="async" />
        ) : (
          <span className="gv-monogram" aria-hidden="true">
            <span>{first(one) || '·'}</span>
            <span className="gv-monogram-amp">&</span>
            <span>{first(two) || '·'}</span>
          </span>
        )}
      </span>
      {children}
    </span>
  )
}

// "SATURDAY | 12 | DECEMBER 2026" (English); other languages show their own written date
function DateBlock({ iso, lang, time }) {
  if (!iso) return null
  if (lang !== 'en') {
    return (
      <div className="gv-date is-local">
        <p className="gv-date-full">{formatDate(iso, lang)}</p>
        {time && <p className="gv-date-time">{time}</p>}
      </div>
    )
  }
  const weekday = formatDate(iso, 'en', { weekday: 'long' })
  const day = formatDate(iso, 'en', { day: 'numeric' })
  const monthYear = formatDate(iso, 'en', { month: 'long', year: 'numeric' })
  return (
    <div className="gv-date">
      <div className="gv-date-row">
        <span className="gv-date-side">{weekday}</span>
        <span className="gv-date-day">{day}</span>
        <span className="gv-date-side">{monthYear}</span>
      </div>
      {time && <p className="gv-date-time">{time}</p>}
    </div>
  )
}

export default function GoldenVow({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
  const { one, two } = names(invitation)
  const photos = invitation.photos || []
  const cover = photos[0]?.url
  // The cover opens the invitation; with more than one photo, the gallery shows them all (cover included)
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
          className={`gv-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <span className="gv-lines" aria-hidden="true" />
          <div className="gv-stage" lang={lang}>
            <p className={`gv-eyebrow ${local} gv-fade`}>{guestName ? t.forGuest(guestName) : t.theWeddingOf}</p>
            <Arch photo={cover} one={invitation.partnerOne} two={invitation.partnerTwo} className="gv-open-arch" />
            <p className="gv-open-names gv-fade">
              <span>{one}</span>
              <span className="gv-amp">{t.and}</span>
              <span>{two}</span>
            </p>
            {invitation.eventDate && (
              <p className="gv-open-date gv-fade">
                <span className="gv-hair" aria-hidden="true" />
                {latin ? formatDate(invitation.eventDate, 'en', { day: 'numeric', month: 'long', year: 'numeric' }) : date}
                <span className="gv-hair" aria-hidden="true" />
              </p>
            )}
            <button ref={openBtnRef} type="button" className="gv-open-btn" onClick={open} disabled={phase !== 'closed'}>
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
        <main className={`gv-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="gv-hero">
            <span className="gv-lines" aria-hidden="true" />
            <div className="gv-hero-grid">
              <Reveal variant="scale" className="gv-hero-photo">
                <Arch photo={cover} one={invitation.partnerOne} two={invitation.partnerTwo} />
              </Reveal>

              <div className="gv-hero-text">
                <Reveal variant="fade">
                  {invitation.blessing && <p className="gv-blessing">{invitation.blessing}</p>}
                  {!guestNamedInLine(invitation) && <p className={`gv-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                  {!hasParentsLines(invitation) && <p className={`gv-eyebrow ${local}`}>{t.together}</p>}
                  {invitation.hostLine && <p className="gv-hostline">{invitation.hostLine}</p>}
                </Reveal>

                <h1 ref={headingRef} tabIndex={-1} className="gv-names outline-none">
                  <span className="gv-name" style={{ animationDelay: '0.2s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="gv-amp" style={{ animationDelay: '0.45s' }}>
                    {t.and}
                  </span>
                  <span className="gv-name" style={{ animationDelay: '0.65s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>

                <Reveal delay={700}>
                  <span className="gv-rule" aria-hidden="true" />
                  <p className="gv-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                </Reveal>
                <Reveal delay={850}>
                  <DateBlock iso={invitation.eventDate} lang={lang} time={time} />
                  {invitation.venueName && <p className={`gv-venue ${local}`}>{invitation.venueName}</p>}
                </Reveal>
              </div>
            </div>
          </section>

          {gallery.length > 0 && (
            <section className="gv-section gv-moments" aria-labelledby="gv-moments-h">
              <Reveal className="gv-heading">
                <span className="gv-hair" aria-hidden="true" />
                <h2 id="gv-moments-h" className={`gv-eyebrow ${local}`}>
                  {t.ourMoments}
                </h2>
                <span className="gv-hair" aria-hidden="true" />
              </Reveal>
              <div className={`gv-photos ${galleryClass(gallery.length, 6)}`}>
                {gallery.map((p, i) => (
                  <Reveal key={p.id} variant="up" delay={(i % 3) * 120} className="gv-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="gv-section" aria-label={`${t.when} · ${t.where}`}>
            <div className="gv-details">
              <Reveal className="gv-card">
                <span className="gv-card-num" aria-hidden="true">
                  01
                </span>
                <p className={`gv-eyebrow ${local}`}>{t.when}</p>
                <p className="gv-card-title">{date || '—'}</p>
                {time && <p className="gv-sub">{time}</p>}
              </Reveal>
              <Reveal className="gv-card" delay={120}>
                <span className="gv-card-num" aria-hidden="true">
                  02
                </span>
                <p className={`gv-eyebrow ${local}`}>{t.where}</p>
                <p className="gv-card-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="gv-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="gv-link">
                    <MapPin size={14} aria-hidden="true" /> {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="gv-dress">
                <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
              </Reveal>
            )}
          </section>

          {ceremonies.length > 0 && (
            <section className="gv-section" aria-labelledby="gv-cer-h">
              <Reveal className="gv-heading">
                <span className="gv-hair" aria-hidden="true" />
                <h2 id="gv-cer-h" className={`gv-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <span className="gv-hair" aria-hidden="true" />
              </Reveal>
              <ol className="gv-timeline">
                {ceremonies.map((c, i) => (
                  <Reveal as="li" key={`${c.name}-${i}`} delay={i * 100}>
                    <p className="gv-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                    <p className="gv-cer-name">{c.name}</p>
                    {c.venue && <p className="gv-sub">{c.venue}</p>}
                    {c.note && <p className="gv-sub italic">{c.note}</p>}
                  </Reveal>
                ))}
              </ol>
            </section>
          )}

          <section className="gv-section pb-16" aria-labelledby="gv-rsvp-h">
            <Reveal className="gv-card gv-rsvp">
              <p className={`gv-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="gv-rsvp-h" className="gv-card-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="gv-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="gv-sign-off">
              <span className="gv-seal" aria-hidden="true">
                {first(invitation.partnerOne) || '·'}
                <span className="gv-seal-amp">&</span>
                {first(invitation.partnerTwo) || '·'}
              </span>
              <p className="gv-sign">
                {one} <span className="gv-amp">{t.and}</span> {two}
              </p>
              {guestName && <p className="gv-note">{t.personalNote(guestName)}</p>}
            </Reveal>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
