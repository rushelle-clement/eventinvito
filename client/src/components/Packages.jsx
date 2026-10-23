// The four packages, shown on the home page (#pricing).
// Prices and limits are set here; the admin page gives paid accounts their Premium credits.

import { Link } from 'react-router-dom'
import { ArrowRight, Check, Clock, Minus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSiteConfig } from '../lib/siteConfig'

const PACKAGES = [
  {
    key: 'free',
    name: 'Simple Card',
    price: 'Rs. 0',
    priceNote: 'Free',
    tagline: 'A beautiful invitation card to share with your closest guests.',
    guests: 'Up to 50 guests',
    features: [
      '1 invitation in any of our 12 card designs',
      'Each guest gets their own link that greets them by name',
      'For weddings, engagements, homecomings and birthdays, in English or Sinhala',
      'Venue with a map link, dress code and your list of ceremonies',
      'Send to all your guests on WhatsApp in a few taps',
      'Stays online until the day after your event',
    ],
    missing: 'No opening animation, music, photos or online replies',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 'Rs. 3,000',
    priceNote: 'one-time',
    popular: true,
    tagline: 'An animated invitation your guests will remember, with all the replies in one place.',
    guests: 'Up to 150 guests',
    intro: 'Everything in Simple Card, plus:',
    features: [
      '1 invitation in any of our 21 animated designs, with an opening animation',
      'Background music from our song collection',
      'A photo gallery with up to 6 of your photos',
      'Online replies: guests answer in one tap and you see who’s coming on your dashboard',
      'A reply deadline, after which replies close by themselves',
      'Add your guests quickly from an Excel sheet',
    ],
  },
  {
    key: 'plus',
    name: 'Premium Plus',
    price: 'Rs. 6,500',
    priceNote: 'one-time',
    tagline: 'Two invitations for two celebrations: engagement and wedding, or wedding and homecoming.',
    guests: 'Up to 300 guests per invitation',
    intro: 'Everything in Premium, plus:',
    features: [
      '2 invitations, each with its own design, guest list and replies',
      'Your own song as the background music',
      'A bigger photo gallery: up to 12 photos',
      'Download your guest list and replies as an Excel file, handy for seating and catering',
    ],
    soon: [
      'Wedding day agenda: a timed plan of your day that highlights what’s happening now',
      'Email your invitation to guests, as well as WhatsApp',
    ],
  },
  {
    key: 'signature',
    name: 'Signature',
    price: 'Rs. 7,500',
    pricePrefix: 'from',
    priceNote: 'one-time',
    tagline: 'An invitation designed only for you.',
    guests: 'Up to 500 guests',
    intro: 'Everything in Premium Plus, plus:',
    features: [
      '1 invitation designed just for you: your colours, theme, monogram or artwork',
      '1 more invitation in any of our designs',
      'Two rounds of changes to get it just right',
      'Ready in about 7 to 10 days',
    ],
  },
]

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

export default function Packages() {
  return (
    <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {PACKAGES.map((pkg) => (
        <article
          key={pkg.key}
          className={`relative flex flex-col rounded-xl border bg-white p-6 shadow-sheet ${pkg.popular ? 'border-gold ring-1 ring-gold' : 'border-bone'}`}
          aria-labelledby={`pkg-${pkg.key}`}
        >
          {pkg.popular && (
            <span className="absolute -top-3 left-6 rounded-full bg-gold px-3 py-1 text-label-sm text-espresso uppercase">Most popular</span>
          )}
          <h3 id={`pkg-${pkg.key}`} className="font-serif text-headline-sm text-espresso">
            {pkg.name}
          </h3>
          <p className="mt-2 text-body-sm text-on-surface-variant">{pkg.tagline}</p>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-1.5">
            {pkg.pricePrefix && <span className="text-body-sm text-on-surface-variant">{pkg.pricePrefix}</span>}
            <span className="font-serif text-[34px] leading-none whitespace-nowrap text-espresso">{pkg.price}</span>
            <span className="text-body-sm whitespace-nowrap text-on-surface-variant">{pkg.priceNote}</span>
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
  )
}
