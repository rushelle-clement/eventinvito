// The animated Christmas party designs (Premium): an opening the guest taps, then the invitation
// (the party's title and hosts, the When and Where cards, the programme, photos and the reply).
// Each design has its own opening and artwork (pictures in /public/<key>/):
//  • christmas-elegance  forest green, burgundy and champagne gold: a garland of ornaments; golden
//                        snowflakes drift down, and on the tap a flurry of them reveals the invitation
//  • pink-christmas      blush and baby pink: a gift-wrapped invitation card, a satin band and bow
//                        across its top, a pink tree beside it; on the tap the bow unties, the band
//                        slides away and the card opens in soft pink light
//  • winter-wonderland   icy blue, silver and white: a frosted arch in a snowy forest; on the tap the
//                        snow thickens and a magical glow pours out of the arch
//  • cosy-christmas      warm beige, cinnamon and red plaid: a gingerbread wreath slowly forms around
//                        the invitation; on the tap the gingerbread man waves and the wreath opens
//  • christmas-after-dark  black chalkboard, emerald and red: a pine-and-candy-cane frame, the title
//                        chalked in by hand and red baubles swinging; on the tap they swing and glow

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, runTimeline, timeRange } from './shared'
import { formatDate } from '../strings'
import { guestNamedInLine, inviteLineText } from '../wording'
import './christmasParty.css'

const img = (key, name) => `${import.meta.env.BASE_URL}${key}/${name}.webp`

// When the invitation appears after the tap (ms), and when the opening is gone
const TIMING = {
  'christmas-elegance': [2200, 2900],
  'pink-christmas': [2300, 3000],
  'winter-wonderland': [2300, 3000],
  'cosy-christmas': [2200, 2900],
  'christmas-after-dark': [2200, 2900],
}
// The opening button's words (keys in strings.js)
const BUTTON = {}

// "Family Christmas Party" → { pre: 'Family', script: 'Christmas', post: 'Party' }
function splitTitle(title = '') {
  const words = title.trim().split(/\s+/).filter(Boolean)
  const i = words.findIndex((w) => /^christmas/i.test(w))
  if (i >= 0) return { pre: words.slice(0, i).join(' '), script: words[i], post: words.slice(i + 1).join(' ') }
  if (words.length < 2) return { pre: '', script: '', post: words.join(' ') }
  return { pre: '', script: words.slice(0, -1).join(' '), post: words[words.length - 1] }
}

function seeded(seed, count, make) {
  let s = seed
  const r = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  return Array.from({ length: count }, (_, i) => make(r, i))
}

// A six-armed snowflake (viewBox -10 -10 20 20)
const FLAKE =
  'M0 -9V9M-7.8 -4.5L7.8 4.5M-7.8 4.5L7.8 -4.5M0 -6.4L-1.8 -8.2M0 -6.4L1.8 -8.2M0 6.4L-1.8 8.2M0 6.4L1.8 8.2M-5.5 -3.2L-7.9 -2.4M-5.5 -3.2L-5.9 -5.7M5.5 3.2L7.9 2.4M5.5 3.2L5.9 5.7M-5.5 3.2L-7.9 2.4M-5.5 3.2L-5.9 5.7M5.5 -3.2L7.9 -2.4M5.5 -3.2L5.9 -5.7'

// Golden snowflakes drifting down (a gentle fall, or a fast flurry after the tap)
function Snowflakes({ count = 22, seed = 7, flurry = false, className = '' }) {
  const flakes = useMemo(
    () =>
      seeded(seed, count, (r) => ({
        x: r() * 100,
        y: r() * 100,
        s: (flurry ? 10 : 9) + r() * (flurry ? 22 : 16),
        d: flurry ? r() * 0.6 : -r() * 16,
        dur: flurry ? 1.6 + r() * 1.2 : 11 + r() * 9,
        drift: Math.round(r() * 80 - 40),
        spin: Math.round(r() * 360 - 180),
        o: 0.55 + r() * 0.45,
      })),
    [count, seed, flurry],
  )
  return (
    <span className={`xp-flakes ${flurry ? 'is-flurry' : ''} ${className}`} aria-hidden="true">
      {flakes.map((f, i) => (
        <svg
          key={i}
          viewBox="-10 -10 20 20"
          style={{ left: `${f.x}%`, '--y': `${f.y}%`, width: f.s, height: f.s, opacity: f.o, animationDelay: `${f.d}s`, animationDuration: `${f.dur}s`, '--drift': `${f.drift}px`, '--spin': `${f.spin}deg` }}
        >
          <path d={FLAKE} />
        </svg>
      ))}
    </span>
  )
}

