import { useId } from 'react'

// Decorative vector artwork shared by the invitation designs. Everything is drawn in code,
// so it is sharp on every screen and costs no image downloads. All of it is aria-hidden.

const ring = (count, fn) => Array.from({ length: count }, (_, i) => fn((360 / count) * i, i))

// ---------- Indian ornament ----------

// A mandala in gold line-work: lotus petals, a beaded ring, pointed petals and a flower centre
export function Mandala({ className = '', style, color = 'currentColor', detail = 'full' }) {
  const full = detail === 'full'
  return (
    <svg className={className} style={style} viewBox="-100 -100 200 200" fill="none" stroke={color} strokeWidth="0.9" aria-hidden="true">
      {full && <circle r="97" strokeWidth="0.6" />}
      {full && ring(32, (a) => <path key={a} transform={`rotate(${a})`} d="M0 -96 C 7 -88, 7 -80, 0 -74 C -7 -80, -7 -88, 0 -96 Z" />)}
      {full && <circle r="73" strokeWidth="0.6" />}
      {full && ring(48, (a) => <circle key={a} transform={`rotate(${a})`} cy="-69" r="1.3" fill={color} stroke="none" />)}
      <circle r="64" strokeWidth="0.7" />
      {ring(16, (a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0 -63 C 12 -50, 12 -36, 0 -26 C -12 -36, -12 -50, 0 -63 Z" />
          <path d="M0 -56 C 6 -48, 6 -38, 0 -32 C -6 -38, -6 -48, 0 -56 Z" strokeWidth="0.6" />
        </g>
      ))}
      {ring(16, (a) => <path key={`b${a}`} transform={`rotate(${a + 11.25})`} d="M0 -58 L 3 -44 L 0 -36 L -3 -44 Z" fill={color} fillOpacity="0.35" strokeWidth="0.5" />)}
      <circle r="25" strokeWidth="0.8" />
      {ring(8, (a) => <path key={`c${a}`} transform={`rotate(${a})`} d="M0 -24 C 8 -16, 8 -8, 0 -3 C -8 -8, -8 -16, 0 -24 Z" fill={color} fillOpacity="0.18" />)}
      <circle r="5" fill={color} fillOpacity="0.6" />
      <circle r="9" strokeWidth="0.6" />
    </svg>
  )
}

// A paisley (buta) with inner curl and dots, for corners
export function Paisley({ className = '', style, color = 'currentColor' }) {
  return (
    <svg className={className} style={style} viewBox="0 0 100 140" fill="none" stroke={color} strokeWidth="1.2" aria-hidden="true">
      <path d="M50 134 C 14 128, 4 92, 18 64 C 30 40, 58 34, 66 14 C 70 4, 82 4, 84 16 C 88 40, 92 70, 84 96 C 77 120, 66 134, 50 134 Z" />
      <path d="M50 120 C 26 116, 20 92, 30 72 C 40 54, 60 50, 68 30 C 74 52, 76 76, 70 96 C 66 110, 60 120, 50 120 Z" strokeWidth="0.9" />
      <path d="M46 104 C 34 100, 34 86, 42 80 C 50 74, 60 80, 58 90 C 56 98, 48 98, 48 92" strokeWidth="0.9" />
      {[[30, 66], [24, 84], [26, 102], [36, 116], [74, 40], [78, 62], [78, 84]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill={color} stroke="none" />
      ))}
    </svg>
  )
}

