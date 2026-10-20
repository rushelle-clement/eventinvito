// Template 10 — Nelum Elegance: lotus pink, blush, ivory, sage green and soft gold, with a
// traditional Sri Lankan touch (Liyawel ornament and Kandyan-style hamsa swans).
//
// Opening ("The Lotus Pond"): a calm pastel pond with soft ripples and floating lotus leaves. A
// lotus bud rises from the water and opens — bud, half open, full bloom — as ripple rings spread.
// A pair of swans (hamsa) glides in from either side. The lotus lifts away, the invitation card
// appears and a fine gold Liyawel border draws itself around it. The names, date, venue and
// "Open Invitation" button follow. Tapping it starts the music (if chosen) and opens the full
// invitation.
//
// The lotus, leaves, swans and corner are watercolour illustration in /public/nelum-lotus
// (transparent WebP); the water, ripples and Liyawel border are drawn in code.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import { LiyawelBorder, LiyawelDivider, LotusMark } from './kandyanArt'
import './nelumLotus.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1300
const ART = `${import.meta.env.BASE_URL}nelum-lotus/`
const img = (name) => `${ART}${name}.webp`

// Floating leaves on the pond: [which leaf, left %, bottom %, width (vmin), rotation, flipped]
const PADS = [
  [1, -6, 4, 34, -12, false],
  [3, 70, 1, 36, 20, true],
  [2, 22, -6, 26, 40, false],
  [1, 52, 12, 18, 70, true],
]

// ---------- the design ----------

