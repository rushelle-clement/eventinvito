// The animated birthday designs (Premium). One person and their age, an opening scene to tap,
// then the invitation. Each design (its template key) has its own scene, artwork and colours:
//  • balloon-bash     a bunch of balloons holds the name tag; the balloons float away
//  • ocean-adventure  a treasure chest on the sea floor opens in a burst of golden light
//  • fairy-garden     a flowered garden gate swings open and butterflies fly out
//  • midnight-gala    the gift box's lid lifts off in a burst of gold confetti
//  • rose-wish        "Make a wish": the cake's candles blow out, then rose-gold light and confetti
//  • midnight-glam    a starry gold arch holds the name; the stars flare and gold particles burst out
//  • disco-fever      a mirror disco ball turns in coloured light; it spins fast and the lights flash
// (the last two are drawn in code: BirthdayDrawn.jsx)
//  • tropical-paradise  a teal card framed by palm and monstera leaves swaying in a breeze, with
//                       hibiscus; on the tap the leaves part and the flowers fly off
// Artwork: /public/<key>/ (AI illustrations, cut out). Confetti, bubbles and light are drawn here.

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, runTimeline, timeRange } from './shared'
import { formatDate } from '../strings'
import { InviteLine } from './Wording'
import { guestNamedInLine } from '../wording'
import { AgeMark } from './BirthdayCard'
import { Burst, DiscoBall, DrawnBackdrop, GlamArch } from './BirthdayDrawn'
import './birthdayParty.css'
import './birthdayDrawn.css'
import './birthdayTropical.css'

// designs drawn in code, with no pictures (BirthdayDrawn.jsx)
const DRAWN = ['midnight-glam', 'disco-fever']

const img = (key, name) => `${import.meta.env.BASE_URL}${key}/${name}.webp`

// When the invitation appears after the tap (ms), and when the opening is gone
const TIMING = {
  'balloon-bash': [1900, 2600],
  'ocean-adventure': [2000, 2700],
  'fairy-garden': [2100, 2800],
  'midnight-gala': [1900, 2600],
  'rose-wish': [2400, 3100],
  'midnight-glam': [2100, 2800],
  'disco-fever': [2200, 2900],
  'tropical-paradise': [2000, 2700],
}
const BUTTON = { 'balloon-bash': 'openBalloons', 'ocean-adventure': 'openTreasure', 'fairy-garden': 'openGate', 'midnight-gala': 'openGift', 'rose-wish': 'openWish', 'midnight-glam': 'openStars', 'disco-fever': 'openDisco', 'tropical-paradise': 'openTropical' }

// A seeded random list, so the confetti and bubbles are the same every time
function seeded(seed, count, make) {
  let s = seed
  const r = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  return Array.from({ length: count }, (_, i) => make(r, i))
}

const PARTY_COLOURS = {
  'balloon-bash': ['#f2786b', '#f7c548', '#6cc7b5', '#7fb7ec', '#b79be6', '#ff9fb7'],
  'ocean-adventure': ['#ffd76a', '#f6b93b', '#ffffff', '#7fe0e6', '#ffe9a8'],
  'fairy-garden': ['#c8a2e8', '#f6b6cf', '#ffd6a5', '#b9d4ff', '#ffffff'],
  'midnight-gala': ['#f6dc95', '#d9b768', '#b98a35', '#fff3cf', '#e8cd8a'],
  'rose-wish': ['#e9b8a6', '#c98b7a', '#f6d3c8', '#ffffff', '#f2a7b8'],
  'midnight-glam': ['#f6e2b0', '#d8bc82', '#b8924e', '#fff6dc', '#e9cf95'],
  'disco-fever': ['#ff3fa4', '#b26bff', '#5aa8ff', '#ff9be0', '#ffffff', '#7a2cff'],
  'tropical-paradise': ['#ff7a59', '#ffc93c', '#2bb5a4', '#ffffff', '#ff9e80'],
}
// designs whose name tag sits inside the scene (the arch, the card)
const TAG_INSIDE = ['midnight-glam', 'tropical-paradise']

// The three candles' tips on the cake picture (% of its width and height)
const CANDLES = [38.5, 47, 55.9]

// Confetti that bursts out and falls after the tap
// (Rosé Wish waits until the candles are out)
const CONFETTI_AFTER = { 'rose-wish': 1.05 }

