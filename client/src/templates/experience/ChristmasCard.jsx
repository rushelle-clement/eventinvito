// The five free Christmas party cards: the invitation's front (the design's own artwork, the
// party's title and the message, with a light animation), then the When and Where cards, the
// programme and the reply. No tap-to-open, music or photos (those come with the Premium designs).
//
//  classic-noel  ivory, Christmas red and pine green: holly sprigs and a gold frame; snow falls
//  candy-cane    red and white: a candy-stripe border that slides and peppermints that turn
//  nordic-pine   linen, sage and charcoal: a row of fine-line pine trees draws itself in
//  golden-star   midnight navy and gold: a glowing star and twinkling stars
//  silent-night  a snowy village at night: falling snow, windows glowing warm
//
// All drawn in code. The panel under the card reuses the corporate cards' pieces (corporate.css).

import { useMemo } from 'react'
import { Details, Programme, Reply } from './corporateShared'
import { guestNamedInLine, inviteLineText } from '../wording'
import './corporate.css'
import './christmasCard.css'

const VARIANTS = ['classic-noel', 'candy-cane', 'nordic-pine', 'golden-star', 'silent-night']

// "Family Christmas Party" → { pre: 'Family', script: 'Christmas', post: 'Party' };
// without "Christmas" the last word is set apart: "Carol Night" → { script: 'Carol', post: 'Night' }
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

// Falling snow over the card
function Snow({ count = 28, seed = 3 }) {
  const flakes = useMemo(
    () => seeded(seed, count, (r) => ({ x: r() * 100, y: r() * 90, s: 2 + r() * 4, d: -r() * 12, dur: 7 + r() * 7, drift: r() * 30 - 15 })),
    [count, seed],
  )
  return (
    <span className="xc-snow" aria-hidden="true">
      {flakes.map((f, i) => (
        <i key={i} style={{ left: `${f.x}%`, '--y': `${f.y}%`, width: f.s, height: f.s, animationDelay: `${f.d}s`, animationDuration: `${f.dur}s`, '--drift': `${f.drift}px` }} />
      ))}
    </span>
  )
}

// A holly sprig: three leaves and berries (viewBox 0 0 120 90)
function Holly({ className }) {
  const leaf = 'M0 0 C 8 -6, 14 -2, 18 -8 C 20 -2, 28 -4, 32 -10 C 34 -2, 42 -2, 46 -8 C 46 0, 54 2, 58 -2 C 52 8, 44 6, 40 12 C 34 8, 28 12, 24 16 C 20 10, 12 12, 8 14 C 8 8, 2 6, 0 0 Z'
  return (
    <svg className={className} viewBox="0 0 120 90" aria-hidden="true">
      <g fill="#1f5a3a" stroke="#174630" strokeWidth="0.8">
        <path d={leaf} transform="translate(56 44) rotate(-160) scale(0.95)" />
        <path d={leaf} transform="translate(60 46) rotate(-20) scale(1.05)" />
        <path d={leaf} transform="translate(58 50) rotate(70) scale(0.85)" />
      </g>
      <g fill="none" stroke="#2f7a52" strokeWidth="0.7" opacity="0.8">
        <path d="M56 44 L8 30" />
        <path d="M60 46 L110 26" />
        <path d="M58 50 L52 92" />
      </g>
      <g className="xc-berries">
        <circle cx="54" cy="40" r="6" fill="#c4202f" />
        <circle cx="64" cy="38" r="5.5" fill="#b3202e" />
        <circle cx="60" cy="48" r="6" fill="#d02a37" />
        <circle cx="52" cy="38.5" r="1.6" fill="#ffffff" opacity="0.7" />
        <circle cx="62.5" cy="36.5" r="1.4" fill="#ffffff" opacity="0.7" />
        <circle cx="58.5" cy="46.5" r="1.6" fill="#ffffff" opacity="0.7" />
      </g>
    </svg>
  )
}

