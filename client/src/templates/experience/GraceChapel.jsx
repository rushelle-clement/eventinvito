// Sage Promise (key "grace-chapel"): a Christian church wedding in white, sage green and soft gold.
//
// Opening: on ivory linen, a card tied with a sage satin ribbon and bow, with the couple's names.
// "Open Invitation" → the bow loosens and falls, the ribbon slides off both sides, two white doves
// fly up from the knot (flapping), and the card opens into the invitation.
// The invitation: a white-rose arch on a gold frame around the names, petals drifting and the
// doves crossing now and then; then the date, photos in arched frames, the details, the ceremonies
// and the reply card, tied with the same bow.
// The flowers, ribbon, doves and petals are images in /public/grace-chapel; the rest is drawn in code.

import { useEffect, useRef, useState } from 'react'
import { MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, names, runTimeline, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './graceChapel.css'

const REVEAL_AT = 2400
const DONE_AT = 3200

const img = (name) => `${import.meta.env.BASE_URL}grace-chapel/${name}.webp`

// The drifting petals over the arch: which petal, where it starts (% across), how long it falls, when
const PETALS = [
  { n: 1, x: 12, s: 30, d: 0, w: 26 },
  { n: 4, x: 78, s: 34, d: 6, w: 22 },
  { n: 2, x: 34, s: 38, d: 13, w: 18 },
  { n: 5, x: 90, s: 31, d: 19, w: 24 },
  { n: 3, x: 56, s: 36, d: 25, w: 20 },
  { n: 6, x: 22, s: 33, d: 30, w: 22 },
]

// One white dove that flaps: the wings-up and wings-down pictures, lined up at the beak.
// `down` is where the wings-down picture sits inside the wings-up one (% of its width / height).
const DOVES = {
  1: { ratio: '560 / 690', down: { left: '8.9%', top: '50%', width: '100%' } },
  2: { ratio: '499 / 642', down: { left: '6%', top: '48.1%', width: '112.2%' } },
}
function Dove({ n, className = '' }) {
  const d = DOVES[n]
  return (
    <span className={`gc-dove ${className}`} aria-hidden="true">
      <span className="gc-flap" style={{ aspectRatio: d.ratio }}>
        <img className="is-up" src={img(`dove-up-${n}`)} alt="" decoding="async" />
        <img className="is-down" src={img(`dove-down-${n}`)} alt="" decoding="async" style={d.down} />
      </span>
    </span>
  )
}

// "SATURDAY | 12 | DECEMBER 2026" (English); other languages show their own written date
function DateLine({ iso, lang }) {
  if (!iso) return null
  if (lang !== 'en') return <p className="gc-date is-local">{formatDate(iso, lang)}</p>
  return (
    <p className="gc-date">
      <span>{formatDate(iso, 'en', { weekday: 'long' })}</span>
      <span className="gc-date-day">{formatDate(iso, 'en', { day: 'numeric' })}</span>
      <span>{formatDate(iso, 'en', { month: 'long', year: 'numeric' })}</span>
    </p>
  )
}

function Heading({ id, children, local }) {
  return (
    <Reveal className="gc-heading">
      <span className="gc-hair" aria-hidden="true" />
      <h2 id={id} className={`gc-eyebrow ${local}`}>
        {children}
      </h2>
      <span className="gc-hair" aria-hidden="true" />
    </Reveal>
  )
}

export default function GraceChapel({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
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
      {/* ---------- Opening: the card tied with a ribbon ---------- */}
      {phase !== 'open' && (
        <div
          className={`gc-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <div className="gc-stage" lang={lang}>
            <div className="gc-card">
              <img className="gc-card-corner is-tl" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
              <img className="gc-card-corner is-br" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
              <div className="gc-card-text">
                <p className={`gc-eyebrow ${local} gc-fade gc-in-1`}>{guestName ? t.forGuest(guestName) : t.theWeddingOf}</p>
                <p className="gc-open-names gc-fade gc-in-2">
                  <span>{one}</span>
                  <span className="gc-amp">{t.and}</span>
                  <span>{two}</span>
                </p>
                {invitation.eventDate && (
                  <p className="gc-open-date gc-fade gc-in-3">
                    <span className="gc-hair" aria-hidden="true" />
                    {latin ? formatDate(invitation.eventDate, 'en', { day: 'numeric', month: 'long', year: 'numeric' }) : date}
                    <span className="gc-hair" aria-hidden="true" />
                  </p>
                )}
              </div>

              {/* the ribbon round the card: two halves that slide away, and the bow on the knot */}
              <div className="gc-ribbon" aria-hidden="true">
                <span className="gc-strip is-left">
                  <img src={img('band')} alt="" decoding="async" />
                </span>
                <span className="gc-strip is-right">
                  <img src={img('band')} alt="" decoding="async" />
                </span>
                <img className="gc-bow" src={img('bow')} alt="" decoding="async" />
                <span className="gc-doves-out">
                  <Dove n={1} className="is-one" />
                  <Dove n={2} className="is-two" />
                </span>
              </div>
            </div>

            <button ref={openBtnRef} type="button" className="gc-open-btn" onClick={open} disabled={phase !== 'closed'}>
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
        <main className={`gc-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="gc-hero">
            {/* petals drifting down, and now and then the doves cross */}
            <div className="gc-sky" aria-hidden="true">
              {PETALS.map((p) => (
                <img
                  key={p.n}
                  className="gc-petal"
                  src={img(`petal-${p.n}`)}
                  alt=""
                  decoding="async"
                  style={{ left: `${p.x}%`, width: `${p.w}px`, animationDuration: `${p.s}s`, animationDelay: `${p.d - 4}s` }}
                />
              ))}
              <span className="gc-cross">
                <Dove n={1} className="is-one" />
                <Dove n={2} className="is-two" />
              </span>
            </div>

            <Reveal variant="fade" className="gc-top">
              {invitation.blessing && <p className="gc-blessing">{invitation.blessing}</p>}
              {!guestNamedInLine(invitation) && <p className={`gc-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>}
            </Reveal>

            {/* the arch: the flowers over a gold frame, with the names inside */}
            <div className="gc-arch">
              <img className="gc-arch-img" src={img('arch')} alt="" aria-hidden="true" decoding="async" />
              <div className="gc-arch-inner">
                {!hasParentsLines(invitation) && <p className={`gc-eyebrow ${local} gc-together`}>{t.together}</p>}
                {invitation.hostLine && <p className="gc-hostline">{invitation.hostLine}</p>}
                <h1 ref={headingRef} tabIndex={-1} className="gc-names outline-none">
                  <span className="gc-name" style={{ animationDelay: '0.2s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="gc-amp" style={{ animationDelay: '0.45s' }}>
                    {t.and}
                  </span>
                  <span className="gc-name" style={{ animationDelay: '0.65s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>
              </div>
            </div>

            <div className="gc-hero-text">
              <Reveal delay={200}>
                <span className="gc-rule" aria-hidden="true" />
                <p className="gc-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
              </Reveal>
              <Reveal delay={300}>
                <DateLine iso={invitation.eventDate} lang={lang} />
                {time && <p className="gc-time">{time}</p>}
                {invitation.venueName && <p className={`gc-venue ${local}`}>{invitation.venueName}</p>}
              </Reveal>
              {cover && gallery.length === 0 && (
                <Reveal variant="scale" className="gc-cover">
                  <img src={cover} alt="" decoding="async" />
                </Reveal>
              )}
            </div>
          </section>

          {gallery.length > 0 && (
            <section className="gc-band gc-sage" aria-labelledby="gc-moments-h">
              <div className="gc-section">
                <Heading id="gc-moments-h" local={local}>
                  {t.ourMoments}
                </Heading>
                <div className={`gc-photos ${galleryClass(gallery.length, 6)}`}>
                  {gallery.map((p, i) => (
                    <Reveal key={p.id} variant="up" delay={(i % 3) * 120} className="gc-photo">
                      <img src={p.url} alt="" loading="lazy" />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="gc-band" aria-label={`${t.when} · ${t.where}`}>
            <div className="gc-section">
              <div className="gc-details">
                <Reveal className="gc-card-box">
                  <img className="gc-box-corner" src={img('corner')} alt="" aria-hidden="true" loading="lazy" />
                  <p className={`gc-eyebrow ${local}`}>{t.when}</p>
                  <p className="gc-card-title">{date || '—'}</p>
                  {time && <p className="gc-sub">{time}</p>}
                </Reveal>
                <Reveal className="gc-card-box" delay={120}>
                  <img className="gc-box-corner is-flip" src={img('corner')} alt="" aria-hidden="true" loading="lazy" />
                  <p className={`gc-eyebrow ${local}`}>{t.where}</p>
                  <p className="gc-card-title">{invitation.venueName || '—'}</p>
                  {invitation.address && <p className="gc-sub">{invitation.address}</p>}
                  {invitation.mapUrl && (
                    <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="gc-link">
                      <MapPin size={14} aria-hidden="true" /> {t.viewMap}
                    </a>
                  )}
                </Reveal>
              </div>
              {invitation.dressCode && (
                <Reveal className="gc-dress">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </Reveal>
              )}
            </div>
          </section>

          {ceremonies.length > 0 && (
            <section className="gc-band gc-sage" aria-labelledby="gc-cer-h">
              <div className="gc-section">
                <Heading id="gc-cer-h" local={local}>
                  {t.programme}
                </Heading>
                <ol className="gc-timeline">
                  {ceremonies.map((c, i) => (
                    <Reveal as="li" key={`${c.name}-${i}`} delay={i * 100}>
                      <p className="gc-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                      <p className="gc-cer-name">{c.name}</p>
                      {c.venue && <p className="gc-sub">{c.venue}</p>}
                      {c.note && <p className="gc-sub italic">{c.note}</p>}
                    </Reveal>
                  ))}
                </ol>
              </div>
            </section>
          )}

          <section className="gc-band gc-end" aria-labelledby="gc-rsvp-h">
            <div className="gc-section">
              {/* the reply card, tied with the bow from the opening */}
              <Reveal className="gc-card-box gc-rsvp">
                <img className="gc-rsvp-bow" src={img('bow')} alt="" aria-hidden="true" loading="lazy" />
                <p className={`gc-eyebrow ${local}`}>{t.kindlyReply}</p>
                <h2 id="gc-rsvp-h" className="gc-card-title big">
                  {t.rsvpPrompt}
                </h2>
                {invitation.rsvpDeadline && (
                  <p className="gc-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
                )}
                <div className="mx-auto max-w-md">{rsvp}</div>
              </Reveal>
              <Reveal className="gc-sign-off">
                <span className="gc-sign-doves" aria-hidden="true">
                  <img src={img('dove-up-1')} alt="" loading="lazy" />
                  <img src={img('dove-up-2')} alt="" loading="lazy" />
                </span>
                <p className="gc-sign">
                  {one} <span className="gc-amp">{t.and}</span> {two}
                </p>
                {guestName && <p className="gc-note">{t.personalNote(guestName)}</p>}
              </Reveal>
            </div>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
