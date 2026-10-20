// Traditional Sri Lankan ornament drawn as fine line art (SVG), shared by the Kandyan designs:
//  • Liyawel — a flowing vine with spiral tendrils, leaves and buds
//  • a Thorana-style arch — cusped outline with a pearl-bead inner edge, scroll ends at the
//    spring points and a lotus-bud finial at the apex
//  • Pala pethi — a running border of lotus petals (as a CSS background, see kandyanArt.css)
// Everything is drawn for the left half and mirrored, so the ornament is perfectly symmetrical.
// With `animate`, each line draws itself (stroke-dashoffset), timed along the stem.

import './kandyanArt.css'

// ---------- geometry helpers (module-level, computed once) ----------

function cubic([a, b, c, d], t) {
  const u = 1 - t
  const x = u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0]
  const y = u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0])
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1])
  return { x, y, a: Math.atan2(dy, dx) }
}
const cubicPath = ([a, b, c, d]) => `M${a[0]} ${a[1]} C ${b[0]} ${b[1]}, ${c[0]} ${c[1]}, ${d[0]} ${d[1]}`
const f = (n) => n.toFixed(1)

// A tendril curling away from a point on the stem: an inward spiral that starts along the stem
function spiral(x0, y0, angle, R, side, turns = 1.55) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const pts = []
  for (let i = 0; i <= 36; i++) {
    const s = i / 36
    const th = s * turns * 2 * Math.PI
    const r = R * (1 - 0.82 * s)
    const lx = r * Math.sin(th)
    const ly = side * (R - r * Math.cos(th))
    pts.push(`${f(x0 + lx * cos - ly * sin)} ${f(y0 + lx * sin + ly * cos)}`)
  }
  const end = pts[pts.length - 1].split(' ').map(Number)
  return { d: `M${pts.join(' L')}`, end }
}

const leafD = (len) => `M0 0 C ${f(len * 0.25)} ${f(-len * 0.38)}, ${f(len * 0.75)} ${f(-len * 0.34)}, ${len} 0 C ${f(len * 0.7)} ${f(len * 0.2)}, ${f(len * 0.25)} ${f(len * 0.24)}, 0 0 Z`

// One Liyawel vine along a cubic: tendrils alternate sides, a leaf between each pair, timed to the stem
function liyawel(p, { curls, R, leaf, delay, dur }) {
  const parts = { stem: cubicPath(p), curls: [], leaves: [], buds: [] }
  for (let k = 1; k <= curls; k++) {
    const t = k / (curls + 1)
    const pt = cubic(p, t)
    const side = k % 2 ? -1 : 1
    const sp = spiral(pt.x, pt.y, pt.a, R * (1 - t * 0.25), side)
    parts.curls.push({ d: sp.d, at: delay + t * dur })
    parts.buds.push({ x: sp.end[0], y: sp.end[1], at: delay + t * dur + 0.5 })
    const lt = t + 0.5 / (curls + 1)
    const lp = cubic(p, Math.min(lt, 0.97))
    const ang = (lp.a * 180) / Math.PI - side * 48
    parts.leaves.push({ transform: `translate(${f(lp.x)} ${f(lp.y)}) rotate(${f(ang)})`, d: leafD(leaf), at: delay + lt * dur })
  }
  return parts
}

// ---------- the frame (400 × 600 box; the card sits inside it) ----------

const VINE = liyawel([[198, 594], [96, 602], [12, 528], [22, 262]], { curls: 7, R: 17, leaf: 20, delay: 2.2, dur: 2.0 })
const ARCH_OUTER = 'M22 262 C 22 146, 114 66, 184 40 C 193 36, 198 29, 200 16'
const ARCH_INNER = 'M32 268 C 33 160, 120 80, 189 54 C 195 51, 199 46, 200 38'
const ARCH_INNER_P = [[32, 268], [33, 160], [120, 80], [189, 54]]
const BEADS = Array.from({ length: 13 }, (_, i) => cubic(ARCH_INNER_P, 0.06 + (i * 0.9) / 12))
const SCROLL = spiral(22, 262, Math.PI / 2, 11, 1, 1.6)
const FINIAL = 'M200 0 C 206 8, 208 14, 200 22 C 192 14, 194 8, 200 0 Z M200 22 C 209 19, 215 12, 213 6 M200 22 C 191 19, 185 12, 187 6'

