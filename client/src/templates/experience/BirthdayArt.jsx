// Artwork for the free birthday cards, drawn in SVG (no image files): confetti, a crown and
// stars, balloons and flowers, art-deco gold, and champagne bubbles. Purely decorative.

// A small seeded random generator, so the confetti lands in the same places every time
function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// ---------------------------------------------------------------- Confetti Pop
const CONFETTI_COLOURS = ['#f5b82e', '#1fa6a0', '#f26b5b', '#7b6cf6', '#ff9fb7', '#3fb6ea']

function confettiPieces(seed, count, w, h) {
  const r = seeded(seed)
  return Array.from({ length: count }, (_, i) => ({
    x: r() * w,
    y: r() * h,
    rot: Math.round(r() * 360),
    kind: i % 4, // 0 strip, 1 dot, 2 squiggle, 3 triangle
    color: CONFETTI_COLOURS[Math.floor(r() * CONFETTI_COLOURS.length)],
    size: 0.7 + r() * 0.6,
  }))
}

function Piece({ p }) {
  const t = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot}) scale(${p.size.toFixed(2)})`
  if (p.kind === 0) return <rect transform={t} x="-7" y="-2.5" width="14" height="5" rx="1.5" fill={p.color} />
  if (p.kind === 1) return <circle transform={t} r="4" fill={p.color} />
  if (p.kind === 2) return <path transform={t} d="M-9 0q3-6 6 0t6 0t6 0" fill="none" stroke={p.color} strokeWidth="2.6" strokeLinecap="round" />
  return <path transform={t} d="M0-5 5 4H-5z" fill={p.color} />
}

function ConfettiBand({ seed, count, className, height }) {
  const pieces = confettiPieces(seed, count, 400, height)
  return (
    <svg className={className} viewBox={`0 0 400 ${height}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {pieces.map((p, i) => (
        <Piece key={i} p={p} />
      ))}
    </svg>
  )
}

function ConfettiArt() {
  return (
    <>
      <ConfettiBand seed={11} count={34} height={150} className="bc-art bc-art-top" />
      <ConfettiBand seed={29} count={26} height={120} className="bc-art bc-art-bottom" />
      {/* Streamers hanging from the top corners */}
      <svg className="bc-art bc-streamers" viewBox="0 0 400 90" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
        <path d="M0 6q50 50 100 10t100 6" fill="none" stroke="#f26b5b" strokeWidth="5" strokeLinecap="round" />
        <path d="M400 6q-50 50-100 10t-100 6" fill="none" stroke="#1fa6a0" strokeWidth="5" strokeLinecap="round" />
        {[30, 70, 330, 370].map((x, i) => (
          <path key={x} d={`M${x} ${i % 2 ? 26 : 30}l8 14h-16z`} fill={i < 2 ? '#f5b82e' : '#7b6cf6'} />
        ))}
      </svg>
    </>
  )
}

// ---------------------------------------------------------------- Little Star
function Star({ x, y, r, fill, opacity = 1 }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rad = i % 2 ? r * 0.45 : r
    return `${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)}`
  }).join(' ')
  return <polygon points={pts} fill={fill} opacity={opacity} />
}

function Cloud({ x, y, s = 1, fill = '#ffffff' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <circle cx="0" cy="0" r="22" />
      <circle cx="26" cy="-10" r="28" />
      <circle cx="56" cy="0" r="22" />
      <rect x="0" y="0" width="56" height="22" />
    </g>
  )
}

function LittleStarArt() {
  return (
    <>
      <svg className="bc-art bc-art-top" viewBox="0 0 400 170" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
        <defs>
          <linearGradient id="bc-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3d488" />
            <stop offset="0.5" stopColor="#c9a24a" />
            <stop offset="1" stopColor="#e7c46f" />
          </linearGradient>
        </defs>
        {/* the little crown */}
        <g transform="translate(200 70)">
          <path d="M-46 30 -52-18-24 6 0-30 24 6 52-18 46 30z" fill="url(#bc-gold)" stroke="#a9832f" strokeWidth="2" strokeLinejoin="round" />
          <rect x="-48" y="30" width="96" height="14" rx="4" fill="url(#bc-gold)" stroke="#a9832f" strokeWidth="2" />
          <circle cx="0" cy="-34" r="6" fill="#7fb2d9" stroke="#a9832f" strokeWidth="2" />
          <circle cx="-52" cy="-22" r="5" fill="#7fb2d9" stroke="#a9832f" strokeWidth="2" />
          <circle cx="52" cy="-22" r="5" fill="#7fb2d9" stroke="#a9832f" strokeWidth="2" />
          <circle cx="0" cy="37" r="4" fill="#fff" />
          <circle cx="-26" cy="37" r="3" fill="#7fb2d9" />
          <circle cx="26" cy="37" r="3" fill="#7fb2d9" />
        </g>
        <Star x={84} y={46} r={11} fill="#e7c46f" />
        <Star x={318} y={40} r={9} fill="#e7c46f" />
        <Star x={52} y={110} r={6} fill="#7fb2d9" />
        <Star x={350} y={104} r={7} fill="#7fb2d9" />
        <Star x={128} y={18} r={5} fill="#7fb2d9" opacity={0.7} />
        <Star x={276} y={112} r={5} fill="#e7c46f" opacity={0.8} />
      </svg>
      <svg className="bc-art bc-art-bottom" viewBox="0 0 400 110" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <Cloud x={-10} y={88} s={1.4} fill="#dcecf8" />
        <Cloud x={120} y={98} s={1.1} fill="#e8f3fb" />
        <Cloud x={260} y={86} s={1.5} fill="#dcecf8" />
        <Star x={110} y={40} r={6} fill="#e7c46f" />
        <Star x={300} y={30} r={8} fill="#7fb2d9" opacity={0.8} />
      </svg>
    </>
  )
}

