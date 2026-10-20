// Template 13 — Enchanted Storybook: a fairytale storybook under a pastel twilight sky.
//
// Opening ("Once upon a time"): an ivory, rose-framed storybook rests in front of a distant castle while
// clouds drift and stars twinkle. The couple's names are lettered in the middle of the cover.
// Tapping "Open the Storybook" starts the music (if chosen); the book moves to the middle and the
// cover swings open with a puff of gold sparkles. The first page reads "Once upon a time…",
// then the page turns: the castle on the left, the couple's names and date on the right.
// The invitation then continues as storybook pages, ending "…and they lived happily ever after".
//
// The cover, castle, clouds, sky, rose corners, carriage and doves are watercolour illustrations
// (/public/fairytale); the pages, gold lettering, sparkles and ribbon are drawn in code.

import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './enchantedStorybook.css'

const REVEAL_AT = 5700 // the book has opened and turned its page
const DONE_AT = 6700
const ART = `${import.meta.env.BASE_URL}fairytale/`
const img = (name) => `${ART}${name}.webp`

// Fixed pseudo-random values per index, so stars and sparkles never jump on re-render
function rand(i, k) {
  const x = Math.sin(i * 47.13 + k * 19.71) * 15731.743
  return x - Math.floor(x)
}

// The first letter (a whole letter, with its vowel signs, in Sinhala/Tamil) for the drop cap
function splitFirst(text) {
  if (!text) return ['', '']
  let first = Array.from(text)[0]
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)[Symbol.iterator]().next()
    if (!seg.done) first = seg.value.segment
  }
  return [first, text.slice(first.length)]
}

function OnceUpon({ text, className = '' }) {
  const [cap, rest] = splitFirst(text)
  return (
    <p className={`es-once ${className}`}>
      <span className="es-cap">{cap}</span>
      {rest}
    </p>
  )
}

// Sky, drifting clouds and twinkling stars (shared by the opening and the invitation)
function Sky({ fixed = false, clouds = true }) {
  return (
    <div className={`es-sky ${fixed ? 'is-fixed' : ''}`} aria-hidden="true">
      <picture>
        <source media="(min-aspect-ratio: 1/1)" srcSet={img('sky-wide')} />
        <img className="es-sky-img" src={img('sky-tall')} alt="" decoding="async" />
      </picture>
      <Stars />
      {clouds && (
        <>
          <img className="es-cloud c1" src={img('cloud-1')} alt="" decoding="async" />
          <img className="es-cloud c2" src={img('cloud-4')} alt="" decoding="async" />
          <img className="es-cloud c3" src={img('cloud-3')} alt="" decoding="async" />
        </>
      )}
    </div>
  )
}

