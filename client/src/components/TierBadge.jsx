// "Free" or "Premium" label for a design. Premium = the animated designs (payments come later).
import { Crown } from 'lucide-react'

export default function TierBadge({ tier = 'premium', className = '' }) {
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
