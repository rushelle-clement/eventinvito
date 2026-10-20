// Template 9 — Kandyan Heritage: ivory, antique gold and deep maroon, with a hint of saffron.
//
// Opening ("Lighting the Pahana"): a warm, dim screen with a traditional brass oil lamp. One by
// one its wicks catch light and flicker, and the glow spreads. Liyawel vines grow out from the
// lamp's base in perfect mirror symmetry and rise into a carved Thorana-style arch with a pearl
// edge and a lotus finial. The lamp's light swells to fill the arch, and the invitation card
// appears inside it, crowned with a Kandyan lotus medallion and edged with Pala pethi petal
// borders. The names, date, venue and "Open Invitation" button follow. Tapping it starts the
// music (if chosen) and opens the full invitation.
//
// The lamp, medallion and corners are illustration in /public/kandyan-heritage (transparent
// WebP); the flames, light, Liyawel vines, arch and petal borders are drawn in code.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import { LiyawelDivider, LotusMark, PalaPethi, ThoranaFrame } from './kandyanArt'
import './kandyanHeritage.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1300
const ART = `${import.meta.env.BASE_URL}kandyan-heritage/`
const img = (name) => `${ART}${name}.webp`

// Where the wicks sit on the lamp picture (% of its width / height), measured from the lamp's
// lotus-petal wick cups: seven on the upper tier and seven on the lower, left to right
const WICKS = [
  [13.0, 33.1], [23.3, 32.8], [35.8, 32.7], [49.4, 33.5], [63.0, 32.7], [75.2, 32.8], [84.8, 33.0],
  [8.5, 51.4], [19.7, 50.8], [33.3, 50.5], [50.0, 52.3], [64.5, 50.5], [79.4, 50.6], [90.9, 51.3],
]
// The order they light: from the centre outwards, upper tier first
const LIGHT_ORDER = [3, 2, 4, 1, 5, 0, 6, 10, 9, 11, 8, 12, 7, 13]

function Flame({ x, y, i, order }) {
  return (
    <span className="kh-flame" style={{ left: `${x}%`, top: `${y}%`, '--k': order, '--fl': `${(0.9 + ((i * 7) % 5) / 10).toFixed(2)}s` }} aria-hidden="true">
      <svg viewBox="0 0 10 16">
        <path d="M5 0 C 7 4, 10 7, 10 11 C 10 14, 8 16, 5 16 C 2 16, 0 14, 0 11 C 0 7, 3 4, 5 0 Z" />
        <path className="kh-flame-core" d="M5 6 C 6 8, 7 10, 7 12 C 7 14, 6 15, 5 15 C 4 15, 3 14, 3 12 C 3 10, 4 8, 5 6 Z" />
      </svg>
    </span>
  )
}

function Lamp({ className = '', lit = true }) {
  return (
    <div className={`kh-lamp ${className}`} aria-hidden="true">
      <img src={img('lamp')} alt="" decoding="async" />
      {lit && WICKS.map(([x, y], i) => <Flame key={i} x={x} y={y} i={i} order={LIGHT_ORDER.indexOf(i)} />)}
    </div>
  )
}

function Corners() {
  return (
    <>
      <img className="kh-corner bl" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
      <img className="kh-corner br" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
    </>
  )
}

// (bottom corners only: the card's top is the arch)

// ---------- the design ----------