// White snow (Winter Wonderland): a gentle fall, or a thick flurry after the tap
function Snowfall({ count = 40, seed = 3, flurry = false }) {
  const flakes = useMemo(
    () =>
      seeded(seed, count, (r) => ({
        x: r() * 100,
        y: r() * 100,
        s: 2 + r() * (flurry ? 7 : 5),
        d: flurry ? r() * 0.8 : -r() * 14,
        dur: flurry ? 1.4 + r() * 1.4 : 8 + r() * 8,
        drift: Math.round(r() * 60 - 30),
      })),
    [count, seed, flurry],
  )
  return (
    <span className={`xp-snow ${flurry ? 'is-flurry' : ''}`} aria-hidden="true">
      {flakes.map((f, i) => (
        <i key={i} style={{ left: `${f.x}%`, '--y': `${f.y}%`, width: f.s, height: f.s, animationDelay: `${f.d}s`, animationDuration: `${f.dur}s`, '--drift': `${f.drift}px` }} />
      ))}
    </span>
  )
}

// Soft twinkling sparkles (Pink Christmas)
function Sparkles({ count = 18 }) {
  const items = useMemo(() => seeded(29, count, (r) => ({ x: r() * 100, y: r() * 100, s: 6 + r() * 12, d: -r() * 4 })), [count])
  return (
    <span className="xp-sparkles" aria-hidden="true">
      {items.map((p, i) => (
        <i key={i} style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, animationDelay: `${p.d}s` }} />
      ))}
    </span>
  )
}

// Confetti falling after the tap
function Confetti({ colours, count = 50 }) {
  const bits = useMemo(
    () =>
      seeded(colours.length * 53, count, (r, i) => ({
        x: r() * 100,
        d: 0.5 + r() * 0.6,
        dur: 2 + r() * 1.4,
        drift: Math.round(r() * 140 - 70),
        spin: Math.round(r() * 720 - 360),
        c: colours[i % colours.length],
        shape: i % 3,
      })),
    [colours, count],
  )
  return (
    <span className="xp-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} className={`s${b.shape}`} style={{ left: `${b.x}%`, background: b.c, animationDelay: `${b.d}s`, animationDuration: `${b.dur}s`, '--drift': `${b.drift}px`, '--spin': `${b.spin}deg` }} />
      ))}
    </span>
  )
}

function Backdrop({ variant, className = '' }) {
  return (
    <picture className={`xp-backdrop ${className}`} aria-hidden="true">
      <source media="(min-aspect-ratio: 1/1)" srcSet={img(variant, 'bg')} />
      <img src={img(variant, 'bg-tall')} alt="" decoding="async" />
    </picture>
  )
}

// The title: "Christmas" in script, the words around it in capitals
function Title({ invitation, as: Tag = 'p', className = '', headingRef }) {
  const { pre, script, post } = splitTitle(invitation.eventTitle || '…')
  return (
    <Tag ref={headingRef} tabIndex={headingRef ? -1 : undefined} className={`xp-title outline-none ${className}`}>
      {pre && <span className="xp-pre">{pre}</span>}
      {script && <span className="xp-script">{script}</span>}
      {post && <span className="xp-post">{post}</span>}
    </Tag>
  )
}

// ---------------------------------------------------------------- each design's artwork
function OpeningArt({ variant }) {
  if (variant === 'cosy-christmas') {
    return (
      <>
        <img className="xp-cinnamon" src={img(variant, 'cinnamon')} alt="" aria-hidden="true" decoding="async" />
        <Snowfall count={18} seed={9} />
      </>
    )
  }
  if (variant === 'christmas-after-dark') {
    return (
      <>
        <img className="xp-baubles" src={img(variant, 'baubles')} alt="" aria-hidden="true" decoding="async" />
        <Snowfall count={30} seed={21} />
      </>
    )
  }
  if (variant === 'pink-christmas') {
    return (
      <>
        <img className="xp-tree" src={img(variant, 'tree')} alt="" aria-hidden="true" decoding="async" />
        <img className="xp-canes" src={img(variant, 'candy-canes')} alt="" aria-hidden="true" decoding="async" />
        <Sparkles />
      </>
    )
  }
  if (variant === 'winter-wonderland') {
    return (
      <>
        <img className="xp-trees" src={img(variant, 'trees')} alt="" aria-hidden="true" decoding="async" />
        <Snowfall count={46} seed={5} />
      </>
    )
  }
  // christmas-elegance
  return (
    <>
      <img className="xp-garland" src={img(variant, 'garland')} alt="" aria-hidden="true" decoding="async" />
      <Snowflakes count={20} seed={11} />
    </>
  )
}

