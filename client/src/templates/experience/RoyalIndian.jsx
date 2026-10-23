// Template 3 — Royal Indian Wedding: deep crimson and maroon, antique gold, warm ivory.
//
// Opening: carved crimson-and-gold palace doors in a marble gateway, a marigold toran hanging
// across the top. "Open Invitation" → a gold shimmer passes over the doors, they swing open onto
// warm light and a glowing gold mandala, marigold petals fall, and the invitation is revealed
// inside an arch frame. The blessing line and the list of ceremonies are the couple's own.
// The doors, toran and mandala are illustrations (/public/royal-red); frames are drawn in code.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import Petals from './Petals'
import { ArchTop, Finial, Mandala, OrnamentDivider, Paisley } from './ornaments'
import { ceremonyList, names, runTimeline, timeRange, galleryClass } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const REVEAL_AT = 2900
const DONE_AT = 3800
const ART = `${import.meta.env.BASE_URL}royal-red/`
const img = (name) => `${ART}${name}.webp`

function Toran({ className = '' }) {
  return <img className={`ri-toran ${className}`} src={img('toran')} alt="" aria-hidden="true" decoding="async" />
}
function GoldMandala({ className = '' }) {
  return <img className={`ri-gold-mandala ${className}`} src={img('mandala')} alt="" aria-hidden="true" decoding="async" />
}

function Corners() {
  return (
    <>
      <Paisley className="ri-corner tl" />
      <Paisley className="ri-corner tr" />
      <Paisley className="ri-corner bl" />
      <Paisley className="ri-corner br" />
    </>
  )
}

