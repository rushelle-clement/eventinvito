// The account's package as shown to the couple (PlanBadge in the header and account menu)

import { Crown, Gem, Printer, ShieldCheck, Sparkles } from 'lucide-react'

export const PLANS = {
  free: { label: 'Free member', Icon: null, className: 'border border-bone bg-white text-on-surface-variant' },
  premium: { label: 'Premium member', Icon: Sparkles, className: 'bg-gold/15 text-gold-text' },
  plus: { label: 'Premium Plus member', Icon: Gem, className: 'bg-gold/25 text-espresso' },
  signature: { label: 'Signature member', Icon: Crown, className: 'bg-espresso text-gold' },
  printed: { label: 'Printed Cards member', Icon: Printer, className: 'bg-[#f1ebf8] text-[#5b3d86]' },
  admin: { label: 'Admin', Icon: ShieldCheck, className: 'bg-espresso text-white' },
}

// Which package to show: admins as Admin; a free account with Printed Cards credits as Printed Cards
export function planOf(user) {
  if (!user) return null
  if (user.role === 'admin') return 'admin'
  if ((user.plan || 'free') === 'free' && (user.printedCredits || 0) > 0) return 'printed'
  return PLANS[user.plan] ? user.plan : 'free'
}