export default function KandyanHeritage({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
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
    const delay = skipped || prefersReducedMotion() ? 0 : 6900
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
      {/* ---------- Opening: lighting the pahana ---------- */}
      {phase !== 'open' && (
        <div
          className={`kh-opening ${skipped ? 'is-skipped' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <span className="kh-halo" aria-hidden="true" />
          <span className="kh-light" aria-hidden="true" />

          <div className="kh-stage">
            <div className="kh-frame-box">
              <ThoranaFrame animate />
            </div>
            <div className="kh-open-card">
              <img className="kh-medallion" src={img('medallion')} alt="" aria-hidden="true" decoding="async" />
              <div className="kh-open-text" lang={lang}>
                <p className={`kh-eyebrow ${local} kh-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
                <p className="kh-open-names kh-step s2">
                  <span>{one}</span>
                  <span className="kh-amp">{t.and}</span>
                  <span>{two}</span>
                </p>
                <LiyawelDivider className="kh-step s3" />
                <p className={`kh-open-date ${local} kh-step s3`}>{date}</p>
                {invitation.venueName && <p className={`kh-open-venue ${local} kh-step s4`}>{invitation.venueName}</p>}
                <button ref={openBtnRef} type="button" className="kh-open-btn kh-step s5" onClick={open} disabled={phase !== 'closed'}>
                  {t.openInvitation}
                </button>
              </div>
              <PalaPethi className="kh-band-bottom" />
            </div>
            <Lamp className="kh-open-lamp" />
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip kh-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`kh-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="kh-section kh-hero">
            <div className="kh-card-wrap">
              <div className="kh-frame-box">
                <ThoranaFrame />
              </div>
              <div className="kh-card">
                <Corners />
                <img className="kh-medallion" src={img('medallion')} alt="" aria-hidden="true" decoding="async" />
                <div className="kh-card-body">
                  <Reveal variant="fade">
                    {!guestNamedInLine(invitation) && <p className="kh-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                  </Reveal>
                  {invitation.blessing && (
                    <Reveal variant="fade" delay={80}>
                      <p className="kh-blessing">{invitation.blessing}</p>
                    </Reveal>
                  )}
                  <Reveal delay={150}>
                    {!hasParentsLines(invitation) && <p className={`kh-eyebrow ${local} mt-5`}>{t.together}</p>}
                    {invitation.hostLine && <p className="kh-hostline">{invitation.hostLine}</p>}
                  </Reveal>
                  <h1 ref={headingRef} tabIndex={-1} className="kh-names outline-none">
                    <span className="kh-name" style={{ animationDelay: '0.3s' }}>
                      <Parents text={invitation.partnerOneParents} />
                      {one}
                    </span>
                    <span className="kh-amp" style={{ animationDelay: '0.6s' }}>
                      {t.and}
                    </span>
                    <span className="kh-name" style={{ animationDelay: '0.8s' }}>
                      <Parents text={invitation.partnerTwoParents} />
                      {two}
                    </span>
                  </h1>
                  <Reveal delay={900}>
                    <LiyawelDivider />
                    <p className="kh-message">{invitation.message || t.defaultInvite}</p>
                    <InviteLine invitation={invitation} guestName={guestName} />
                  </Reveal>
                  <Reveal delay={1100}>
                    <div className="kh-date">
                      <PalaPethi />
                      <p>{date || '—'}</p>
                      <PalaPethi />
                    </div>
                    {time && <p className={`kh-when ${local}`}>{time}</p>}
                    {invitation.venueName && <p className={`kh-venue ${local}`}>{invitation.venueName}</p>}
                  </Reveal>
                </div>
              </div>
            </div>
          </section>

          <section className="kh-section">
            <div className="kh-details">
              <Reveal className="kh-panel">
                <PalaPethi className="kh-panel-band" />
                <CalendarDays className="kh-icon" size={20} aria-hidden="true" />
                <p className={`kh-eyebrow ${local}`}>{t.when}</p>
                <p className="kh-panel-title">{date || '—'}</p>
                {time && (
                  <p className="kh-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="kh-panel" delay={120}>
                <PalaPethi className="kh-panel-band" />
                <MapPin className="kh-icon" size={20} aria-hidden="true" />
                <p className={`kh-eyebrow ${local}`}>{t.where}</p>
                <p className="kh-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="kh-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="kh-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="kh-sub inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: Poruwa ceremony, church ceremony, homecoming… */}
          {ceremonies.length > 0 && (
            <section className="kh-section" aria-labelledby="kh-cer-h">
              <Reveal className="kh-panel">
                <PalaPethi className="kh-panel-band" />
                <h2 id="kh-cer-h" className={`kh-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="kh-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <LotusMark />
                      <p className="kh-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="kh-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="kh-sub">{c.venue}</p>}
                      {c.note && <p className="kh-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="kh-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`kh-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
                <LiyawelDivider />
              </Reveal>
              <div className={`kh-photos count-${Math.min(photos.length, 6)}`}>
                {photos.slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="kh-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="kh-section kh-last" aria-labelledby="kh-rsvp-h">
            <Reveal className="kh-panel">
              <PalaPethi className="kh-panel-band" />
              <p className={`kh-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="kh-rsvp-h" className="kh-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="kh-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <Lamp className="kh-sign-lamp" />
              <p className="kh-sign">
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
