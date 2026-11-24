// Template 2 — Modern Romance: contemporary, editorial, photographic.
//
// Opening: the couple's cover photo full screen with a slow cinematic zoom, editorial type and
// the date. "Open Invitation" → the photo lifts away like a film cut into a magazine-style page:
// large typography, a photo story, details, a timeline of the celebrations and the RSVP.
// Without photos, the opening is a title card on champagne silk, with a fine-line botanical
// drawing itself beside the names (art in /public/modern-romance).

import { useEffect, useRef, useState } from 'react'
import { ArrowDown, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, initials, names, numericDate, runTimeline, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const REVEAL_AT = 1300
const DONE_AT = 2200
const ART = `${import.meta.env.BASE_URL}modern-romance/`
const img = (name) => `${ART}${name}.webp`

// Champagne silk, cropped tall on phones
function Silk({ className = '' }) {
  return (
    <picture className={`mr-silk ${className}`} aria-hidden="true">
      <source media="(min-aspect-ratio: 1/1)" srcSet={img('silk')} />
      <img src={img('silk-tall')} alt="" decoding="async" />
    </picture>
  )
}
function Botanical({ className = '' }) {
  return <img className={`mr-botanical ${className}`} src={img('line-botanical')} alt="" aria-hidden="true" decoding="async" />
}

export default function ModernRomance({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const { one, two } = names(invitation)
  const photos = invitation.photos || []
  const cover = photos[0]?.url
  // The first photo is the cover; with more than one photo, the gallery shows them all (cover included)
  const gallery = photos.length > 1 ? photos : []

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

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const eyebrow = latin ? 'mr-eyebrow' : 'mr-eyebrow is-local'

  return (
    <>
      {/* ---------- Opening: full-screen photograph ---------- */}
      {phase !== 'open' && (
        <div className={`mr-opening ${cover ? 'has-photo' : 'no-photo'} ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={t.openInvitation}>
          {cover ? (
            <img className="mr-cover" src={cover} alt="" />
          ) : (
            <>
              <Silk />
              <span className="mr-monogram" aria-hidden="true">
                {initials(invitation.partnerOne, invitation.partnerTwo)}
              </span>
              <Botanical className="is-drawing" />
            </>
          )}
          <span className="mr-shade" aria-hidden="true" />

          <p className={`${eyebrow} mr-guest`} lang={lang}>
            {guestName ? t.forGuest(guestName) : t.youAreInvited}
          </p>

          <div className="mr-open-content" lang={lang}>
            <p className={eyebrow}>{t.theWeddingOf}</p>
            <p className="mr-open-names">
              <span>{one}</span>
              <span className="mr-open-amp">{t.and}</span>
              <span>{two}</span>
            </p>
            <p className="mr-open-date">{latin ? numericDate(invitation.eventDate) : date}</p>
            <button ref={openBtnRef} type="button" className="mr-open-btn" onClick={open} disabled={phase !== 'closed'}>
              {t.openInvitation}
            </button>
          </div>

        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`mr-invite ${cover ? '' : 'no-photo'} ${phase === 'opening' ? 'is-waiting' : 'is-entering'}`} lang={lang} aria-hidden={phase === 'opening' ? 'true' : undefined}>
          <section className="mr-hero">
            {!cover && <Silk className="is-backdrop" />}
            <div className="mr-hero-text">
              <Reveal variant="fade">
                {!guestNamedInLine(invitation) && <p className="mr-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
              </Reveal>
              {invitation.blessing && (
                <Reveal variant="fade" delay={100}>
                  <p className="mr-blessing">{invitation.blessing}</p>
                </Reveal>
              )}
              <h1 ref={headingRef} tabIndex={-1} className="mr-names outline-none">
                <span className="mr-name" style={{ animationDelay: '0.3s' }}>
                  <Parents text={invitation.partnerOneParents} />
                  {one}
                </span>
                <span className="mr-amp" style={{ animationDelay: '0.6s' }}>
                  {t.and}
                </span>
                <span className="mr-name" style={{ animationDelay: '0.8s' }}>
                  <Parents text={invitation.partnerTwoParents} />
                  {two}
                </span>
              </h1>
              <Reveal delay={1000}>
                <div className="mr-rule" aria-hidden="true" />
                <p className="mr-hero-date">{latin ? numericDate(invitation.eventDate) : date}</p>
                {invitation.venueName && <p className="mr-hero-venue">{invitation.venueName}</p>}
              </Reveal>
            </div>
            {cover ? (
              <Reveal variant="scale" delay={200} className="mr-hero-photo">
                <img src={cover} alt="" />
              </Reveal>
            ) : (
              <Reveal variant="fade" delay={300} className="mr-hero-art">
                <Botanical />
              </Reveal>
            )}
            <ArrowDown className="mr-scroll" size={20} aria-label={t.scrollDown} />
          </section>

          <section className="mr-section mr-words">
            <Reveal>
              {/* the hosts' own line replaces "together with their families" */}{!hasParentsLines(invitation) && !invitation.hostLine && <p className={eyebrow}>{t.together}</p>}
              {invitation.hostLine && <p className="mr-hostline">{invitation.hostLine}</p>}
              <p className="mr-message">{invitation.message || t.defaultInvite}</p>
              <InviteLine invitation={invitation} guestName={guestName} />
            </Reveal>
          </section>

          {gallery.length > 0 && (
            <section className="mr-section" aria-label={t.ourMoments}>
              <Reveal>
                <p className={eyebrow}>{t.ourMoments}</p>
              </Reveal>
              <div className={`mr-gallery ${galleryClass(gallery.length, 6)}`}>
                {gallery.map((p, i) => (
                  <Reveal key={p.id} variant="up" delay={i * 120} className="mr-gallery-item">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="mr-section">
            <div className="mr-details">
              <Reveal className="mr-detail">
                <p className={eyebrow}>{t.when}</p>
                <p className="mr-detail-big">{date || '—'}</p>
                {time && <p className="mr-detail-text">{time}</p>}
              </Reveal>
              <Reveal className="mr-detail" delay={120}>
                <p className={eyebrow}>{t.where}</p>
                <p className="mr-detail-big">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="mr-detail-text">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="mr-link">
                    <MapPin size={14} aria-hidden="true" /> {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-8">
                <p className="mr-detail-text inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {ceremonies.length > 0 && (
            <section className="mr-section" aria-labelledby="mr-cer-h">
              <Reveal>
                <h2 id="mr-cer-h" className={eyebrow}>
                  {t.programme}
                </h2>
              </Reveal>
              <ol className="mr-timeline">
                {ceremonies.map((c, i) => (
                  <Reveal as="li" key={`${c.name}-${i}`} delay={i * 100}>
                    <span className="mr-tl-num" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="mr-tl-name">{c.name}</h3>
                      <p className="mr-detail-text">{[c.dateText, c.timeText, c.venue].filter(Boolean).join(' · ')}</p>
                      {c.note && <p className="mr-detail-text italic">{c.note}</p>}
                    </div>
                  </Reveal>
                ))}
              </ol>
            </section>
          )}

          <section className="mr-section pb-16" aria-labelledby="mr-rsvp-h">
            <Reveal className="mr-rsvp">
              <p className={eyebrow}>{t.kindlyReply}</p>
              <h2 id="mr-rsvp-h" className="mr-rsvp-title">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="mr-detail-text">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-14 text-center">
              <Botanical className="is-sign" />
              <p className="mr-sign">
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
