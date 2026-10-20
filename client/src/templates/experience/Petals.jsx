// Gently falling petals. Purely decorative: aria-hidden, no clicks, and hidden entirely
// when the device asks for reduced motion. Positions are fixed per index (no randomness on
// each render), so React re-renders never make petals jump.

const PRESETS = {
  rose: ['#9e1028', '#b8173a', '#d4405c', '#e8899a'],
  blush: ['#f3c6cf', '#eba7b5', '#f8dde2', '#d98a9b'],
  marigold: ['#c9a24a', '#e0b85c', '#b8173a', '#d4405c'],
}

function seeded(i, k) {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export default function Petals({ count = 14, palette = 'rose', className = '', duration = [9, 16], fixed = false }) {
  const colors = PRESETS[palette] || PRESETS.rose
  return (
    <div className={`ei-petals ${fixed ? 'is-fixed' : ''} ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const dur = duration[0] + seeded(i, 1) * (duration[1] - duration[0])
        const style = {
          left: `${seeded(i, 2) * 100}%`,
          '--d': `${dur.toFixed(2)}s`,
          '--delay': `${(-seeded(i, 3) * dur).toFixed(2)}s`,
          '--s': (0.55 + seeded(i, 4) * 0.7).toFixed(2),
          '--sway': `${(18 + seeded(i, 5) * 40).toFixed(0)}px`,
          '--spin': `${(seeded(i, 6) > 0.5 ? 1 : -1) * (180 + seeded(i, 7) * 360)}deg`,
          color: colors[i % colors.length],
        }
        return (
          <span key={i} className="ei-petal" style={style}>
            <svg viewBox="0 0 20 26">
              <path d="M10 1 C 18 6, 20 16, 14 23 C 12 25, 8 25, 6 23 C 0 16, 2 6, 10 1 Z" fill="currentColor" />
              <path d="M10 4 C 11 10, 11 16, 10 22" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8" fill="none" />
            </svg>
          </span>
        )
      })}
    </div>
  )
}