function CardArt({ variant }) {
  // pink-christmas: a satin band across the card's top, tied in a bow
  if (variant === 'pink-christmas') {
    return (
      <>
        <span className="xp-band" aria-hidden="true" />
        <img className="xp-bow" src={img(variant, 'bow')} alt="" aria-hidden="true" decoding="async" />
      </>
    )
  }
  // cosy-christmas: the wreath forms around the card; the gingerbread man peeks in
  if (variant === 'cosy-christmas') {
    return (
      <>
        <img className="xp-wreath" src={img(variant, 'wreath')} alt="" aria-hidden="true" decoding="async" />
        <img className="xp-ginger" src={img(variant, 'gingerbread')} alt="" aria-hidden="true" decoding="async" />
      </>
    )
  }
  // christmas-after-dark: the pine frame around a chalkboard
  if (variant === 'christmas-after-dark') return <img className="xp-frame" src={img(variant, 'frame')} alt="" aria-hidden="true" decoding="async" />
  // winter-wonderland: the frosted arch frames the card
  if (variant === 'winter-wonderland') return <img className="xp-arch" src={img(variant, 'arch')} alt="" aria-hidden="true" decoding="async" />
  // christmas-elegance: the ornament corner over the card's top right
  return <img className="xp-corner" src={img(variant, 'corner')} alt="" aria-hidden="true" decoding="async" />
}

function HeroArt({ variant }) {
  if (variant === 'cosy-christmas') {
    return (
      <>
        <img className="xp-wreath is-hero" src={img(variant, 'wreath')} alt="" aria-hidden="true" decoding="async" />
        <img className="xp-cinnamon is-hero" src={img(variant, 'cinnamon')} alt="" aria-hidden="true" decoding="async" />
        <img className="xp-ginger is-hero" src={img(variant, 'gingerbread')} alt="" aria-hidden="true" decoding="async" />
        <Snowfall count={14} seed={31} />
      </>
    )
  }
  if (variant === 'christmas-after-dark') {
    return (
      <>
        <img className="xp-frame is-hero" src={img(variant, 'frame')} alt="" aria-hidden="true" decoding="async" />
        <img className="xp-baubles is-hero" src={img(variant, 'baubles')} alt="" aria-hidden="true" decoding="async" />
        <Snowfall count={24} seed={43} />
      </>
    )
  }
  if (variant === 'pink-christmas') {
    return (
      <>
        <img className="xp-tree is-hero" src={img(variant, 'tree')} alt="" aria-hidden="true" decoding="async" />
        <img className="xp-canes is-hero" src={img(variant, 'candy-canes')} alt="" aria-hidden="true" decoding="async" />
        <Sparkles />
      </>
    )
  }
  if (variant === 'winter-wonderland') {
    return (
      <>
        <img className="xp-trees is-hero" src={img(variant, 'trees')} alt="" aria-hidden="true" decoding="async" />
        <Snowfall count={36} seed={17} />
      </>
    )
  }
  // christmas-elegance
  return (
    <>
      <img className="xp-garland" src={img(variant, 'garland')} alt="" aria-hidden="true" decoding="async" />
      <img className="xp-corner is-hero" src={img(variant, 'corner')} alt="" aria-hidden="true" decoding="async" />
      <Snowflakes count={16} seed={23} />
    </>
  )
}