const star = (cx, cy, r, points = 5, inner = 0.45) =>
  Array.from({ length: points * 2 }, (_, i) => {
    const a = (Math.PI * i) / points - Math.PI / 2
    const rr = i % 2 ? r * inner : r
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`
  }).join(' ')

// ---------------------------------------------------------------- each design's artwork
function Art({ variant }) {
  if (variant === 'classic-noel') {
    return (
      <>
        <span className="xc-frame" aria-hidden="true" />
        <Holly className="xc-holly tl" />
        <Holly className="xc-holly br" />
        <Snow count={26} seed={5} />
      </>
    )
  }
  if (variant === 'candy-cane') {
    return (
      <>
        <span className="xc-stripes" aria-hidden="true" />
        <span className="xc-mints" aria-hidden="true">
          <i /> <i /> <i /> <i />
        </span>
        <svg className="xc-canes" viewBox="0 0 100 60" aria-hidden="true">
          <defs>
            <pattern id="xc-cane-stripes" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#ffffff" />
              <rect width="3" height="6" fill="#d7263d" />
            </pattern>
          </defs>
          <path d="M38 58 V24 A9 9 0 0 1 56 24 V28" fill="none" stroke="url(#xc-cane-stripes)" strokeWidth="6" strokeLinecap="round" />
          <path d="M62 58 V24 A9 9 0 0 0 44 24 V28" fill="none" stroke="url(#xc-cane-stripes)" strokeWidth="6" strokeLinecap="round" opacity="0.95" />
          <path d="M44 40 q6 -6 12 0 q-6 6 -12 0 z" fill="#2f8f5b" />
          <circle cx="50" cy="40" r="2.6" fill="#d7263d" />
        </svg>
      </>
    )
  }
  if (variant === 'nordic-pine') {
    const trees = [
      [12, 92, 18], [26, 96, 26], [42, 92, 20], [58, 97, 30], [74, 93, 22], [88, 96, 26],
    ]
    return (
      <>
        <svg className="xc-forest" viewBox="0 60 100 40" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          {trees.map(([x, base, h], i) => (
            <g key={i} className="xc-tree" style={{ '--i': i }}>
              <path pathLength="1" d={`M${x} ${base} V${base - h}`} />
              {Array.from({ length: Math.round(h / 4) }, (_, k) => {
                const y = base - h + 3 + k * 4
                const w = 1.2 + k * 1.15
                return <path key={k} pathLength="1" d={`M${x - w} ${y + 2.4} L${x} ${y} L${x + w} ${y + 2.4}`} />
              })}
              <polygon className="xc-tree-star" points={star(x, base - h - 1.6, 1.6)} />
            </g>
          ))}
          <path className="xc-ground" pathLength="1" d="M2 97.5 H98" />
        </svg>
        <Snow count={16} seed={9} />
      </>
    )
  }
  if (variant === 'golden-star') {
    const small = [
      [14, 18, 1.6], [84, 14, 2], [10, 46, 1.2], [90, 40, 1.4], [20, 76, 1.8], [80, 72, 1.3], [50, 90, 1.1], [32, 8, 1], [68, 6, 1.2],
    ]
    return (
      <>
        <span className="xc-frame" aria-hidden="true" />
        <svg className="xc-star" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="xc-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fbe7ae" />
              <stop offset="0.5" stopColor="#d9b768" />
              <stop offset="1" stopColor="#a8823f" />
            </linearGradient>
            <radialGradient id="xc-glow">
              <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.75" />
              <stop offset="1" stopColor="#ffe9b0" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="xc-glow" cx="50" cy="50" r="48" fill="url(#xc-glow)" />
          <g className="xc-rays" stroke="url(#xc-gold)" strokeWidth="0.5" opacity="0.7">
            {Array.from({ length: 16 }, (_, i) => {
              const a = (i * Math.PI) / 8
              const r1 = i % 2 ? 22 : 18
              const r2 = i % 2 ? 34 : 44
              return <line key={i} x1={50 + r1 * Math.cos(a)} y1={50 + r1 * Math.sin(a)} x2={50 + r2 * Math.cos(a)} y2={50 + r2 * Math.sin(a)} />
            })}
          </g>
          <polygon points={star(50, 50, 16, 8, 0.42)} fill="url(#xc-gold)" />
          <polygon points={star(50, 50, 7, 4, 0.35)} fill="#fff6d8" opacity="0.8" />
        </svg>
        <svg className="xc-twinkles" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {small.map(([x, y, r], i) => (
            <polygon key={i} points={star(x, y, r * 1.6, 4, 0.3)} style={{ animationDelay: `${-i * 0.6}s` }} />
          ))}
        </svg>
      </>
    )
  }
  // silent-night
  const windows = [
    [14, 82], [20, 82], [33, 78], [39, 78], [55, 84], [70, 80], [76, 80], [86, 83],
  ]
  return (
    <>
      <span className="xc-moon" aria-hidden="true" />
      <svg className="xc-village" viewBox="0 0 100 40" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <g fill="#0a1430">
          <path d="M8 40 V22 L17 14 L26 22 V40 Z" />
          <path d="M28 40 V18 L36 10 L44 18 V40 Z" />
          <path d="M46 40 V20 H50 V8 L53 2 L56 8 V20 H60 V40 Z" />
          <path d="M62 40 V24 L70 16 L78 24 V40 Z" />
          <path d="M80 40 V20 L88 13 L96 20 V40 Z" />
        </g>
        <g fill="#eef3fb">
          <path d="M8 22 L17 14 L26 22 L24 22 L17 16 L10 22 Z" />
          <path d="M28 18 L36 10 L44 18 L42 18 L36 12 L30 18 Z" />
          <path d="M62 24 L70 16 L78 24 L76 24 L70 18 L64 24 Z" />
          <path d="M80 20 L88 13 L96 20 L94 20 L88 15 L82 20 Z" />
          <path d="M0 40 V36 Q25 33 50 36 T100 35 V40 Z" />
        </g>
        <g className="xc-windows">
          {windows.map(([x, y], i) => (
            <rect key={i} x={x - 1.6} y={y - 52} width="3.2" height="3.6" rx="0.4" style={{ animationDelay: `${-i * 0.8}s` }} />
          ))}
          <path d="M51.6 26 a1.4 1.4 0 0 1 2.8 0 V30 h-2.8 Z" />
        </g>
      </svg>
      <Snow count={34} seed={13} />
    </>
  )
}

export default function ChristmasCard({ invitation, guestName, rsvp, t, lang, embedded = false }) {
  const variant = VARIANTS.includes(invitation.templateKey) ? invitation.templateKey : 'classic-noel'
  const { pre, script, post } = splitTitle(invitation.eventTitle || '…')
  const invites = invitation.hostLine || (invitation.companyName ? t.xmasInvites?.(invitation.companyName) : t.together)
  const line = inviteLineText(invitation, guestName)

  return (
    <main className={`cx-page xc-page xc-${variant} ${embedded ? 'is-embedded' : ''}`} lang={lang}>
      <article className={`xc xc-${variant}`}>
        <Art variant={variant} />
        <div className="xc-in">
          {!guestNamedInLine(invitation) && <p className="xc-dear">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
          {invites && <p className="xc-invites">{invites}</p>}
          <h1 className="xc-title">
            {pre && <span className="xc-pre">{pre}</span>}
            {script && <span className="xc-script">{script}</span>}
            {post && <span className="xc-post">{post}</span>}
          </h1>
          <span className="xc-rule" aria-hidden="true" />
          <p className="xc-message">{invitation.message || t.defaultInvite}</p>
          {line && <p className="xc-line">{line}</p>}
        </div>
      </article>

      <section className="cx-card cx-info">
        <Details invitation={invitation} t={t} lang={lang} className="cx-l" />
        <Programme invitation={invitation} t={t} lang={lang} className="cx-l" />
        {!embedded && <Reply invitation={invitation} rsvp={rsvp} t={t} lang={lang} className="cx-l" />}
        {invitation.companyName && (
          <p className="cx-company">
            {t.xmasHosted} {invitation.companyName}
          </p>
        )}
      </section>
      {guestName && !embedded && <p className="cx-note">{t.personalNote(guestName)}</p>}
    </main>
  )
}
