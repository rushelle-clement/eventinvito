// Ornament for Swarna Nelum (sn-): traditional Sri Lankan gold line art (in /public/swarna-nelum,
// recoloured to the design's antique gold):
//  • Moonstone — a sandakada pahana: lotus at the centre, beads, Liyawel scrolls, hamsa, flames
//  • Lotus — a front-view white lotus outlined in gold
//  • CarvedBand — a running Liyawel scroll border between fine double gold rules
//  • Corner — a Liyawel corner with a lotus and bud (drawn as a lower-left corner)
//  • LotusDivider — two fine rules with a small lotus between them

import './swarnaArt.css'

const ART = `${import.meta.env.BASE_URL}swarna-nelum/`
const swarnaImg = (name) => `${ART}${name}.webp`

export function Moonstone({ className = '', loading = 'eager' }) {
  return <img className={`sn-moonstone ${className}`} src={swarnaImg('moonstone')} alt="" aria-hidden="true" loading={loading} decoding="async" />
}

export function Lotus({ className = '', loading = 'eager' }) {
  return <img className={`sn-lotus-img ${className}`} src={swarnaImg('lotus')} alt="" aria-hidden="true" loading={loading} decoding="async" />
}

export function Corner({ className = '' }) {
  return <img className={`sn-corner ${className}`} src={swarnaImg('corner')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
}

// The scroll repeats from the centre outwards (the tile is the strip and its mirror image)
export function CarvedBand({ className = '' }) {
  return (
    <span className={`sn-band ${className}`} aria-hidden="true">
      <span className="sn-band-scroll" style={{ backgroundImage: `url(${swarnaImg('band')})` }} />
    </span>
  )
}

export function LotusDivider({ className = '' }) {
  return (
    <span className={`sn-divider ${className}`} aria-hidden="true">
      <span className="sn-divider-rule" />
      <Lotus className="sn-divider-lotus" loading="lazy" />
      <span className="sn-divider-rule" />
    </span>
  )
}