function Half({ animate }) {
  const t = (at) => (animate ? { '--at': `${at.toFixed(2)}s` } : undefined)
  return (
    <g>
      <path className="ka-line ka-stem" d={VINE.stem} pathLength="1" style={animate ? { '--at': '2.2s', '--dur': '2s' } : undefined} />
      {VINE.curls.map((c, i) => (
        <path key={`c${i}`} className="ka-line ka-curl" d={c.d} pathLength="1" style={t(c.at)} />
      ))}
      {VINE.leaves.map((l, i) => (
        <path key={`l${i}`} className="ka-line ka-leaf" d={l.d} transform={l.transform} pathLength="1" style={t(l.at)} />
      ))}
      {VINE.buds.map((b, i) => (
        <circle key={`b${i}`} className="ka-dot" cx={f(b.x)} cy={f(b.y)} r="1.8" style={t(b.at)} />
      ))}
      <path className="ka-line ka-arch" d={ARCH_OUTER} pathLength="1" style={animate ? { '--at': '2.8s', '--dur': '1.9s' } : undefined} />
      <path className="ka-line ka-arch thin" d={ARCH_INNER} pathLength="1" style={animate ? { '--at': '3s', '--dur': '1.9s' } : undefined} />
      {BEADS.map((b, i) => (
        <circle key={`p${i}`} className="ka-dot pearl" cx={f(b.x)} cy={f(b.y)} r="2.2" style={t(3.1 + i * 0.12)} />
      ))}
      <path className="ka-line ka-curl" d={SCROLL.d} pathLength="1" style={t(2.7)} />
    </g>
  )
}

// The full frame: Liyawel vines rising from the base into a Thorana arch, mirrored left/right
export function ThoranaFrame({ className = '', animate = false }) {
  return (
    <svg className={`ka-frame ${animate ? 'is-animated' : ''} ${className}`} viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
      <Half animate={animate} />
      <g transform="translate(400 0) scale(-1 1)">
        <Half animate={animate} />
      </g>
      <path className="ka-line ka-finial" d={FINIAL} pathLength="1" style={animate ? { '--at': '4.4s' } : undefined} />
      <circle className="ka-dot" cx="200" cy="594" r="3" style={animate ? { '--at': '2.1s' } : undefined} />
    </svg>
  )
}

// ---------- a rectangular Liyawel border (400 × 600 box) ----------
// Vines run up each side and along the top and bottom to meet at a lotus in the middle;
// the right half mirrors the left. With `animate`, it draws itself starting at `start` seconds.

const BORDER_PARTS = (start) => [
  liyawel([[18, 584], [10, 430], [12, 230], [18, 64]], { curls: 6, R: 11, leaf: 15, delay: start, dur: 1.6 }),
  liyawel([[18, 64], [26, 26], [110, 14], [186, 16]], { curls: 3, R: 9, leaf: 12, delay: start + 1.3, dur: 1.1 }),
  liyawel([[30, 592], [96, 600], [150, 590], [186, 588]], { curls: 2, R: 8, leaf: 11, delay: start + 0.4, dur: 1.1 }),
]
const BORDER_LOTUS = 'M200 4 C 206 10, 207 17, 200 24 C 193 17, 194 10, 200 4 Z M200 24 C 192 20, 186 14, 184 8 C 191 9, 197 15, 200 24 Z M200 24 C 208 20, 214 14, 216 8 C 209 9, 203 15, 200 24 Z'

