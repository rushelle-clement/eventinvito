// Small decorative pieces shared by the illustrated designs (Pink Floral Romance, Blue Botanical
// Elegance, Purple Enchanted Garden): drifting petals/leaves, butterflies in flight and at rest.
// All purely decorative: aria-hidden, no pointer events, hidden or still with reduced motion.

import './floralParts.css'

function seeded(i, k) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

// Pieces of artwork drifting down the screen. Positions are fixed per index (no randomness on
// each render), so re-renders never make them jump.
export function DriftingPieces({ srcs, count = 9, fixed = false, className = '', duration = [13, 22] }) {
  return (
    <div className={`ei-petals ${fixed ? 'is-fixed' : ''} fl-drift ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const dur = duration[0] + seeded(i, 1) * (duration[1] - duration[0])
        return (
          <span
            key={i}
            className="ei-petal fl-drift-piece"
            style={{
              left: `${seeded(i, 2) * 100}%`,
              '--d': `${dur.toFixed(2)}s`,
              '--delay': `${(-seeded(i, 3) * dur).toFixed(2)}s`,
              '--s': (0.55 + seeded(i, 4) * 0.55).toFixed(2),
              '--spin': `${(seeded(i, 6) > 0.5 ? 1 : -1) * (90 + seeded(i, 7) * 200)}deg`,
            }}
          >
            <img src={srcs[i % srcs.length]} alt="" decoding="async" />
          </span>
        )
      })}
    </div>
  )
}

// One butterfly crossing the screen. Offsets are from the screen's centre, in vmin: where it comes
// from, where it hovers, and where it flies off to. The outer layer moves it sideways and the inner
// one up and down with a different rhythm, so the path curves like real flight.
export function Flyer({ src, from, hover, exit, size, delay, flap = 'open', dur = 5.2 }) {
  const style = {
    '--fx': `${from[0]}vmin`,
    '--fy': `${from[1]}vmin`,
    '--hx': `${hover[0]}vmin`,
    '--hy': `${hover[1]}vmin`,
    '--ex': `${exit[0]}vmin`,
    '--ey': `${exit[1]}vmin`,
    '--w': `min(${size}vmin, ${size * 6}px)`,
    '--dl': `${delay}s`,
    '--dur': `${dur}s`,
  }
  return (
    <span className="fl-fly" style={style} aria-hidden="true">
      <span className="fl-fly-y">
        <img className={`fl-wings ${flap}`} src={src} alt="" decoding="async" />
      </span>
    </span>
  )
}

// A butterfly resting on the artwork, fluttering now and then
export function Resting({ src, className = '' }) {
  return (
    <span className={`fl-rest ${className}`} aria-hidden="true">
      <img className="fl-wings slow" src={src} alt="" decoding="async" />
    </span>
  )
}
