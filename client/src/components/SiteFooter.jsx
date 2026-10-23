import { Link } from 'react-router-dom'
import { useSiteConfig } from '../lib/siteConfig'

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { to: '/templates', label: 'Invitation designs' },
      { to: '/#how-it-works', label: 'How it works' },
      { to: '/#pricing', label: 'Pricing' },
      { to: '/custom-design', label: 'Custom design' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/signin', label: 'Sign in' },
      { to: '/signup', label: 'Create account', signup: true },
      { to: '/dashboard', label: 'Dashboard' },
    ],
  },
]

export default function SiteFooter() {
  const { signupOpen } = useSiteConfig()
  return (
    <footer className="border-t border-bone bg-surface-container-low">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-margin-mobile py-12 md:grid-cols-[1.4fr_1fr_1fr] md:px-margin">
        <div>
          <Link to="/" className="font-serif text-[24px] text-espresso">
            EventInvito<span className="text-gold">.</span>
          </Link>
          <p className="mt-3 max-w-sm text-body-sm text-on-surface-variant">
            Beautiful digital invitations for every occasion, with personal guest links and RSVPs in one place.
          </p>
          <p className="mt-4 text-label-sm text-gold-text uppercase">Create · Invite · Celebrate</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-label-md text-espresso uppercase">{col.title}</p>
            <ul className="mt-3 space-y-2">
              {col.links.filter((l) => !l.signup || signupOpen).map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-body-sm text-on-surface-variant hover:text-gold-text">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-bone">
        <p className="mx-auto max-w-[1200px] px-margin-mobile py-5 text-label-sm text-on-surface-variant uppercase md:px-margin">
          © {new Date().getFullYear()} EventInvito. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