// ---------------------------------------------------------------- Blush Bloom
function Balloon({ x, y, rx = 26, fill, tilt = 0 }) {
  const ry = rx * 1.22
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <path d={`M0 ${ry} q-6 30 4 54 t-4 50`} fill="none" stroke="#c9a3ac" strokeWidth="1.4" />
      <ellipse cx="0" cy="0" rx={rx} ry={ry} fill={fill} />
      <path d={`M-4 ${ry - 1}h8l-4 7z`} fill={fill} />
      <ellipse cx={-rx * 0.38} cy={-ry * 0.42} rx={rx * 0.2} ry={ry * 0.28} fill="#fff" opacity="0.45" transform={`rotate(-20 ${-rx * 0.38} ${-ry * 0.42})`} />
    </g>
  )
}

function Flower({ x, y, s = 1, petal, centre = '#f7d27a' }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-9" rx="7" ry="10" fill={petal} transform={`rotate(${a})`} />
      ))}
      <circle r="5" fill={centre} />
    </g>
  )
}

function Leaf({ x, y, rot, s = 1 }) {
  return <path transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} d="M0 0q10-14 26 0q-16 14-26 0z" fill="#9cbf9a" />
}

function BlushBloomArt() {
  return (
    <>
      <svg className="bc-art bc-balloons left" viewBox="0 0 150 230" aria-hidden="true">
        <Balloon x={52} y={60} rx={30} fill="#f2a7b8" tilt={-8} />
        <Balloon x={104} y={84} rx={24} fill="#f7cdd6" tilt={6} />
        <Balloon x={40} y={128} rx={20} fill="#e88aa1" tilt={-4} />
      </svg>
      <svg className="bc-art bc-balloons right" viewBox="0 0 150 230" aria-hidden="true">
        <Balloon x={96} y={58} rx={28} fill="#f7cdd6" tilt={8} />
        <Balloon x={46} y={90} rx={22} fill="#e88aa1" tilt={-6} />
        <Balloon x={110} y={130} rx={19} fill="#f2a7b8" tilt={4} />
      </svg>
      <svg className="bc-art bc-art-bottom" viewBox="0 0 400 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        {[
          [20, 70, 30, 1.1],
          [70, 76, -20, 0.9],
          [150, 80, 15, 1],
          [250, 80, -15, 1],
          [330, 76, 20, 0.9],
          [380, 70, -30, 1.1],
        ].map(([x, y, rot, s], i) => (
          <Leaf key={i} x={x} y={y} rot={rot} s={s} />
        ))}
        <Flower x={40} y={66} s={1.2} petal="#f2a7b8" />
        <Flower x={110} y={74} s={0.9} petal="#fff" centre="#f2a7b8" />
        <Flower x={200} y={70} s={1.3} petal="#e88aa1" />
        <Flower x={290} y={74} s={0.9} petal="#fff" centre="#f2a7b8" />
        <Flower x={360} y={66} s={1.2} petal="#f2a7b8" />
      </svg>
    </>
  )
}

// ---------------------------------------------------------------- Black & Gold
// Modern, but clearly a party: shiny gold, black and champagne balloons in the top corner
// and fine gold confetti over the card
function FoilBalloon({ x, y, rx, fill, shine, tilt = 0, string = 120 }) {
  const ry = rx * 1.2
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <path d={`M0 ${ry + 6} q-10 ${string * 0.3} 6 ${string * 0.55} t-6 ${string * 0.45}`} fill="none" stroke="#c9a14f" strokeWidth="1.1" opacity="0.8" />
      <ellipse cx="0" cy="0" rx={rx} ry={ry} fill={fill} />
      <path d={`M-5 ${ry - 1}h10l-5 8z`} fill={fill} />
      <ellipse cx={-rx * 0.36} cy={-ry * 0.4} rx={rx * 0.18} ry={ry * 0.32} fill={shine} opacity="0.75" transform={`rotate(-24 ${-rx * 0.36} ${-ry * 0.4})`} />
      <ellipse cx={rx * 0.42} cy={ry * 0.38} rx={rx * 0.08} ry={ry * 0.14} fill={shine} opacity="0.35" />
    </g>
  )
}