function BorderHalf({ animate, parts }) {
  const t = (at) => (animate ? { '--at': `${at.toFixed(2)}s` } : undefined)
  return (
    <g>
      {parts.map((v, vi) => (
        <g key={vi}>
          <path className="ka-line ka-stem" d={v.stem} pathLength="1" style={animate ? { '--at': `${(v.curls[0]?.at ?? 0) - 0.2}s`, '--dur': '1.4s' } : undefined} />
          {v.curls.map((c, i) => (
            <path key={`c${i}`} className="ka-line ka-curl" d={c.d} pathLength="1" style={t(c.at)} />
          ))}
          {v.leaves.map((l, i) => (
            <path key={`l${i}`} className="ka-line ka-leaf" d={l.d} transform={l.transform} pathLength="1" style={t(l.at)} />
          ))}
          {v.buds.map((b, i) => (
            <circle key={`b${i}`} className="ka-dot" cx={f(b.x)} cy={f(b.y)} r="1.5" style={t(b.at)} />
          ))}
        </g>
      ))}
    </g>
  )
}

export function LiyawelBorder({ className = '', animate = false, start = 0 }) {
  const parts = BORDER_PARTS(start)
  return (
    <svg className={`ka-frame ${animate ? 'is-animated' : ''} ${className}`} viewBox="0 0 400 600" preserveAspectRatio="none" aria-hidden="true">
      <BorderHalf animate={animate} parts={parts} />
      <g transform="translate(400 0) scale(-1 1)">
        <BorderHalf animate={animate} parts={parts} />
      </g>
      <path className="ka-line ka-finial" d={BORDER_LOTUS} pathLength="1" style={animate ? { '--at': `${start + 2.3}s` } : undefined} />
      <path className="ka-line ka-finial" d={BORDER_LOTUS} transform="translate(0 600) scale(1 -1)" pathLength="1" style={animate ? { '--at': `${start + 1.5}s` } : undefined} />
    </svg>
  )
}

// A short symmetrical Liyawel divider: two tendrils curling out from a central lotus bud
const DIV_L = liyawel([[96, 14], [74, 6], [44, 20], [6, 12]], { curls: 3, R: 6, leaf: 8, delay: 0, dur: 1 })
export function LiyawelDivider({ className = '' }) {
  const half = (
    <g>
      <path className="ka-line" d={DIV_L.stem} />
      {DIV_L.curls.map((c, i) => (
        <path key={i} className="ka-line" d={c.d} />
      ))}
      {DIV_L.leaves.map((l, i) => (
        <path key={`l${i}`} className="ka-line ka-leaf" d={l.d} transform={l.transform} />
      ))}
    </g>
  )
  return (
    <svg className={`ka-divider ${className}`} viewBox="0 0 200 26" aria-hidden="true">
      {half}
      <g transform="translate(200 0) scale(-1 1)">{half}</g>
      <path className="ka-line ka-leaf" d="M100 4 C 105 9, 106 14, 100 20 C 94 14, 95 9, 100 4 Z" />
      <circle className="ka-dot" cx="100" cy="24" r="1.6" />
    </svg>
  )
}

// A small lotus mark (for list bullets and sign-offs)
export function LotusMark({ className = '' }) {
  return (
    <svg className={`ka-lotus ${className}`} viewBox="0 0 40 24" aria-hidden="true">
      <path className="ka-line ka-leaf" d="M20 2 C 25 8, 25 15, 20 22 C 15 15, 15 8, 20 2 Z" />
      <path className="ka-line ka-leaf" d="M20 22 C 14 14, 8 11, 3 12 C 6 18, 12 22, 20 22 Z" />
      <path className="ka-line ka-leaf" d="M20 22 C 26 14, 32 11, 37 12 C 34 18, 28 22, 20 22 Z" />
    </svg>
  )
}

// A running border of lotus petals (Pala pethi)
export function PalaPethi({ className = '' }) {
  return <span className={`ka-band ${className}`} aria-hidden="true" />
}