// The top of a Mughal-style cusped (multifoil) arch. Stretches to any width; the sides are drawn
// by the box underneath, so the frame grows with the content.
export function ArchTop({ className = '', style, color = 'currentColor', fill = 'none' }) {
  const outer = 'M0 140 L0 98 C 0 80, 18 76, 30 70 C 34 50, 56 44, 70 46 C 78 26, 108 18, 126 26 C 140 10, 170 4, 200 0 C 230 4, 260 10, 274 26 C 292 18, 322 26, 330 46 C 344 44, 366 50, 370 70 C 382 76, 400 80, 400 98 L400 140'
  const inner = 'M8 140 L8 101 C 8 87, 24 84, 36 78 C 40 59, 59 53, 74 55 C 82 37, 108 30, 128 37 C 142 22, 170 15, 200 12 C 230 15, 258 22, 272 37 C 292 30, 318 37, 326 55 C 341 53, 360 59, 364 78 C 376 84, 392 87, 392 101 L392 140'
  return (
    <svg className={className} style={style} viewBox="0 0 400 140" preserveAspectRatio="none" fill="none" aria-hidden="true">
      {fill !== 'none' && <path d={`${outer} Z`} fill={fill} stroke="none" />}
      <path d={outer} stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <path d={inner} stroke={color} strokeWidth="1" strokeOpacity="0.7" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Small kalash-like finial / lotus bud at the arch's peak
export function Finial({ className = '', style, color = 'currentColor' }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 70" fill="none" stroke={color} strokeWidth="1.2" aria-hidden="true">
      <path d="M30 4 C 34 12, 34 18, 30 22 C 26 18, 26 12, 30 4 Z" fill={color} fillOpacity="0.5" />
      <path d="M30 22 C 46 26, 50 40, 30 50 C 10 40, 14 26, 30 22 Z" />
      <path d="M30 28 C 38 32, 40 40, 30 45 C 20 40, 22 32, 30 28 Z" fill={color} fillOpacity="0.25" />
      <path d="M12 56 L48 56 M18 62 L42 62" />
    </svg>
  )
}

// A row of small motifs, used as a divider
export function OrnamentDivider({ className = '', style, color = 'currentColor' }) {
  return (
    <svg className={className} style={style} viewBox="0 0 240 24" fill="none" stroke={color} strokeWidth="1" aria-hidden="true">
      <path d="M0 12 H 92 M 148 12 H 240" strokeOpacity="0.8" />
      <path d="M120 2 C 128 8, 128 16, 120 22 C 112 16, 112 8, 120 2 Z" fill={color} fillOpacity="0.35" />
      <path d="M104 12 C 108 6, 114 6, 116 12 C 114 18, 108 18, 104 12 Z M136 12 C 132 6, 126 6, 124 12 C 126 18, 132 18, 136 12 Z" />
      <circle cx="96" cy="12" r="1.8" fill={color} stroke="none" />
      <circle cx="144" cy="12" r="1.8" fill={color} stroke="none" />
    </svg>
  )
}

// ---------- Romantic florals ----------

// A rose: three rings of cupped petals around a spiral bud, with leaves. `draw` adds the
// line-drawing animation (outlines draw in, then the colour blooms).
const PETAL = 'M0 0 C 24 -4, 38 -26, 30 -48 C 20 -62, -20 -62, -30 -48 C -38 -26, -24 -4, 0 0 Z'
const RINGS = [
  { n: 5, r: 4, s: 1.05, off: 0, shade: 0 },
  { n: 5, r: 2, s: 0.8, off: 36, shade: 1 },
  { n: 4, r: 1, s: 0.56, off: 15, shade: 2 },
]

export function Rose({ className = '', style, petal = '#b0122b', deep = '#7a0a1d', leaf = '#5d6b3a', draw = false }) {
  const id = useId().replace(/:/g, '')
  const d = draw ? 'cl-draw' : ''
  const shades = [deep, petal, `color-mix(in srgb, ${petal} 78%, white)`]
  return (
    <svg className={className} style={style} viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        {shades.map((c, i) => (
          <radialGradient key={i} id={`${id}-g${i}`} cx="50%" cy="85%" r="90%">
            <stop offset="0" stopColor={deep} />
            <stop offset="0.75" stopColor={c} />
          </radialGradient>
        ))}
      </defs>
      <g className={d} stroke={leaf} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path className="cl-fill" style={{ '--fill': leaf }} d="M62 116 C 36 112, 16 128, 8 150 C 34 152, 54 140, 62 116 Z" />
        <path fill="none" d="M62 116 C 44 128, 26 140, 8 150 M40 130 L 30 124 M30 138 L 20 134" />
        <path className="cl-fill" style={{ '--fill': leaf }} d="M100 118 C 126 110, 146 124, 154 144 C 128 148, 108 140, 100 118 Z" />
        <path fill="none" d="M100 118 C 118 128, 136 136, 154 144 M120 128 L 128 120 M134 136 L 142 128" />
        <path fill="none" d="M80 118 C 82 134, 80 146, 76 158" />
      </g>
      <g className={d} stroke={deep} strokeWidth="1" strokeLinejoin="round" transform="translate(80 76)">
        {RINGS.map((ring, ri) =>
          Array.from({ length: ring.n }, (_, i) => {
            const a = ring.off + (360 / ring.n) * i
            return (
              <path
                key={`${ri}-${i}`}
                className="cl-fill"
                style={{ '--fill': `url(#${id}-g${ring.shade})` }}
                transform={`rotate(${a}) translate(0 ${ring.r}) scale(${ring.s})`}
                d={PETAL}
              />
            )
          }),
        )}
        {/* the tightly furled centre */}
        <path className="cl-fill" style={{ '--fill': `url(#${id}-g1)` }} d="M-14 2 C -16 -14, 0 -20, 10 -12 C 18 -4, 12 10, 0 10 C -8 10, -12 2, -6 -4 C 0 -8, 6 -4, 4 2" />
        <path fill="none" d="M-6 -4 C 0 -8, 6 -4, 4 2 M-14 2 C -10 8, 4 14, 14 4" strokeWidth="1.2" />
      </g>
    </svg>
  )
}

// A small rose bud for corners and dividers
export function RoseBud({ className = '', style, petal = '#b0122b', leaf = '#5d6b3a' }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 80" aria-hidden="true">
      <path d="M30 78 C 30 62, 30 52, 30 40" stroke={leaf} strokeWidth="1.4" fill="none" />
      <path d="M30 60 C 18 58, 10 50, 8 42 C 20 42, 28 50, 30 60 Z" fill={leaf} />
      <path d="M30 4 C 44 10, 48 26, 42 36 C 38 42, 22 42, 18 36 C 12 26, 16 10, 30 4 Z" fill={petal} />
      <path d="M22 34 C 24 22, 30 14, 30 6 M38 34 C 36 24, 32 18, 30 12" stroke="rgba(0,0,0,0.25)" strokeWidth="1" fill="none" />
    </svg>
  )
}