export default function NelumLotus({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
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
    const delay = skipped || prefersReducedMotion() ? 0 : 7000
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
      {/* ---------- Opening: the lotus pond ---------- */}
      {phase !== 'open' && (
        <div
          className={`nl-opening ${skipped ? 'is-skipped' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          {/* the pond: water, shimmer, ripples and floating leaves */}
          <div className="nl-pond" aria-hidden="true">
            <span className="nl-water" />
            <span className="nl-shimmer" />
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="nl-ripple" style={{ '--i': i }} />
            ))}
            {PADS.map(([n, left, bottom, w, rot, flip], i) => (
              <img
                key={i}
                className={`nl-pad ${flip ? 'is-flipped' : ''}`}
                style={{ left: `${left}%`, bottom: `${bottom}%`, '--w': `${w}vmin`, '--r': `${rot}deg`, '--dl': `${0.2 + i * 0.25}s` }}
                src={img(`leaf-${n}`)}
                alt=""
                decoding="async"
              />
            ))}
            <img className="nl-bud left" src={img('bud-1')} alt="" decoding="async" />
            <img className="nl-bud right" src={img('bud-2')} alt="" decoding="async" />
            <img className="nl-swan left" src={img('swan')} alt="" decoding="async" />
            <img className="nl-swan right" src={img('swan')} alt="" decoding="async" />
          </div>

          {/* the lotus rising from the water and opening */}
          <div className="nl-rise" aria-hidden="true">
            <img className="nl-stage st1" src={img('stage-1')} alt="" fetchPriority="high" decoding="async" />
            <img className="nl-stage st2" src={img('stage-2')} alt="" decoding="async" />
            <img className="nl-stage st3" src={img('stage-3')} alt="" decoding="async" />
          </div>

          <div className="nl-stage-box">
            <LiyawelBorder className="nl-open-border" animate start={4.5} />
            <div className="nl-open-card">
              <img className="nl-crest" src={img('stage-3')} alt="" aria-hidden="true" decoding="async" />
              <div className="nl-open-text" lang={lang}>
                <p className={`nl-eyebrow ${local} nl-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
                <p className="nl-open-names nl-step s2">
                  <span>{one}</span>
                  <span className="nl-amp">{t.and}</span>
                  <span>{two}</span>
                </p>
                <LiyawelDivider className="nl-step s3" />
                <p className={`nl-open-date ${local} nl-step s3`}>{date}</p>
                {invitation.venueName && <p className={`nl-open-venue ${local} nl-step s4`}>{invitation.venueName}</p>}
                <button ref={openBtnRef} type="button" className="nl-open-btn nl-step s5" onClick={open} disabled={phase !== 'closed'}>
                  {t.openInvitation}
                </button>
              </div>
            </div>
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip nl-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`nl-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="nl-section nl-hero">
            <div className="nl-card-wrap">
              <LiyawelBorder className="nl-border" />
              <div className="nl-card">
                {/* the corner artwork is a bottom-left piece: upright lotus at both lower corners */}
                <img className="nl-corner bl" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
                <img className="nl-corner br" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
                <div className="nl-card-body">
                  <img className="nl-swans" src={img('swans')} alt="" aria-hidden="true" decoding="async" />
                  <Reveal variant="fade">
                    {!guestNamedInLine(invitation) && <p className="nl-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                  </Reveal>
                  {invitation.blessing && (
                    <Reveal variant="fade" delay={80}>
                      <p className="nl-blessing">{invitation.blessing}</p>
                    </Reveal>
                  )}
                  <Reveal delay={150}>
                    {!hasParentsLines(invitation) && <p className={`nl-eyebrow ${local} mt-6`}>{t.together}</p>}
                    {invitation.hostLine && <p className="nl-hostline">{invitation.hostLine}</p>}
                  </Reveal>
                  <h1 ref={headingRef} tabIndex={-1} className="nl-names outline-none">
                    <span className="nl-name" style={{ animationDelay: '0.3s' }}>
                      <Parents text={invitation.partnerOneParents} />
                      {one}
                    </span>
                    <span className="nl-amp" style={{ animationDelay: '0.6s' }}>
                      {t.and}
                    </span>
                    <span className="nl-name" style={{ animationDelay: '0.8s' }}>
                      <Parents text={invitation.partnerTwoParents} />
                      {two}
                    </span>
                  </h1>
                  <Reveal delay={900}>
                    <LiyawelDivider />
                    <p className="nl-message">{invitation.message || t.defaultInvite}</p>
                    <InviteLine invitation={invitation} guestName={guestName} />
                  </Reveal>
                  <Reveal delay={1100}>
                    <p className="nl-date">
                      <LotusMark />
                      <span>{date || '—'}</span>
                      <LotusMark />
                    </p>
                    {time && <p className={`nl-when ${local}`}>{time}</p>}
                    {invitation.venueName && <p className={`nl-venue ${local}`}>{invitation.venueName}</p>}
                  </Reveal>
                </div>
              </div>
            </div>
          </section>

          <section className="nl-section">
            <div className="nl-details">
              <Reveal className="nl-panel">
                <CalendarDays className="nl-icon" size={20} aria-hidden="true" />
                <p className={`nl-eyebrow ${local}`}>{t.when}</p>
                <p className="nl-panel-title">{date || '—'}</p>
                {time && (
                  <p className="nl-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="nl-panel" delay={120}>
                <MapPin className="nl-icon" size={20} aria-hidden="true" />
                <p className={`nl-eyebrow ${local}`}>{t.where}</p>
                <p className="nl-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="nl-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="nl-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="nl-sub inline-flex items-center gap-2">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: Poruwa ceremony, church ceremony, homecoming… */}
          {ceremonies.length > 0 && (
            <section className="nl-section" aria-labelledby="nl-cer-h">
              <Reveal className="nl-panel">
                <img className="nl-panel-bud" src={img('bud-2')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <h2 id="nl-cer-h" className={`nl-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="nl-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <LotusMark />
                      <p className="nl-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="nl-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="nl-sub">{c.venue}</p>}
                      {c.note && <p className="nl-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="nl-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`nl-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
                <LiyawelDivider />
              </Reveal>
              <div className={`nl-photos count-${Math.min(photos.length, 6)}`}>
                {photos.slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="nl-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="nl-section nl-last" aria-labelledby="nl-rsvp-h">
            <Reveal className="nl-panel">
              <p className={`nl-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="nl-rsvp-h" className="nl-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="nl-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <img className="nl-sign-lotus" src={img('stage-3')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className="nl-sign">
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
