// Shared frame for the Sign In and Create Account pages:
// simple header, form card on the left, decorative invitation preview on the right.

import { Link } from 'react-router-dom'
import Logo from './Logo'
import SiteFooter from './SiteFooter'

export default function AuthLayout({ children, aside }) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top_left,#fbefe2_0%,transparent_45%),radial-gradient(ellipse_at_bottom_right,#f8e9ea_0%,transparent_40%)] bg-ivory">
      <header className="border-b border-bone/60">
        <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-margin-mobile md:px-margin">
          <Logo />
          <Link to="/templates" className="text-label-md text-espresso uppercase hover:text-gold-text">
            Explore Invitations
          </Link>
        </div>
      </header>

      <main
        id="main"
        className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-10 px-margin-mobile py-10 md:px-margin md:py-16 lg:grid-cols-[minmax(0,620px)_minmax(0,1fr)] lg:gap-16"
      >
        {children}
        <div className="hidden lg:block">{aside}</div>
      </main>

      <SiteFooter />
    </div>
  )
}