function ConfettiBurst({ variant }) {
  const colours = PARTY_COLOURS[variant]
  const bits = useMemo(
    () =>
      seeded(variant.length * 97, 46, (r, i) => ({
        left: `${(r() * 100).toFixed(1)}%`,
        delay: `${((CONFETTI_AFTER[variant] || 0) + r() * 0.5).toFixed(2)}s`,
        dur: `${(2.2 + r() * 1.6).toFixed(2)}s`,
        drift: `${Math.round(r() * 160 - 80)}px`,
        spin: `${Math.round(r() * 720 - 360)}deg`,
        colour: colours[i % colours.length],
        shape: i % 3,
      })),
    [variant, colours],
  )
  return (
    <div className="bp-confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          className={`bp-bit s${b.shape}`}
          style={{ left: b.left, background: b.colour, animationDelay: b.delay, animationDuration: b.dur, '--drift': b.drift, '--spin': b.spin }}
        />
      ))}
    </div>
  )
}

// Rising bubbles (ocean) or floating sparkles (garden, gala)
function Floaters({ kind, count = 16 }) {
  const items = useMemo(
    () =>
      seeded(kind.length * 31 + count, count, (r) => ({
        left: `${(r() * 100).toFixed(1)}%`,
        size: `${Math.round(6 + r() * 18)}px`,
        delay: `${(-r() * 12).toFixed(1)}s`,
        dur: `${(8 + r() * 8).toFixed(1)}s`,
      })),
    [kind, count],
  )
  return (
    <div className={`bp-floaters ${kind}`} aria-hidden="true">
      {items.map((b, i) => (
        <span key={i} style={{ left: b.left, width: b.size, height: b.size, animationDelay: b.delay, animationDuration: b.dur }} />
      ))}
    </div>
  )
}

function Backdrop({ variant, className = '' }) {
  if (DRAWN.includes(variant)) return <DrawnBackdrop variant={variant} className={className} />
  return (
    <picture className={`bp-backdrop ${className}`} aria-hidden="true">
      <source media="(min-aspect-ratio: 1/1)" srcSet={img(variant, 'bg')} />
      <img src={img(variant, 'bg-tall')} alt="" decoding="async" />
    </picture>
  )
}

const BUTTERFLIES = [
  { n: 1, x: 6, y: 18, r: -18, s: 1, fly: [-60, -70] },
  { n: 2, x: 78, y: 12, r: 14, s: 0.9, fly: [60, -80] },
  { n: 3, x: 84, y: 62, r: 20, s: 0.8, fly: [70, -20] },
  { n: 4, x: 2, y: 66, r: -12, s: 0.85, fly: [-70, -30] },
  { n: 5, x: 40, y: 2, r: 6, s: 0.7, fly: [10, -90] },
  { n: 6, x: 56, y: 74, r: -8, s: 0.75, fly: [30, 60] },
]

// The object to tap, for each design
function Scene({ variant, opened, tag, still }) {
  if (variant === 'midnight-glam') return <GlamArch>{tag}</GlamArch>
  if (variant === 'tropical-paradise') {
    return (
      <span className="bt-card">
        <img className="bt-leaves tl" src={img(variant, 'leaves-tl')} alt="" decoding="async" />
        <img className="bt-leaves br" src={img(variant, 'leaves-br')} alt="" decoding="async" />
        <img className="bt-bouquet" src={img(variant, 'hibiscus-bouquet')} alt="" decoding="async" />
        <img className="bt-flower" src={img(variant, 'hibiscus')} alt="" decoding="async" />
        <span className="bt-card-in">{tag}</span>
      </span>
    )
  }
  if (variant === 'disco-fever') return <DiscoBall spinning={opened} still={still} />
  if (variant === 'balloon-bash') {
    return <img className="bp-balloons" src={img(variant, 'balloons')} alt="" decoding="async" />
  }
  if (variant === 'ocean-adventure') {
    return (
      <span className="bp-chest">
        <img className="closed" src={img(variant, 'chest')} alt="" decoding="async" />
        <img className="open" src={img(variant, 'chest-open')} alt="" decoding="async" />
        <span className="bp-chest-glow" />
      </span>
    )
  }
  if (variant === 'fairy-garden') {
    return (
      <span className="bp-gate">
        <span className="bp-gate-light" />
        <img className="left" src={img(variant, 'gate-left')} alt="" decoding="async" />
        <img className="right" src={img(variant, 'gate-right')} alt="" decoding="async" />
        {BUTTERFLIES.map((b) => (
          <span
            key={b.n}
            className="bp-butterfly"
            style={{ left: `${b.x}%`, top: `${b.y}%`, '--r': `${b.r}deg`, '--s': b.s, '--fx': `${b.fly[0]}vw`, '--fy': `${b.fly[1]}vh`, animationDelay: `${-b.n * 0.37}s` }}
          >
            <img src={img(variant, `butterfly-${b.n}`)} alt="" decoding="async" />
          </span>
        ))}
      </span>
    )
  }
  if (variant === 'rose-wish') {
    return (
      <span className="bp-cake">
        <img src={img(variant, 'cake')} alt="" decoding="async" />
        {CANDLES.map((x, i) => (
          <span key={x} className="bp-candle" style={{ left: `${x}%`, '--i': i }}>
            <span className="bp-flame" />
            <span className="bp-smoke" />
          </span>
        ))}
        <span className="bp-cake-glow" />
      </span>
    )
  }
  // midnight-gala
  return (
    <span className={`bp-gift ${opened ? 'is-open' : ''}`}>
      <span className="bp-gift-light" />
      <img className="body" src={img(variant, 'gift-body')} alt="" decoding="async" />
      <img className="lid" src={img(variant, 'gift-lid')} alt="" decoding="async" />
    </span>
  )
}

