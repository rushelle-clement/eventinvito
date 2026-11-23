// What publishing an invitation would use, and whether the account can publish it at all:
// the free card (free designs), a Premium credit (animated designs) or a Printed Cards credit.
// Shared by the editor (the note above the form, the Publish button) and the dashboard.
// The server makes the real decision when Publish is pressed (invitationController.publishInvitation).
//
// `blocked`: nothing left to publish it with, so Publish is turned off and the couple is asked to upgrade.

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

export function publishCredit({ printed = false, paid = false, paidKind = null, freeDesign = false }, user) {
  if (user?.role === 'admin') return { note: null, blocked: false }
  const free = user?.freeCredits || 0
  const premium = user?.publishCredits || 0
  const printedLeft = user?.printedCredits || 0

  if (printed) {
    if (paid) return { note: null, blocked: false }
    if (printedLeft > 0) return { note: `Publishing these printed cards uses 1 of your ${plural(printedLeft, 'Printed Cards invitation')}. After that you can still edit it, unpublish it and publish it again.`, blocked: false }
    // Already used on another event: say so, instead of offering the package as if they'd never had it
    if (user?.printedMember) {
      return {
        note: 'You’ve already used your Printed Cards package on another event. To publish this one too, contact us for another Printed Cards package (Rs. 500).',
        blocked: true,
        used: true,
        short: 'Printed Cards package already used — contact us for another',
      }
    }
    return { note: 'Publishing printed cards with a QR code needs the Printed Cards package (Rs. 500).', blocked: true, short: 'Needs the Printed Cards package to publish' }
  }
  if (paid) {
    // Published as a free card, now switched to an animated design
    if (paidKind === 'free' && !freeDesign) {
      return premium === 0
        ? { note: 'This invitation was published with your free card, so it can only use free designs. To use an animated design, upgrade to a Premium package.', blocked: true, short: 'Needs a Premium package for this design' }
        : { note: `Using an animated design for this invitation uses 1 of your ${plural(premium, 'Premium invitation')}.`, blocked: false }
    }
    return { note: null, blocked: false }
  }
  if (freeDesign) {
    if (free > 0) return { note: 'This is a free design: publishing it uses your free card. After that you can still edit it, unpublish it and publish it again.', blocked: false }
    if (premium > 0) return { note: `You’ve used your free card, so publishing this uses 1 of your ${plural(premium, 'Premium invitation')}.`, blocked: false }
    return { note: 'You’ve already used your free card. Choose a Premium package to publish another invitation.', blocked: true, short: 'Free card used — needs a Premium package to publish' }
  }
  if (premium > 0) {
    return { note: `Your account can publish ${plural(premium, 'Premium invitation')}. Publishing this uses ${premium === 1 ? 'it' : 'one'}; after that you can still edit it, unpublish it and publish it again.`, blocked: false }
  }
  return {
    note:
      free > 0
        ? 'Animated designs are part of the Premium packages. Upgrade to publish this one — or switch to a free design (5. Design) to publish it with your free card.'
        : 'Animated designs are part of the Premium packages. Upgrade to publish this one.',
    blocked: true,
    short: free > 0 ? 'Premium design — upgrade, or switch to a free design, to publish' : 'Premium design — needs a Premium package to publish',
  }
}
