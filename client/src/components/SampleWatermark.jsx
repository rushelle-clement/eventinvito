// A faint, repeating "EventInvito · Sample" across the public design previews (Explore, the home
// page, a design's Preview), so a screenshot of a design isn't a clean copy. It never catches
// clicks or taps, and couples' own invitations never have it.
// White letters with a thin dark edge show on both light and dark designs.

const TEXT = 'EventInvito · Sample'
// One mark in a w × h tile: the gap between marks grows with the tile, the letters stay the same size
const tile = (w, h, font) =>
  `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><text x="${w / 2}" y="${h / 2}" text-anchor="middle" dominant-baseline="middle" transform="rotate(-28 ${w / 2} ${h / 2})" font-family="Georgia, 'Times New Roman', serif" font-size="${font}" letter-spacing="1.5" fill="rgba(255,255,255,0.34)" stroke="rgba(40,28,16,0.16)" stroke-width="0.7" paint-order="stroke">${TEXT}</text></svg>`,
  )}")`
const SPARSE = tile(520, 380, 18) // full pages: a few marks across the screen
const SINGLE = tile(280, 190, 17) // gallery cards: one in the middle

// fixed: covers the window below the top bar (topOffset); otherwise fills its positioned parent.
// single: one mark in the middle (gallery cards); otherwise a sparse repeat, a few across the screen.
export default function SampleWatermark({ fixed = false, topOffset = 0, single = false }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${fixed ? 'fixed inset-x-0 bottom-0 z-[75]' : 'absolute inset-0 z-10'}`}
      style={{
        top: fixed ? topOffset : 0,
        backgroundImage: single ? SINGLE : SPARSE,
        backgroundRepeat: single ? 'no-repeat' : 'repeat',
        backgroundPosition: 'center',
        ...(single && { backgroundSize: '100% auto' }),
      }}
    />
  )
}
