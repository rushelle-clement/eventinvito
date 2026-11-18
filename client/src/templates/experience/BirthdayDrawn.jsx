// Birthday designs drawn entirely in code (no pictures), used by BirthdayParty:
//  • midnight-glam  black and champagne gold: a starry gold arch with a crescent moon; on the tap
//                   the stars flare and golden particles burst out to reveal the invitation
//  • disco-fever    pink, purple and blue: a mirror disco ball turning in coloured light,
//                   beams sweeping the room; on the tap it spins fast and the lights flash

import { useEffect, useMemo, useRef } from 'react'

// A seeded random list, so every visit (and every thumbnail) looks the same
function seeded(seed, count, make) {
  let s = seed
  const r = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  return Array.from({ length: count }, (_, i) => make(r, i))
}

// ---------------------------------------------------------------- Midnight Glam

// Small stars and gold dust over the black sky
function StarSky() {
  const stars = useMemo(
    () =>
      seeded(41, 70, (r) => ({
        x: r() * 100,
        y: r() * 100,
        s: 1 + r() * 2.4,
        d: -r() * 6,
        big: r() > 0.86,
      })),
    [],
  )
  return (
    <span className="bd-sky" aria-hidden="true">
      {stars.map((st, i) => (
        <i
          key={i}
          className={st.big ? 'is-star' : ''}
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.big ? st.s * 4 : st.s, height: st.big ? st.s * 4 : st.s, animationDelay: `${st.d}s` }}
        />
      ))}
    </span>
  )
}

// The arch: a band packed with gold stars, a crescent moon and a small planet, fine gold edges.
// The name tag sits inside it.
const ARCH = { w: 300, h: 440, outer: 128, inner: 98, top: 150 }
function inBand(x, y) {
  const cx = ARCH.w / 2
  const inside = (r) => (y >= ARCH.top ? Math.abs(x - cx) <= r : (x - cx) ** 2 + (y - ARCH.top) ** 2 <= r * r)
  return inside(ARCH.outer) && !inside(ARCH.inner)
}
const star4 = (x, y, r) => `M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z`

export function GlamArch({ children, className = '' }) {
  const { dust, sparks } = useMemo(() => {
    const pts = seeded(7, 2600, (r) => ({ x: r() * ARCH.w, y: 20 + r() * (ARCH.h - 20), a: r(), b: r() })).filter((p) => inBand(p.x, p.y))
    return {
      dust: pts.slice(0, 520),
      sparks: pts.slice(520, 556).filter((p) => !(p.x < 120 && p.y < 120)),
    }
  }, [])
  const cx = ARCH.w / 2
  const outer = `M${cx - ARCH.outer} ${ARCH.h} V${ARCH.top} A${ARCH.outer} ${ARCH.outer} 0 0 1 ${cx + ARCH.outer} ${ARCH.top} V${ARCH.h}`
  const inner = `M${cx - ARCH.inner} ${ARCH.h} V${ARCH.top} A${ARCH.inner} ${ARCH.inner} 0 0 1 ${cx + ARCH.inner} ${ARCH.top} V${ARCH.h}`
  return (
    <span className={`bd-arch ${className}`}>
      <svg viewBox={`0 0 ${ARCH.w} ${ARCH.h}`} aria-hidden="true">
        <defs>
          <linearGradient id="bd-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fbecc4" />
            <stop offset="0.45" stopColor="#d8bc82" />
            <stop offset="0.7" stopColor="#b8924e" />
            <stop offset="1" stopColor="#f1dca6" />
          </linearGradient>
        </defs>
        {/* the band and the dark doorway */}
        <path d={`${outer} Z`} fill="#15130f" />
        <path d={`${inner} Z`} fill="#0b0a08" />
        <g className="bd-dust">
          {dust.map((p, i) => (
            <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={(0.5 + p.a * 1.3).toFixed(2)} fill="url(#bd-gold)" opacity={(0.45 + p.b * 0.55).toFixed(2)} />
          ))}
        </g>
        <g className="bd-sparks">
          {sparks.map((p, i) => (
            <path key={i} d={star4(p.x, p.y, 3 + p.a * 4)} fill="url(#bd-gold)" style={{ animationDelay: `${(-p.b * 4).toFixed(2)}s` }} />
          ))}
        </g>
        {/* the moon and a planet in the band */}
        <path d="M58 116 A26 26 0 1 0 96 84 A20 20 0 1 1 58 116 Z" fill="url(#bd-gold)" />
        <circle cx="246" cy="96" r="7" fill="url(#bd-gold)" />
        <path d={star4(206, 52, 6)} fill="url(#bd-gold)" />
        {/* fine gold edges, drawn in */}
        <path className="bd-edge" pathLength="1" d={outer} fill="none" stroke="url(#bd-gold)" strokeWidth="1.6" />
        <path className="bd-edge d2" pathLength="1" d={inner} fill="none" stroke="url(#bd-gold)" strokeWidth="1.2" />
      </svg>
      <span className="bd-arch-in">{children}</span>
    </span>
  )
}