// Decoration around the top of the invitation
function HeroArt({ variant, still }) {
  if (variant === 'balloon-bash') {
    return (
      <>
        <img className="bp-hero-art balloons left" src={img(variant, 'balloons')} alt="" aria-hidden="true" decoding="async" />
        <img className="bp-hero-art balloons right" src={img(variant, 'balloons')} alt="" aria-hidden="true" decoding="async" />
      </>
    )
  }
  if (variant === 'ocean-adventure') {
    return (
      <>
        <img className="bp-hero-art whale" src={img(variant, 'whale')} alt="" aria-hidden="true" decoding="async" />
        <Floaters kind="bubbles" count={18} />
      </>
    )
  }
  if (variant === 'fairy-garden') {
    return (
      <>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`bp-hero-art butterfly b${n}`} aria-hidden="true">
            <img src={img(variant, `butterfly-${n}`)} alt="" decoding="async" />
          </span>
        ))}
        <Floaters kind="sparkles" count={14} />
      </>
    )
  }
  if (variant === 'rose-wish') {
    return (
      <>
        <img className="bp-hero-art balloons left" src={img(variant, 'balloons')} alt="" aria-hidden="true" decoding="async" />
        <img className="bp-hero-art balloons right" src={img(variant, 'balloons')} alt="" aria-hidden="true" decoding="async" />
        <Floaters kind="rosy" count={16} />
      </>
    )
  }
  if (variant === 'midnight-glam') {
    return (
      <>
        <GlamArch className="bp-hero-art bd-hero-arch" />
        <Floaters kind="glitter" count={16} />
      </>
    )
  }
  if (variant === 'disco-fever') return <DiscoBall className="bp-hero-art bd-hero-ball" still={still} />
  if (variant === 'tropical-paradise') {
    return (
      <>
        <img className="bp-hero-art bt-leaves tl" src={img(variant, 'leaves-tl')} alt="" aria-hidden="true" decoding="async" />
        <img className="bp-hero-art bt-leaves br" src={img(variant, 'leaves-br')} alt="" aria-hidden="true" decoding="async" />
        <img className="bp-hero-art bt-bouquet" src={img(variant, 'hibiscus-bouquet')} alt="" aria-hidden="true" decoding="async" />
        <img className="bp-hero-art bt-flower" src={img(variant, 'hibiscus')} alt="" aria-hidden="true" decoding="async" />
        <Floaters kind="sunny" count={14} />
      </>
    )
  }
  return <Floaters kind="glitter" count={18} />
}

