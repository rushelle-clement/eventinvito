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
  if ((user.plan || 'free') === 'free' && (user.printedMember || (user.printedCredits || 0) > 0)) return 'printed'
  return PLANS[user.plan] ? user.plan : 'free'
}

// Why a Printed Cards invitation's QR code is still locked, in words that fit the account.
// Printed Cards is its own package (Rs. 500): Premium doesn't include a QR code at all, and
// Premium Plus / Signature include one on their online invitations, not on a separate printed one.
export function qrLockNote(user) {
  const plan = user?.plan || 'free'
  if (plan === 'plus' || plan === 'signature') {
    const name = plan === 'plus' ? 'Premium Plus' : 'Signature'
    return {
      short: `Printed Cards is a separate package. Your ${name} invitations already have a QR code`,
      long: `This is a Printed Cards invitation, a separate package (Rs. 500). Your ${name} package already includes a QR code on your online invitations: open one, mark paper-card guests as “Physical card”, and use its QR code page.`,
    }
  }
  return {
    short: plan === 'premium' ? 'Needs the Printed Cards package (Premium doesn’t include a QR code)' : 'Ready once the Printed Cards package is paid for',
    long: `Your QR code is ready. You can download and print it once the Printed Cards package (Rs. 500) is paid for${plan === 'premium' ? ' — it isn’t part of Premium' : ''}. You can add or import your guests now.`,
  }
}
