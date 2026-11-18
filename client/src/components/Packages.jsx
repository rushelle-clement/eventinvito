// The four packages, shown on the home page (#pricing), and Printed Cards for couples who only
// print their invitations.
// Prices and limits are set here; the admin page gives paid accounts their Premium credits.

import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock, Minus, QrCode } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSiteConfig } from '../lib/siteConfig'

const PACKAGES = [
  {
    key: 'free',
    name: 'Simple Card',
    badge: 'Free',
    price: 'Rs. 0',
    priceNote: '',
    tagline: 'A beautiful digital invitation for your special day.',
    guests: 'Up to 50 guests',
    features: [
      'Access to free invitation designs',
      'Personalised guest invitation links',
      'Online RSVP (Attending / Not Attending)',
      'Basic RSVP dashboard',
      'Total guests, shared and opened counts',
      'WhatsApp invitation sharing',
      'Event details and Google Maps link',
      'Basic guest management',
    ],
    missing: 'No photo gallery, music or individual invitation opening tracking',
  },
  {
    key: 'premium',
    name: 'Premium',
    badge: 'Most popular',
    popular: true,
    price: 'Rs. 1,500',
    priceNote: 'One-time payment',
    tagline: 'Make your invitation more personal and interactive.',
    guests: 'Up to 150 guests',
    intro: 'Everything in Simple Card, plus:',
    features: [
      'Access to all Premium invitation designs',
      'Photo gallery with up to 3 photos',
      'Background music from our song collection',
      'Full RSVP management and deadline',
      'Individual invitation opened / not opened status',
      'First opened date',
      'Opened but haven’t replied filter',
      'Guest groups (Bride’s side, Groom’s side, Friends, etc.)',
      'Filter guests by group',
      'Guest visit tracking overview',
      'Bulk guest import from Excel or CSV',
    ],
  },
  {
    key: 'plus',
    name: 'Premium Plus',
    badge: 'Best value',
    price: 'Rs. 2,500',
    priceNote: 'One-time payment',
    tagline: 'Everything you need to manage your wedding invitations and guests.',
    guests: 'Up to 300 guests per invitation',
    intro: 'Everything in Premium, plus:',
    features: [
      '2 invitations, each with its own design, guest list and replies (e.g. engagement and wedding)',
      'Photo gallery with up to 6 photos',
      'Upload your own background song',
      'Detailed guest visit statistics',
      'Download guest list and RSVP reports in Excel',
      'Wedding day agenda and live timeline',
      'Group-wise guest counts',
      'Group-wise RSVP statistics',
      'Group-wise invitation opening statistics',
      'Bulk guest group assignment',
      'QR code for printed cards, with your initials in the middle, ready to print',
      'Mark each guest as an online card or a printed card',
      'Printed-card guests scan the QR, find their name and reply',
      'See whether each reply came by link or by QR',
      'Separate online and printed-card counts, with a card-type filter',
      'Advanced guest management and reporting',
    ],
  },
  {
    key: 'signature',
    name: 'Signature',
    badge: 'Custom service',
    price: 'Rs. 6,000+',
    priceNote: 'One-time payment · Starting price',
    tagline: 'A one-of-a-kind invitation designed exclusively for you.',
    guests: 'Up to 500 guests',
    intro: 'Everything in Premium Plus, plus:',
    features: [
      'Exclusive custom invitation design',
      'Personalised colours, typography and layout',
      'Custom animations and design elements',
      '1 more invitation in any of our designs',
      'Two rounds of design revisions',
      'Dedicated design assistance',
      'Delivery within 7–10 working days',
    ],
  },
]

// For couples who print every card: no online invitation, guests reply with a QR code
const PRINTED = {
  key: 'printed',
  name: 'Printed Cards',
  badge: 'Paper cards only',
  price: 'Rs. 500',
  priceNote: 'One-time payment',
  tagline: 'Printing your invitations? Add one QR code to every card and collect replies online.',
  guests: 'Up to 150 guests',
  features: [
    'One QR code with your initials, ready to print',
    'Guests scan it, find their name and reply',
    'Replies can be changed until your reply-by date',
    'Guest list with groups and group-wise counts',
    'Bulk guest import from Excel or CSV',
    'Download guest list and replies in Excel',
    'Upgrade to Premium Plus later by paying the difference',
  ],
  missing: 'No online invitation design or personal links',
}

// "Get Premium": a WhatsApp or email message to EventInvito with the package name
function contactHref(contact, pkg, user) {
  const text = `Hi EventInvito, I'd like the ${pkg.name} package (${pkg.price}).${user?.email ? ` My account email: ${user.email}` : ''}`
  const phone = (contact?.phone || '').replace(/[^\d]/g, '')
  if (phone) return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  if (contact?.email) return `mailto:${contact.email}?subject=${encodeURIComponent(`${pkg.name} package`)}&body=${encodeURIComponent(text)}`
  return ''
}