// Golden particles that burst out of the arch after the tap
export function Burst({ colours, count = 56 }) {
  const bits = useMemo(
    () =>
      seeded(colours.length * 13 + count, count, (r, i) => {
        const a = r() * Math.PI * 2
        const dist = 30 + r() * 70
        return {
          dx: `${(Math.cos(a) * dist).toFixed(1)}vmax`,
          dy: `${(Math.sin(a) * dist).toFixed(1)}vmax`,
          s: Math.round(4 + r() * 9),
          delay: `${(r() * 0.35).toFixed(2)}s`,
          dur: `${(1.2 + r() * 0.9).toFixed(2)}s`,
          colour: colours[i % colours.length],
          star: i % 4 === 0,
        }
      }),
    [colours, count],
  )
  return (
    <span className="bd-burst" aria-hidden="true">
      {bits.map((b, i) => (
        <i
          key={i}
          className={b.star ? 'is-star' : ''}
          style={{ '--dx': b.dx, '--dy': b.dy, width: b.s, height: b.s, background: b.colour, animationDelay: b.delay, animationDuration: b.dur }}
        />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------- Disco Fever

// The light show behind the ball: sweeping beams and coloured spots of reflected light
function LightShow() {
  const spots = useMemo(
    () =>
      seeded(19, 26, (r, i) => ({
        x: r() * 100,
        y: r() * 100,
        s: 6 + r() * 12,
        d: -r() * 9,
        c: ['#ff3fa4', '#b26bff', '#5aa8ff', '#ffffff', '#ff79c6'][i % 5],
      })),
    [],
  )
  return (
    <span className="bd-lights" aria-hidden="true">
      <span className="bd-beams" />
      <span className="bd-beams is-two" />
      {spots.map((sp, i) => (
        <i key={i} style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: sp.s, height: sp.s, background: sp.c, animationDelay: `${sp.d}s` }} />
      ))}
    </span>
  )
}

// The disco ball: mirror tiles on a sphere, lit by a white key light and pink, violet and blue
// party lights. It turns (the tiles are recomputed as it spins), so the glints move like the real thing.
const LIGHTS = [
  { d: [-0.45, -0.55, 0.7], c: [255, 255, 255], k: 1.0 },
  { d: [0.75, -0.2, 0.62], c: [255, 63, 164], k: 0.9 },
  { d: [-0.8, 0.35, 0.5], c: [178, 107, 255], k: 0.85 },
  { d: [0.2, 0.75, 0.62], c: [70, 140, 255], k: 0.85 },
].map((l) => {
  const n = Math.hypot(...l.d)
  return { ...l, d: l.d.map((v) => v / n) }
})
const R = 100
const ROWS = 15
function buildTiles() {
  const tiles = []
  for (let i = 0; i < ROWS; i++) {
    const lat0 = -Math.PI / 2 + (i * Math.PI) / ROWS
    const lat1 = lat0 + Math.PI / ROWS
    const mid = (lat0 + lat1) / 2
    const n = Math.max(6, Math.round(2 * ROWS * Math.cos(mid)))
    for (let k = 0; k < n; k++) tiles.push({ lat0, lat1, lon0: (k * 2 * Math.PI) / n, lon1: ((k + 1) * 2 * Math.PI) / n, j: ((i * 31 + k * 17) % 9) / 9 })
  }
  return tiles
}
const TILES = buildTiles()
function tileState(t, phase) {
  const inset = 0.08 // the gap between tiles
  const la0 = t.lat0 + (t.lat1 - t.lat0) * inset
  const la1 = t.lat1 - (t.lat1 - t.lat0) * inset
  const lo0 = t.lon0 + (t.lon1 - t.lon0) * inset + phase
  const lo1 = t.lon1 - (t.lon1 - t.lon0) * inset + phase
  const midLo = (lo0 + lo1) / 2
  const midLa = (la0 + la1) / 2
  const nz = Math.cos(midLa) * Math.cos(midLo)
  if (nz <= 0.02) return null
  const P = (la, lo) => `${(R + R * Math.cos(la) * Math.sin(lo)).toFixed(1)},${(R + R * Math.sin(la)).toFixed(1)}`
  const pts = `${P(la0, lo0)} ${P(la0, lo1)} ${P(la1, lo1)} ${P(la1, lo0)}`
  // a flat mirror: it reflects a light towards the viewer when the light sits near its mirror direction
  const nx = Math.cos(midLa) * Math.sin(midLo)
  const ny = Math.sin(midLa)
  let r = 26, g = 26, b = 34
  for (const L of LIGHTS) {
    const dot = nx * L.d[0] + ny * L.d[1] + nz * L.d[2]
    const rz = 2 * dot * nz - L.d[2] // reflected ray's z
    const spec = Math.max(0, rz) ** 18
    const diff = Math.max(0, dot) * 0.35
    const v = (spec * 1.4 + diff * 0.5) * L.k
    r += L.c[0] * v; g += L.c[1] * v; b += L.c[2] * v
  }
  const base = 70 + t.j * 40 * nz // a little variation between tiles
  r = Math.min(255, r + base * nz * 0.9); g = Math.min(255, g + base * nz * 0.9); b = Math.min(255, b + base * nz)
  return { pts, fill: `rgb(${r | 0},${g | 0},${b | 0})` }
}

export function DiscoBall({ spinning = false, still = false, className = '' }) {
  const refs = useRef([])
  const speed = useRef(0.35)
  useEffect(() => {
    speed.current = spinning ? 3.2 : 0.35
  }, [spinning])
  useEffect(() => {
    let phase = 0
    let last = 0
    let frame = 0
    const draw = () => {
      TILES.forEach((t, i) => {
        const el = refs.current[i]
        if (!el) return
        const s = tileState(t, phase)
        if (!s) {
          el.setAttribute('visibility', 'hidden')
          return
        }
        el.setAttribute('visibility', 'visible')
        el.setAttribute('points', s.pts)
        el.setAttribute('fill', s.fill)
      })
    }
    draw()
    if (still || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const tick = (now) => {
      frame = requestAnimationFrame(tick)
      if (now - last < 40) return // about 25 frames a second is plenty
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0
      last = now
      phase -= speed.current * dt
      draw()
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [still])

  return (
    <span className={`bd-ball ${className}`}>
      <span className="bd-cord" aria-hidden="true" />
      <svg viewBox={`-6 -6 ${2 * R + 12} ${2 * R + 12}`} aria-hidden="true">
        <defs>
          <radialGradient id="bd-ball-shade" cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
            <stop offset="1" stopColor="#000000" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <circle cx={R} cy={R} r={R} fill="#1d1a24" />
        {TILES.map((t, i) => (
          <polygon key={i} ref={(el) => (refs.current[i] = el)} />
        ))}
        <circle cx={R} cy={R} r={R} fill="url(#bd-ball-shade)" />
        <circle cx={R} cy={R} r={R} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
      </svg>
      <span className="bd-twinkles" aria-hidden="true">
        <i /> <i /> <i />
      </span>
    </span>
  )
}

// The background of a drawn design (in place of the backdrop picture)
export function DrawnBackdrop({ variant, className = '' }) {
  if (variant === 'midnight-glam') {
    return (
      <span className={`bp-backdrop bd-bg bd-bg-glam ${className}`} aria-hidden="true">
        <StarSky />
      </span>
    )
  }
  return (
    <span className={`bp-backdrop bd-bg bd-bg-disco ${className}`} aria-hidden="true">
      <LightShow />
    </span>
  )
}
