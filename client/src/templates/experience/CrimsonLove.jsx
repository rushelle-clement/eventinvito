// Template 4 — Crimson Love: romantic crimson, roses, warm ivory and soft gold. Contemporary.
//
// Opening: deep crimson velvet, lush red roses opening in two corners and real rose petals
// drifting down; the names in gold script and the date fade in. "Open Invitation" → a circle
// of warm ivory grows out of the button into the invitation, framed by the same roses.
// The velvet, roses and petals are illustrations (/public/crimson-love).

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, numericDate, runTimeline, timeRange, galleryClass } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const REVEAL_AT = 1150
const DONE_AT = 1800
const ART = `${import.meta.env.BASE_URL}crimson-love/`
const img = (name) => `${ART}${name}.webp`

function rand(i, k) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Real rose petals drifting down (fixed positions per index, so they never jump)
function RosePetals({ count = 12, className = '' }) {
  return (
    <div className={`cl-petals ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const d = 11 + rand(i, 1) * 9
        return (
          <img
            key={i}
            src={img(`petal-${(i % 5) + 1}`)}
            alt=""
            decoding="async"
            style={{
              left: `${(rand(i, 2) * 100).toFixed(1)}%`,
              width: `${(22 + rand(i, 3) * 22).toFixed(0)}px`,
              '--d': `${d.toFixed(1)}s`,
              '--dl': `${(-rand(i, 4) * d).toFixed(1)}s`,
              '--sx': `${((rand(i, 5) - 0.5) * 90).toFixed(0)}px`,
              '--rot': `${((rand(i, 6) > 0.5 ? 1 : -1) * (160 + rand(i, 7) * 300)).toFixed(0)}deg`,
            }}
          />
        )
      })}
    </div>
  )
}

// The bouquet from the opening scene (bottom left) and its small rose cluster (top right)
function Roses({ at, className = '' }) {
  return <img className={`cl-roses ${at} ${className}`} src={img(at === 'bl' ? 'bouquet' : 'rose-cluster')} alt="" aria-hidden="true" decoding="async" />
}

// One photographed scene: roses, gypsophila and an ivory ribbon resting on crimson velvet
function Velvet() {
  return (
    <picture className="cl-velvet" aria-hidden="true">
      <source media="(min-aspect-ratio: 1/1)" srcSet={img('scene')} />
      <img src={img('scene-tall')} alt="" decoding="async" />
    </picture>
  )
}

export default function CrimsonLove({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const [origin, setOrigin] = useState('50% 70%')
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

  function open(e) {
    music.play()
    // The ivory circle grows from where the guest tapped
    const r = e.currentTarget.getBoundingClientRect()
    setOrigin(`${Math.round(r.left + r.width / 2)}px ${Math.round(r.top + r.height / 2)}px`)
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
  const eyebrow = latin ? 'cl-eyebrow' : 'cl-eyebrow is-local'

  return (
    <>
      {/* ---------- Opening ---------- */}
      {phase !== 'open' && (
        <div className={`cl-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={t.openInvitation}>
          <Velvet />
          <RosePetals count={14} />

          <div className="cl-open-content" lang={lang}>
            <p className={`${eyebrow} on-red`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
            <p className="cl-open-names">
              <span>{one}</span>
              <small>{t.and}</small>
              <span>{two}</span>
            </p>
            <span className="cl-open-line" aria-hidden="true" />
            <p className="cl-open-date">{latin ? numericDate(invitation.eventDate) : date}</p>
            <button ref={openBtnRef} type="button" className="cl-open-btn" onClick={open} disabled={phase !== 'closed'}>
              {t.openInvitation}
            </button>
          </div>

          <span className="cl-bloom" style={{ '--origin': origin }} aria-hidden="true" />
          {phase !== 'closed' && (
            <button type="button" className="ei-skip" onClick={skip} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`cl-invite ${phase === 'opening' ? 'is-waiting' : 'is-entering'}`} lang={lang} aria-hidden={phase === 'opening' ? 'true' : undefined}>
          <section className="cl-hero">
            <RosePetals count={8} className="is-soft" />
            <Roses at="tr" className="cl-corner-roses" />
            <Roses at="bl" className="cl-corner-roses" />
            <div className="cl-hero-inner">
              <Reveal variant="fade">
                {!guestNamedInLine(invitation) && <p className="cl-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
              </Reveal>
              <Reveal delay={200}>
                {!hasParentsLines(invitation) && <p className={`${eyebrow} mt-8`}>{t.together}</p>}
                {invitation.blessing && <p className="cl-blessing">{invitation.blessing}</p>}
                {invitation.hostLine && <p className="cl-hostline">{invitation.hostLine}</p>}
              </Reveal>
              <h1 ref={headingRef} tabIndex={-1} className="cl-names outline-none">
                <span className="cl-name" style={{ animationDelay: '0.4s' }}>
                  <Parents text={invitation.partnerOneParents} />
                  {one}
                </span>
                <span className="cl-amp" style={{ animationDelay: '0.8s' }}>
                  {t.and}
                </span>
                <span className="cl-name" style={{ animationDelay: '1.1s' }}>
                  <Parents text={invitation.partnerTwoParents} />
                  {two}
                </span>
              </h1>
              <Reveal delay={1300}>
                <div className="cl-buds" aria-hidden="true">
                  <span />
                  <img className="cl-bud" src={img('petal-2')} alt="" decoding="async" />
                  <span />
                </div>
                <p className="cl-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
              </Reveal>
              <Reveal delay={1600}>
                <p className="cl-date">{date || '—'}</p>
                {invitation.venueName && <p className="cl-venue-line">{invitation.venueName}</p>}
              </Reveal>
            </div>
          </section>

          {photos.length > 0 && (
            <section className="cl-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`cl-section-title ${latin ? '' : 'is-local'}`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`cl-photos ${galleryClass(photos.length, 4)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 120} className="cl-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="cl-section">
            <div className="cl-details">
              <Reveal className="cl-card">
                <p className={eyebrow}>{t.when}</p>
                <CalendarDays className="cl-icon" size={22} aria-hidden="true" />
                <p className="cl-card-title">{date || '—'}</p>
                {time && (
                  <p className="cl-card-text inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="cl-card" delay={120}>
                <p className={eyebrow}>{t.where}</p>
                <MapPin className="cl-icon" size={22} aria-hidden="true" />
                <p className="cl-card-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="cl-card-text">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="cl-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="cl-card-text inline-flex items-center gap-2">
                  <Shirt size={16} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {ceremonies.length > 0 && (
            <section className="cl-section" aria-labelledby="cl-cer-h">
              <Reveal>
                <h2 id="cl-cer-h" className={`cl-section-title ${latin ? '' : 'is-local'}`}>
                  {t.programme}
                </h2>
              </Reveal>
              <ol className="cl-timeline">
                {ceremonies.map((c, i) => (
                  <Reveal as="li" key={`${c.name}-${i}`} delay={i * 100}>
                    <span className="cl-dot" aria-hidden="true" />
                    <p className="cl-tl-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                    <h3 className="cl-tl-name">{c.name}</h3>
                    {c.venue && <p className="cl-card-text">{c.venue}</p>}
                    {c.note && <p className="cl-card-text italic">{c.note}</p>}
                  </Reveal>
                ))}
              </ol>
            </section>
          )}

          <section className="cl-section pb-16" aria-labelledby="cl-rsvp-h">
            <Reveal className="cl-rsvp">
              <p className={eyebrow}>{t.kindlyReply}</p>
              <h2 id="cl-rsvp-h" className="cl-rsvp-title">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="mt-1 text-[14px]" style={{ color: 'var(--ei-muted)' }}>
                  {t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}
                </p>
              )}
              <div className="cl-rsvp-form mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <img className="cl-sign-petal" src={img('petal-1')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="cl-sign">
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
