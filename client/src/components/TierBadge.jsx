// "Free" or "Premium" label for a design. Premium = the animated designs.
// A Signature couple's own design (custom) says "Made for you".
import { Crown, Sparkles } from 'lucide-react'

export default function TierBadge({ tier = 'premium', custom = false, className = '' }) {
  if (custom) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-label-sm font-semibold text-espresso uppercase shadow-sm ${className}`}>
        <Sparkles size={12} aria-hidden="true" /> Made for you
      </span>
    )
  }
  if (tier === 'free') {
    return (
      <span className={`inline-flex items-center rounded-full border border-bone bg-white/95 px-2.5 py-0.5 text-label-sm font-semibold text-espresso uppercase shadow-sm ${className}`}>
        Free
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-espresso/90 px-2.5 py-0.5 text-label-sm font-semibold text-white uppercase shadow-sm ${className}`}>
      <Crown size={12} aria-hidden="true" className="text-gold" /> Premium
    </span>
  )
}
