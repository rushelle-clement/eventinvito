// The packages a couple can choose when they sign up (the server's SIGNUP_PACKAGES).
// Free works straight away; the others wait for payment and the admin activates them.
// Prices and the full feature lists are on the home page (components/Packages.jsx).
// "Invitations": each guest on the list is one invitation, for a family or one person.

export const INVITATION_NOTE = 'One invitation is for a family or one person, e.g. “Mr & Mrs Perera and family”.'

export const SIGNUP_PACKAGES = [
  { key: 'free', name: 'Simple Card', price: 'Free', line: 'One online card · up to 50 invitations' },
  { key: 'premium', name: 'Premium', price: 'Rs. 2,000', line: 'Online invitation · up to 150 invitations · photos · Excel' },
  { key: 'plus', name: 'Premium Plus', price: 'Rs. 3,500', line: 'Online invitation + QR code for paper cards · up to 300 invitations' },
  { key: 'signature', name: 'Signature', price: 'Rs. 6,000+', line: 'A custom design made for you · up to 500 invitations' },
  { key: 'printed', name: 'Printed Cards', price: 'Rs. 1,000', line: 'Paper cards only: one QR code for replies · up to 150 invitations' },
]

export const packageOf = (key) => SIGNUP_PACKAGES.find((p) => p.key === key) || null

// A WhatsApp (or email) message to EventInvito about paying for a package
export function paymentHref(contact, pkg, user) {
  if (!pkg) return ''
  const text = `Hi EventInvito, I'd like to pay for the ${pkg.name} package (${pkg.price}).${user?.email ? ` My account email: ${user.email}` : ''}`
  const phone = (contact?.phone || '').replace(/[^\d]/g, '')
  if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  if (contact?.email) return `mailto:${contact.email}?subject=${encodeURIComponent(`${pkg.name} package`)}&body=${encodeURIComponent(text)}`
  return ''
}