function Stars({ count = 14 }) {
  return (
    <div className="es-stars">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(4 + rand(i, 1) * 92).toFixed(1)}%`,
            top: `${(3 + rand(i, 2) * 40).toFixed(1)}%`,
            '--sz': `${(7 + rand(i, 3) * 9).toFixed(0)}px`,
            '--d': `${(2.6 + rand(i, 4) * 3).toFixed(1)}s`,
            '--dl': `${(-rand(i, 5) * 4).toFixed(1)}s`,
          }}
        />
      ))}
    </div>
  )
}

// Gold sparkles bursting from the spine as the cover opens
function Burst() {
  return (
    <div className="es-burst" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + rand(i, 7)
        const r = 70 + rand(i, 8) * 110
        return (
          <span
            key={i}
            style={{
              '--dx': `${(Math.cos(a) * r).toFixed(0)}px`,
              '--dy': `${(Math.sin(a) * r * 0.8 - 30).toFixed(0)}px`,
              '--sz': `${(6 + rand(i, 9) * 8).toFixed(0)}px`,
              '--dl': `${(0.55 + rand(i, 10) * 0.35).toFixed(2)}s`,
            }}
          />
        )
      })}
    </div>
  )
}

// A rose corner (the art is a bottom-left piece; the class turns it for other corners)
function Corner({ at }) {
  return <img className={`es-corner ${at}`} src={img('corner')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
}

// A small gold flourish between parts of a page
function Flourish({ className = '' }) {
  return (
    <svg className={`es-flourish ${className}`} viewBox="0 0 200 20" aria-hidden="true">
      <path d="M8 10 H78 M122 10 H192" />
      <path d="M78 10 C 86 2, 94 2, 100 10 C 106 18, 114 18, 122 10" />
      <path d="M78 10 C 86 18, 94 18, 100 10 C 106 2, 114 2, 122 10" />
      <circle cx="100" cy="10" r="2.2" />
      <circle cx="8" cy="10" r="1.6" />
      <circle cx="192" cy="10" r="1.6" />
    </svg>
  )
}

// ---------- the design ----------

export default function EnchantedStorybook({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed') // closed → opening → revealing → open
  const [skipped, setSkipped] = useState(false)
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const bookRef = useRef(null)
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
    const delay = skipped || prefersReducedMotion() ? 0 : 2900
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
    // How big the open book can be: two pages side by side, within the screen
    const book = bookRef.current
    if (book) {
      const w = book.offsetWidth
      const h = book.offsetHeight
      const s = Math.min(1.3, (window.innerWidth * 0.94) / (2 * w), (window.innerHeight * 0.82) / h)
      book.style.setProperty('--s', s.toFixed(3))
    }
    setPhase('opening')
    timers.current = [setTimeout(() => setPhase('revealing'), REVEAL_AT), setTimeout(() => setPhase('open'), DONE_AT)]
  }

  // A tap while the book is opening goes straight to the invitation
  function hurry() {
    if (phase !== 'opening') return
    timers.current.forEach(clearTimeout)
    setPhase('revealing')
    timers.current = [setTimeout(() => setPhase('open'), DONE_AT - REVEAL_AT)]
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const photos = invitation.photos || []
  const local = latin ? '' : 'is-local'

  return (
    <>
      {/* ---------- Opening: the storybook ---------- */}
      {phase !== 'open' && (
        <div
          className={`es-opening ${skipped ? 'is-skipped' : ''} ${phase === 'opening' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openBook}
          onClick={hurry}
        >
          <div className="es-scene" aria-hidden="true">
            <Sky />
            <img className="es-castle" src={img('castle')} alt="" decoding="async" />
            <span className="es-haze" />
          </div>

          <div className="es-stage" lang={lang}>
            <p className={`es-guest ${local} es-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>

            <div className="es-bookwrap es-step s0">
              <div ref={bookRef} className="es-book">
                {/* the page underneath: the couple and the date */}
                <div className="es-sheet es-base">
                  <div className="es-face">
                    <Corner at="bl" />
                    <Corner at="tr" />
                    <p className={`es-mini-eyebrow ${local}`}>{t.theWeddingOf}</p>
                    <p className="es-mini-names">
                      <span>{one}</span>
                      <span className="es-mini-amp">{t.and}</span>
                      <span>{two}</span>
                    </p>
                    <Flourish className="es-mini-flourish" />
                    {date && <p className="es-mini-date">{date}</p>}
                    {invitation.venueName && <p className="es-mini-venue">{invitation.venueName}</p>}
                  </div>
                </div>

                {/* the page that turns: "Once upon a time…" / the castle */}
                <div className="es-sheet es-leaf">
                  <div className="es-face front">
                    <Corner at="bl" />
                    <Flourish className="es-mini-flourish" />
                    <OnceUpon text={t.onceUpon} className="is-mini" />
                    <Flourish className="es-mini-flourish" />
                  </div>
                  <div className="es-face back">
                    <span className="es-plate">
                      <img src={img('castle')} alt="" decoding="async" />
                    </span>
                  </div>
                </div>

                {/* the cover: the names in the middle / the endpaper with a bookplate */}
                <div className="es-cover">
                  <div className="es-cover-face front">
                    <img className="es-cover-img" src={img('cover')} alt="" decoding="async" />
                    <div className="es-label">
                      <p className={`es-label-eyebrow ${local}`}>{t.theWeddingOf}</p>
                      <p className="es-label-names">
                        <span>{one}</span>
                        <span className="es-label-amp">{t.and}</span>
                        <span>{two}</span>
                      </p>
                      {date && <p className="es-label-date">{date}</p>}
                    </div>
                  </div>
                  <div className="es-cover-face back">
                    <span className="es-bookplate">
                      <span>{guestName ? t.forGuest(guestName) : t.youAreInvited}</span>
                    </span>
                  </div>
                </div>
              </div>
              <Burst />
            </div>

            <button
              ref={openBtnRef}
              type="button"
              className="es-open-btn es-step s2"
              onClick={(e) => {
                e.stopPropagation()
                open()
              }}
              disabled={phase !== 'closed'}
            >
              {t.openBook}
            </button>
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip es-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation: storybook pages ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`es-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <Sky fixed={!poster} clouds={false} />

          <section className="es-section es-hero">
            <article className="es-page es-page-hero">
              <span className="es-ribbon" aria-hidden="true" />
              <Corner at="bl" />
              <Corner at="tr" />
              {invitation.blessing && (
                <Reveal variant="fade">
                  <p className="es-blessing">{invitation.blessing}</p>
                </Reveal>
              )}
              <Reveal variant="scale">
                <img className="es-hero-castle" src={img('castle')} alt="" aria-hidden="true" decoding="async" />
              </Reveal>
              <Reveal variant="fade" delay={100}>
                {!guestNamedInLine(invitation) && <p className="es-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                <OnceUpon text={t.onceUpon} />
              </Reveal>
              <Reveal delay={200}>
                {!hasParentsLines(invitation) && <p className={`es-eyebrow ${local}`}>{t.together}</p>}
                {invitation.hostLine && <p className="es-hostline">{invitation.hostLine}</p>}
              </Reveal>
              <h1 ref={headingRef} tabIndex={-1} className="es-names outline-none">
                <span className="es-name" style={{ animationDelay: '0.3s' }}>
                  <Parents text={invitation.partnerOneParents} />
                  {one}
                </span>
                <span className="es-amp" style={{ animationDelay: '0.6s' }}>
                  {t.and}
                </span>
                <span className="es-name" style={{ animationDelay: '0.8s' }}>
                  <Parents text={invitation.partnerTwoParents} />
                  {two}
                </span>
              </h1>
              <Reveal delay={900}>
                <Flourish />
                <p className="es-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
              </Reveal>
              <Reveal delay={1100}>
                <p className="es-date">{date || '—'}</p>
                {time && <p className={`es-when ${local}`}>{time}</p>}
                {invitation.venueName && <p className={`es-venue ${local}`}>{invitation.venueName}</p>}
              </Reveal>
            </article>
          </section>

          <section className="es-section">
            <div className="es-details">
              <Reveal className="es-page es-panel">
                <CalendarDays className="es-icon" size={22} aria-hidden="true" />
                <p className={`es-eyebrow ${local}`}>{t.when}</p>
                <p className="es-panel-title">{date || '—'}</p>
                {time && (
                  <p className="es-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="es-page es-panel" delay={120}>
                <img className="es-carriage" src={img('carriage')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
                <p className={`es-eyebrow ${local}`}>{t.where}</p>
                <p className="es-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="es-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="es-link">
                    <MapPin size={14} aria-hidden="true" /> {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="es-chip">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: church ceremony, Poruwa ceremony, reception… */}
          {ceremonies.length > 0 && (
            <section className="es-section" aria-labelledby="es-cer-h">
              <Reveal className="es-page es-panel">
                <h2 id="es-cer-h" className={`es-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <Flourish />
                <ol className="es-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="es-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="es-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="es-sub">{c.venue}</p>}
                      {c.note && <p className="es-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="es-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`es-eyebrow es-on-sky ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`es-photos count-${Math.min(photos.length, 6)}`}>
                {photos.slice(0, 6).map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="es-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="es-section" aria-labelledby="es-rsvp-h">
            <Reveal className="es-page es-panel es-rsvp">
              <img className="es-doves" src={img('doves')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
              <p className={`es-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="es-rsvp-h" className="es-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="es-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
          </section>

          <section className="es-section es-last">
            <Reveal className="es-page es-ending">
              <Corner at="bl" />
              <Corner at="br" />
              <p className="es-ever">{t.happilyEver}</p>
              <Flourish />
              <p className="es-sign">
                {one} <span className="es-amp">{t.and}</span> {two}
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