function PackageButton({ pkg }) {
  const { user } = useAuth()
  const { contact, signupOpen } = useSiteConfig()
  const cls = `w-full ${pkg.popular ? 'btn-primary' : 'btn-secondary'}`

  if (pkg.key === 'free') {
    return (
      <Link to={user ? '/templates' : signupOpen ? '/signup' : '/signin'} className={cls}>
        {user ? 'Create an invitation' : 'Start for free'} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    )
  }
  const href = contactHref(contact, pkg, user)
  const label = pkg.key === 'signature' ? 'Talk to us' : `Get ${pkg.name}`
  if (!href) {
    // No contact details set yet: sign up first, then upgrade
    return (
      <Link to={user ? '/dashboard' : '/signup'} className={cls}>
        {label} <ArrowRight size={16} aria-hidden="true" />
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {label} <ArrowRight size={16} aria-hidden="true" />
    </a>
  )
}

export function PrintedPackage() {
  const pkg = PRINTED
  return (
    <article className="mt-6 rounded-xl border border-bone bg-white p-6 shadow-sheet" aria-labelledby="pkg-printed">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-bone px-3 py-1 text-label-sm text-gold-text uppercase">
            <QrCode size={13} aria-hidden="true" /> {pkg.badge}
          </span>
          <h3 id="pkg-printed" className="mt-3 font-serif text-headline-sm text-espresso">
            {pkg.name}
          </h3>
          <p className="mt-2 text-body-sm text-on-surface-variant">{pkg.tagline}</p>
          <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-serif text-[34px] leading-none whitespace-nowrap text-espresso">{pkg.price}</span>
            <span className="text-body-sm text-on-surface-variant">{pkg.priceNote}</span>
          </p>
          <p className="mt-3 inline-flex rounded-full bg-blush-tint px-3 py-1 text-label-md text-gold-text">{pkg.guests}</p>
        </div>
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {pkg.features.map((f) => (
            <li key={f} className="flex gap-2.5 text-body-sm text-espresso">
              <Check size={16} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
              <span>{f}</span>
            </li>
          ))}
          <li className="flex gap-2.5 text-body-sm text-on-surface-variant">
            <Minus size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{pkg.missing}</span>
          </li>
        </ul>
        <div className="lg:w-52">
          <PackageButton pkg={pkg} />
        </div>
      </div>
    </article>
  )
}

export default function Packages() {
  return (
    <>
    <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {PACKAGES.map((pkg) => (
        <article
          key={pkg.key}
          className={`relative flex flex-col rounded-xl border bg-white p-6 shadow-sheet ${pkg.popular ? 'border-gold ring-1 ring-gold' : 'border-bone'}`}
          aria-labelledby={`pkg-${pkg.key}`}
        >
          {pkg.badge && (
            <span
              className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-label-sm uppercase ${pkg.popular ? 'bg-gold text-espresso' : 'border border-bone bg-white text-gold-text'}`}
            >
              {pkg.badge}
            </span>
          )}
          <h3 id={`pkg-${pkg.key}`} className="font-serif text-headline-sm text-espresso">
            {pkg.name}
          </h3>
          <p className="mt-2 text-body-sm text-on-surface-variant">{pkg.tagline}</p>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
            {pkg.pricePrefix && <span className="text-body-sm text-on-surface-variant">{pkg.pricePrefix}</span>}
            <span className="font-serif text-[34px] leading-none whitespace-nowrap text-espresso">{pkg.price}</span>
            {pkg.priceNote && <span className="text-body-sm text-on-surface-variant">{pkg.priceNote}</span>}
          </p>
          <p className="mt-3 inline-flex self-start rounded-full bg-blush-tint px-3 py-1 text-label-md text-gold-text">{pkg.guests}</p>

          <div className="mt-5 flex-1 border-t border-bone pt-5">
            {pkg.intro && <p className="mb-3 text-body-sm font-semibold text-espresso">{pkg.intro}</p>}
            <ul className="space-y-2.5">
              {pkg.features.map((f) => (
                <li key={f} className="flex gap-2.5 text-body-sm text-espresso">
                  <Check size={16} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
              {pkg.soon?.map((f) => (
                <li key={f} className="flex gap-2.5 text-body-sm text-on-surface-variant">
                  <Clock size={16} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                  <span>
                    <span className="mr-1 rounded-full bg-gold/15 px-1.5 py-px text-[11px] font-semibold text-gold-text uppercase">Coming soon</span>
                    {f}
                  </span>
                </li>
              ))}
              {pkg.missing && (
                <li className="flex gap-2.5 text-body-sm text-on-surface-variant">
                  <Minus size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{pkg.missing}</span>
                </li>
              )}
            </ul>
          </div>

          <div className="mt-6">
            <PackageButton pkg={pkg} />
          </div>
        </article>
      ))}
    </div>
    <PrintedPackage />
    </>
  )
}