export default function RoyalIndian({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const { one, two } = names(invitation)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (poster) return // thumbnails never take keyboard focus
    if (phase === 'closed') openBtnRef.current?.focus({ preventScroll: true })
    if (phase === 'open') headingRef.current?.focus({ preventScroll: true })
  }, [phase, poster])

  function open() {
    music.play()
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
  const eyebrow = latin ? 'ri-eyebrow' : 'ri-eyebrow is-local'
  const greeting = guestName ? t.dear(guestName) : t.dearGuest

  return (
    <>
      {/* ---------- Opening: the palace gateway ---------- */}
      {phase !== 'open' && (
        <div className={`ri-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={t.openInvitation}>
          {phase !== 'closed' && <Petals fixed count={18} palette="marigold" duration={[7, 12]} />}

          <div className="ri-open-text" lang={lang}>
            {invitation.blessing && <p className="ri-blessing">{invitation.blessing}</p>}
            <p className={eyebrow}>{t.youAreInvited}</p>
            <p className="ri-for">{guestName ? t.forGuest(guestName) : `${one} & ${two}`}</p>
          </div>

          {/* the palace doors: one picture, split down the middle so each half swings open */}
          <div className="ri-gateway" aria-hidden="true">
            <div className="ri-gate">
              <div className="ri-gate-light">
                <GoldMandala />
              </div>
              <div className="ri-leaf left" />
              <div className="ri-leaf right" />
              <span className="ri-shimmer" />
            </div>
            <Toran />
          </div>

          <button ref={openBtnRef} type="button" className="ri-open-btn" onClick={open} disabled={phase !== 'closed'} lang={lang}>
            {t.openInvitation}
          </button>
          <p className="ri-hint" lang={lang}>
            {t.tapToOpen}
          </p>

          {phase !== 'closed' && (
            <button type="button" className="ei-skip" onClick={skip} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`ri-invite ${phase === 'opening' ? 'is-waiting' : 'is-entering'}`} lang={lang} aria-hidden={phase === 'opening' ? 'true' : undefined}>
          <Toran className="is-hero" />
          <section className="ri-section ri-hero">
            <Petals count={10} palette="rose" className="ri-hero-petals" />
            <div className="ri-arch-card">
              <Finial className="ri-card-finial" />
              <ArchTop className="ri-card-arch" fill="var(--ei-card)" />
              <div className="ri-card-body">
                <Corners />
                {invitation.blessing && (
                  <Reveal variant="fade">
                    <p className="ri-blessing">{invitation.blessing}</p>
                  </Reveal>
                )}
                <Reveal variant="scale" delay={150}>
                  <GoldMandala className="is-hero" />
                </Reveal>
                <Reveal delay={300}>
                  {!guestNamedInLine(invitation) && <p className="ri-greeting">{greeting}</p>}
                  {!hasParentsLines(invitation) && <p className={`${eyebrow} mt-5`}>{t.together}</p>}
                  {invitation.hostLine && <p className="ri-hostline">{invitation.hostLine}</p>}
                </Reveal>

                <h1 ref={headingRef} tabIndex={-1} className="ri-names outline-none">
                  <span className="ri-name" style={{ animationDelay: '0.5s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="ri-amp" style={{ animationDelay: '0.9s' }}>
                    {t.and}
                  </span>
                  <span className="ri-name" style={{ animationDelay: '1.2s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>

                <Reveal delay={1500}>
                  <p className="ri-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                  <OrnamentDivider className="ri-divider" />
                </Reveal>
                <Reveal delay={1800}>
                  <p className={`ri-date ${latin ? '' : 'is-local'}`}>{date || '—'}</p>
                  {time && <p className="ri-time">{time}</p>}
                  {invitation.venueName && <p className="ri-venue-line">{invitation.venueName}</p>}
                </Reveal>
              </div>
            </div>
          </section>

          {/* Optional: only shown when the couple has added ceremonies (many celebrations have just one event) */}
          {ceremonies.length > 0 && (
            <section className="ri-section pb-8" aria-labelledby="ri-cer-h">
              <Reveal>
                <h2 id="ri-cer-h" className={`ri-section-title ${latin ? '' : 'is-local'}`}>
                  {t.programme}
                </h2>
                <OrnamentDivider className="ri-divider" />
              </Reveal>
              <ol className={`ri-ceremonies count-${ceremonies.length}`}>
                {ceremonies.map((c, i) => (
                  <Reveal as="li" key={`${c.name}-${i}`} delay={i * 120} className="ri-ceremony">
                    <Mandala className="ri-ceremony-mark" detail="simple" />
                    <h3>{c.name}</h3>
                    {(c.dateText || c.timeText) && (
                      <p className="ri-ceremony-when">
                        {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                        {c.dateText && c.timeText && ' · '}
                        {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                      </p>
                    )}
                    {c.venue && <p className="ri-ceremony-where">{c.venue}</p>}
                    {c.note && <p className="ri-ceremony-note">{c.note}</p>}
                  </Reveal>
                ))}
              </ol>
            </section>
          )}

          {photos.length > 0 && (
            <section className="ri-section pb-8" aria-label={t.ourMoments}>
              <div className={`ri-photos ${galleryClass(photos.length, 3)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 150} className="ri-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="ri-section pb-8">
            <Reveal className="ri-panel">
              <Corners />
              <p className={eyebrow}>{t.venue}</p>
              <MapPin className="mx-auto mt-4" size={24} style={{ color: 'var(--ei-accent-text)' }} aria-hidden="true" />
              <p className="ri-panel-title">{invitation.venueName || '—'}</p>
              {invitation.address && <p className="ri-panel-text">{invitation.address}</p>}
              <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[15px]" style={{ color: 'var(--ei-muted)' }}>
                {date && (
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} aria-hidden="true" /> {date}
                  </span>
                )}
                {time && (
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} aria-hidden="true" /> {time}
                  </span>
                )}
              </div>
              {invitation.mapUrl && (
                <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="ri-map-btn">
                  <MapPin size={15} aria-hidden="true" /> {t.viewMap}
                </a>
              )}
              {invitation.dressCode && (
                <p className="mt-5 inline-flex items-center gap-2 text-[15px]" style={{ color: 'var(--ei-muted)' }}>
                  <Shirt size={16} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              )}
            </Reveal>
          </section>

          <section className="ri-section pb-16" aria-labelledby="ri-rsvp-h">
            <Reveal className="ri-panel">
              <Corners />
              <p className={eyebrow}>{t.kindlyReply}</p>
              <h2 id="ri-rsvp-h" className="ri-panel-title">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="mt-1 text-[14px]" style={{ color: 'var(--ei-muted)' }}>
                  {t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}
                </p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>

            <Reveal className="mt-12 text-center">
              <GoldMandala className="is-sign" />
              <p className="ri-sign">
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