export default function ChristmasParty({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const variant = TIMING[invitation.templateKey] ? invitation.templateKey : 'christmas-elegance'
  const [revealAt, doneAt] = TIMING[variant]
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (poster) return // thumbnails never take keyboard focus
    if (phase === 'closed') openBtnRef.current?.focus({ preventScroll: true })
    if (phase === 'open') headingRef.current?.focus({ preventScroll: true })
  }, [phase, poster])

  function open() {
    music.play() // inside the tap, so browsers allow sound
    timers.current = runTimeline(setPhase, revealAt, doneAt)
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const photos = invitation.photos || []
  const opening = phase !== 'closed'
  const invites = invitation.hostLine || (invitation.companyName ? t.xmasInvites?.(invitation.companyName) : t.together)
  const line = inviteLineText(invitation, guestName)
  // the guest's name, the party's title and the hosts, on the opening
  const tag = (
    <>
      <p className={`xp-eyebrow ${local}`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
      <Title invitation={invitation} />
      {invitation.companyName && <p className="xp-hosts">{invitation.companyName}</p>}
    </>
  )

  return (
    <>
      {/* ---------- Opening ---------- */}
      {phase !== 'open' && (
        <div className={`xp-opening xp-${variant} ${opening ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={t[BUTTON[variant]] || t.openInvitation}>
          <Backdrop variant={variant} />
          <OpeningArt variant={variant} />
          <div className="xp-stage" lang={lang}>
            <div className="xp-card">
              <CardArt variant={variant} />
              <div className="xp-card-in">{tag}</div>
            </div>
            <button ref={openBtnRef} type="button" className="xp-open-btn" onClick={open} disabled={opening}>
              {t[BUTTON[variant]] || t.openInvitation}
            </button>
          </div>
          {opening && variant === 'christmas-elegance' && <Snowflakes count={60} seed={37} flurry className="is-over" />}
          {opening && variant === 'winter-wonderland' && <Snowfall count={90} seed={41} flurry />}
          {opening && variant === 'cosy-christmas' && <Confetti colours={['#b3202e', '#d9a66b', '#f4ead8', '#2f6b45', '#c77d3a']} />}
          {opening && variant === 'christmas-after-dark' && <Snowfall count={80} seed={47} flurry />}
          {opening && variant === 'pink-christmas' && <Confetti colours={['#f7a8c4', '#ffffff', '#e7c27d', '#f4c6d7', '#d46a8c']} />}
          <span className="xp-glow" aria-hidden="true" />
          <span className="xp-flash" aria-hidden="true" />
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`xp-invite xp-${variant} ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="xp-hero">
            <Backdrop variant={variant} className="is-hero" />
            <HeroArt variant={variant} />
            <div className="xp-hero-inner">
              {variant === 'pink-christmas' && <img className="xp-bow is-hero" src={img(variant, 'bow')} alt="" aria-hidden="true" decoding="async" />}
              <Reveal variant="fade">
                {!guestNamedInLine(invitation) && <p className="xp-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                {invites && <p className={`xp-eyebrow ${local}`}>{invites}</p>}
              </Reveal>
              <Title invitation={invitation} as="h1" headingRef={headingRef} className="is-hero" />
              <Reveal delay={300}>
                <span className="xp-rule" aria-hidden="true" />
                <p className="xp-message">{invitation.message || t.defaultInvite}</p>
                {line && <p className="xp-line">{line}</p>}
              </Reveal>
            </div>
          </section>

          <section className="xp-section">
            <div className="xp-details">
              <Reveal className="xp-panel">
                <CalendarDays className="xp-icon" size={22} aria-hidden="true" />
                <p className={`xp-eyebrow ${local}`}>{t.when}</p>
                <p className="xp-panel-title">{date || '—'}</p>
                {time && (
                  <p className="xp-sub">
                    <Clock size={14} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="xp-panel" delay={120}>
                <MapPin className="xp-icon" size={22} aria-hidden="true" />
                <p className={`xp-eyebrow ${local}`}>{t.where}</p>
                <p className="xp-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="xp-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="xp-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="xp-sub xp-dress">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {ceremonies.length > 0 && (
            <section className="xp-section" aria-labelledby="xp-cer-h">
              <Reveal className="xp-panel">
                <h2 id="xp-cer-h" className={`xp-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="xp-programme">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="xp-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                      <p className="xp-cer-name">{c.name}</p>
                      {c.venue && <p className="xp-sub">{c.venue}</p>}
                      {c.note && <p className="xp-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="xp-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`xp-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`xp-photos ${galleryClass(photos.length, 4)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={(i % 4) * 110} className="xp-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="xp-section pb-16" aria-labelledby="xp-rsvp-h">
            <Reveal className="xp-panel xp-rsvp">
              <p className={`xp-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="xp-rsvp-h" className="xp-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && <p className="xp-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="xp-sign-off">
              <p className="xp-merry">{t.xmasMerry}</p>
              {invitation.companyName && <p className="xp-sign">{invitation.companyName}</p>}
              {guestName && <p className="xp-note">{t.personalNote(guestName)}</p>}
            </Reveal>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
