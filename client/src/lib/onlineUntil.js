// How long an invitation stays online (the server applies the same rule): guests can open it
// until the end of the day after the last event — the main date or any ceremony, whichever is later.

import { formatDate } from '../templates/strings'

export function onlineUntil(invitation) {
  const last = [invitation?.eventDate, ...(invitation?.ceremonies || []).map((c) => c.date)].filter(Boolean).sort().pop()
  if (!last) return ''
  const d = new Date(`${last}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// "Sunday, 13 December 2026"
export function untilText(isoDate) {
  return formatDate(isoDate, 'en')
}