function goldBits(seed, count, w, h) {
  const r = seeded(seed)
  return Array.from({ length: count }, (_, i) => ({ x: r() * w, y: r() * h, rot: Math.round(r() * 360), kind: i % 3, s: 0.7 + r() * 0.7 }))
}

// Fine gold confetti in a strip of the card's margin (never over the text)
function GoldConfetti({ seed, count, w, h, className }) {
  return (
    <svg className={`bc-art bc-gc ${className}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {goldBits(seed, count, w, h).map((p, i) => {
        const t = `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot}) scale(${p.s.toFixed(2)})`
        if (p.kind === 0) return <rect key={i} transform={t} x="-5" y="-1.4" width="10" height="2.8" rx="1" fill="#d9b768" opacity="0.85" />
        if (p.kind === 1) return <circle key={i} transform={t} r="2.2" fill="#e8cd8a" opacity="0.75" />
        return <path key={i} transform={t} d="M0-5 1.4-1.4 5 0 1.4 1.4 0 5-1.4 1.4-5 0-1.4-1.4z" fill="#f2dca2" opacity="0.9" />
      })}
    </svg>
  )
}

function BlackGoldArt() {
  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <radialGradient id="bc-foil-gold" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fff1c4" />
            <stop offset="0.35" stopColor="#e3bf6c" />
            <stop offset="0.75" stopColor="#a67a2c" />
            <stop offset="1" stopColor="#6e4f17" />
          </radialGradient>
          <radialGradient id="bc-foil-black" cx="0.35" cy="0.3" r="0.85">
            <stop offset="0" stopColor="#5a5a5a" />
            <stop offset="0.4" stopColor="#1f1f1f" />
            <stop offset="1" stopColor="#050505" />
          </radialGradient>
          <radialGradient id="bc-foil-champ" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#efe2c6" />
            <stop offset="1" stopColor="#b9a273" />
          </radialGradient>
        </defs>
      </svg>
      {/* fine gold confetti around the edges */}
      <GoldConfetti seed={53} count={16} w={400} h={56} className="top" />
      <GoldConfetti seed={71} count={9} w={40} h={400} className="side left" />
      <GoldConfetti seed={89} count={9} w={40} h={400} className="side right" />
      <GoldConfetti seed={97} count={14} w={400} h={44} className="bottom" />
      {/* the balloons */}
      <svg className="bc-art bc-foil-balloons" viewBox="0 0 220 300" aria-hidden="true">
        <FoilBalloon x={150} y={70} rx={44} fill="url(#bc-foil-gold)" shine="#fff8e1" tilt={8} string={150} />
        <FoilBalloon x={88} y={104} rx={36} fill="url(#bc-foil-black)" shine="#bdbdbd" tilt={-10} string={130} />
        <FoilBalloon x={176} y={150} rx={30} fill="url(#bc-foil-champ)" shine="#ffffff" tilt={12} string={110} />
      </svg>
      <span className="bc-art bc-hairline" aria-hidden="true" />
    </>
  )
}

// ---------------------------------------------------------------- Rosé Bubbles
function bubbles(seed, count, x0, x1) {
  const r = seeded(seed)
  return Array.from({ length: count }, () => ({ x: x0 + r() * (x1 - x0), y: r() * 600, r: 2 + r() * 9, filled: r() > 0.6 }))
}

function RoseBubblesArt() {
  const left = bubbles(7, 22, 0, 70)
  const right = bubbles(19, 22, 330, 400)
  return (
    <>
      <svg className="bc-art bc-bubbles" viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
        {[...left, ...right].map((b, i) =>
          b.filled ? (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="#e7b9ad" opacity="0.45" />
          ) : (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="none" stroke="#c98b7a" strokeWidth="1" opacity="0.7" />
          ),
        )}
      </svg>
      {/* two coupes, clinking */}
      <svg className="bc-art bc-glasses" viewBox="0 0 160 110" aria-hidden="true">
        <defs>
          <linearGradient id="bc-rose" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e9b8a6" />
            <stop offset="0.5" stopColor="#b9786a" />
            <stop offset="1" stopColor="#dca595" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="url(#bc-rose)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <g transform="rotate(-14 56 60)">
            <path d="M24 34h52q-2 26-26 28q-24-2-26-28z" fill="#f6dcd3" />
            <path d="M50 62v30M36 96h28" />
          </g>
          <g transform="rotate(14 104 60)">
            <path d="M84 34h52q-2 26-26 28q-24-2-26-28z" fill="#f6dcd3" />
            <path d="M110 62v30M96 96h28" />
          </g>
          <path d="M80 18v-8M70 22l-5-6M90 22l5-6" />
        </g>
        {[
          [48, 44, 2.2],
          [58, 50, 1.6],
          [104, 46, 2],
          [114, 40, 1.4],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#fff" />
        ))}
      </svg>
    </>
  )
}

export const BIRTHDAY_ART = {
  'confetti-pop': ConfettiArt,
  'little-star': LittleStarArt,
  'blush-bloom': BlushBloomArt,
  'black-gold': BlackGoldArt,
  'rose-bubbles': RoseBubblesArt,
}
