// The shared page frame: top navigation, page content, footer.
// Signed-out visitors see Home / Explore / How It Works; signed-in users see their workspace links.
// Based on the Stitch "Host Dashboard" header.

import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { Menu, Plus, X } from 'lucide-react'
import Logo from './Logo'
import UserMenu from './UserMenu'
import { useSiteConfig } from '../lib/siteConfig'
import { useAuth } from '../context/AuthContext'
import SiteFooter from './SiteFooter'

const MEMBER_NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/templates', label: 'Explore Invitations' },
  { to: '/guests', label: 'My Guests' },
]
const GUEST_NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/templates', label: 'Explore Invitations' },
  { to: '/#how-it-works', label: 'How It Works', hash: true },
  { to: '/#pricing', label: 'Pricing', hash: true },
]

function navClass({ isActive }) {
  return `text-body-md transition-colors ${isActive ? 'font-semibold text-gold-text' : 'text-espresso hover:text-gold-text'}`
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()
  const { signupOpen } = useSiteConfig()
  const NAV = user ? (user.role === 'admin' ? [...MEMBER_NAV, { to: '/admin', label: 'Admin' }] : MEMBER_NAV) : GUEST_NAV

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-bone/70 bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-[1200px] items-center justify-between gap-3 px-margin-mobile sm:gap-6 md:px-margin">
          <div className="flex items-center gap-10">
            <Logo className="text-[24px]" />
            <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
              {NAV.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={(st) => navClass({ isActive: st.isActive && !item.hash })}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link to="/templates" className="btn-primary hidden px-5 py-2 text-body-sm sm:inline-flex">
                  <Plus size={16} aria-hidden="true" /> Create Invitation
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                {signupOpen ? (
                  <>
                    <Link to="/signin" className="hidden text-body-md text-espresso hover:text-gold-text sm:inline">
                      Sign In
                    </Link>
                    <Link to="/signup" className="btn-primary px-4 py-2 text-body-sm sm:px-5">
                      <span className="min-[380px]:hidden">Sign up</span>
                      <span className="hidden min-[380px]:inline">Create Account</span>
                    </Link>
                  </>
                ) : (
                  // Accounts are made by EventInvito for now: just Sign In
                  <Link to="/signin" className="btn-primary px-5 py-2 text-body-sm">
                    Sign In
                  </Link>
                )}
              </>
            )}
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-bone md:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav aria-label="Main" className="border-t border-bone bg-ivory px-margin-mobile py-3 md:hidden">
            {(user ? [...NAV, { to: '/templates', label: 'Create Invitation' }] : [...NAV, { to: '/signin', label: 'Sign In' }]).map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
                className={(st) => `block py-3 ${navClass({ isActive: st.isActive && !item.hash })}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
