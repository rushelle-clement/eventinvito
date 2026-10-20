// Small helpers shared by the invitation designs.

import { formatDate, formatTime } from '../strings'

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export function initials(a, b) {
  const first = (s) => (s || '').trim().charAt(0).toUpperCase() || '·'
  return `${first(a)} & ${first(b)}`
}

export function names(invitation) {
  return { one: invitation.partnerOne || '…', two: invitation.partnerTwo || '…' }
}

// "4:00 pm – 10:00 pm"
export function timeRange(start, end, lang) {
  const a = formatTime(start, lang)
  const b = formatTime(end, lang)
  return a && b ? `${a} – ${b}` : a
}

// The ceremonies to show. With none listed, there's nothing extra to show (the main
// date/time/venue already describe the single event).
export function ceremonyList(invitation, lang) {
  return (invitation.ceremonies || [])
    .filter((c) => c.name)
    .map((c) => ({
      ...c,
      dateText: c.date ? formatDate(c.date, lang, { weekday: 'short', day: 'numeric', month: 'long' }) : '',
      timeText: formatTime(c.time, lang),
    }))
}

// "12 · 12 · 2026"
export function numericDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d} · ${m} · ${y}`
}

// Runs the opening timeline: closed → opening → revealing → open. Returns timers to clear.
export function runTimeline(setPhase, revealAt, doneAt) {
  if (prefersReducedMotion()) {
    setPhase('open')
    return []
  }
  setPhase('opening')
  return [setTimeout(() => setPhase('revealing'), revealAt), setTimeout(() => setPhase('open'), doneAt)]
}
