// Scroll to the top when moving to a new page (but leave #anchor links to the page itself).
// Going back to the design gallery (browser Back, or "All designs" on a preview) keeps the
// scroll: the gallery returns you to where you were (see Templates.jsx).

import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()
  useEffect(() => {
    if (hash) return
    if (navigationType === 'POP' && pathname === '/templates') return
    window.scrollTo(0, 0)
  }, [pathname, hash, navigationType])
  return null
}