export default function BirthdayParty({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const variant = TIMING[invitation.templateKey] ? invitation.templateKey : 'balloon-bash'
  const [revealAt, doneAt] = TIMING[variant]
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
  const name = invitation.celebrant || '…'

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
  // the name tag: above the scene, or inside it (Midnight Glam's arch, Tropical Paradise's card)
  const tag = (
    <div className="bp-tag">
      <p className={`bp-eyebrow ${local}`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
      <p className="bp-tag-name">{name}</p>
      <AgeMark age={invitation.age} t={t} latin={latin} className="bp-tag-age" />
    </div>
  )

  return (
    <>
      {/* ---------- Opening ---------- */}
      {phase !== 'open' && (
        <div
          className={`bp-opening bp-${variant} ${opening ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t[BUTTON[variant]]}
        >
          <Backdrop variant={variant} />
          {variant === 'ocean-adventure' && (
            <>
              <img className="bp-swimmer" src={img(variant, 'whale')} alt="" aria-hidden="true" decoding="async" />
              <Floaters kind="bubbles" count={20} />
            </>
          )}
          {(variant === 'midnight-gala' || variant === 'midnight-glam') && <Floaters kind="glitter" count={22} />}
          {variant === 'tropical-paradise' && <Floaters kind="sunny" count={16} />}
          {variant === 'rose-wish' && <Floaters kind="rosy" count={18} />}

          <div className="bp-stage" lang={lang}>
            {!TAG_INSIDE.includes(variant) && tag}

            <div className="bp-scene">
              <Scene variant={variant} opened={opening} tag={tag} still={poster} />
            </div>

            <button ref={openBtnRef} type="button" className="bp-open-btn" onClick={open} disabled={opening}>
              {t[BUTTON[variant]]}
            </button>
          </div>

          <span className="bp-flash" aria-hidden="true" />
          {opening && DRAWN.includes(variant) && <Burst colours={PARTY_COLOURS[variant]} />}
          {opening && <ConfettiBurst variant={variant} />}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`bp-invite bp-${variant} ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="bp-hero">
            <Backdrop variant={variant} className="is-hero" />
            <HeroArt variant={variant} still={poster} />
            <div className="bp-hero-inner">
              <Reveal variant="fade">
                {!guestNamedInLine(invitation) && <p className={`bp-greeting ${local}`}>{guestName ? t.dear(guestName) : t.together}</p>}
                {invitation.hostLine && <p className="bp-hostline">{invitation.hostLine}</p>}
                <p className={`bp-eyebrow ${local}`}>{t.bdayJoin}</p>
              </Reveal>
              <h1 ref={headingRef} tabIndex={-1} className="bp-name outline-none">
                {name}
              </h1>
              <Reveal delay={300} variant="scale">
                <AgeMark age={invitation.age} t={t} latin={latin} className="bp-age" />
              </Reveal>
              <Reveal delay={500}>
                <p className="bp-message">{invitation.message || t.defaultInvite}</p>
                <InviteLine invitation={invitation} guestName={guestName} />
                <p className="bp-date">{date || '—'}</p>
                {time && <p className="bp-time">{time}</p>}
                {invitation.venueName && <p className={`bp-venue ${local}`}>{invitation.venueName}</p>}
              </Reveal>
            </div>
          </section>

          {photos.length > 0 && (
            <section className="bp-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`bp-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
              </Reveal>
              <div className={`bp-photos ${galleryClass(photos.length, 4)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={(i % 4) * 110} className="bp-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="bp-section">
            <div className="bp-details">
              <Reveal className="bp-panel">
                <CalendarDays className="bp-icon" size={22} aria-hidden="true" />
                <p className={`bp-eyebrow ${local}`}>{t.when}</p>
                <p className="bp-panel-title">{date || '—'}</p>
                {time && (
                  <p className="bp-sub">
                    <Clock size={14} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="bp-panel" delay={120}>
                <MapPin className="bp-icon" size={22} aria-hidden="true" />
                <p className={`bp-eyebrow ${local}`}>{t.where}</p>
                <p className="bp-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="bp-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="bp-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="bp-sub bp-dress">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {ceremonies.length > 0 && (
            <section className="bp-section" aria-labelledby="bp-cer-h">
              <Reveal className="bp-panel">
                <h2 id="bp-cer-h" className={`bp-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="bp-programme">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="bp-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                      <p className="bp-cer-name">{c.name}</p>
                      {c.venue && <p className="bp-sub">{c.venue}</p>}
                      {c.note && <p className="bp-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          <section className="bp-section pb-16" aria-labelledby="bp-rsvp-h">
            <Reveal className="bp-panel bp-rsvp">
              <p className={`bp-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="bp-rsvp-h" className="bp-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="bp-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="bp-sign-off">
              <p className="bp-signoff-line">{t.bdaySignoff}</p>
              <p className="bp-sign">{name}</p>
              {guestName && <p className="bp-note">{t.personalNote(guestName)}</p>}
            </Reveal>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
