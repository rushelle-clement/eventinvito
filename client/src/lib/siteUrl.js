// The site's own address, for links back to EventInvito (e.g. the invitation footer).
// It follows wherever the site is running: your Vercel address today, your own domain later.
// To always use one address (e.g. a preview site that should link to the main site), set
// VITE_SITE_URL, e.g. https://eventinvito.lk
export function siteUrl() {
  const fixed = (import.meta.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '')
  if (fixed) return fixed
  return typeof window !== 'undefined' ? window.location.origin : ''
}

// "eventinvito.lk" (no https:// or www.)
export function siteHost() {
  try {
    return new URL(siteUrl()).host.replace(/^www\./, '')
  } catch {
    return ''
  }
}
