// Guest groups ("sides"): the couple's own way of splitting a big list, e.g. "Bride's family",
// "Groom's friends", "Office". Free text; these are only quick suggestions.

export const MAX_GROUP_LENGTH = 40

const SUGGESTIONS = {
  wedding: ["Bride's family", "Groom's family", "Bride's friends", "Groom's friends", 'Office', 'Neighbours'],
  birthday: ['Family', 'Friends', 'School', 'Work', 'Neighbours'],
}

export const groupKey = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()

// The groups already on the list first, then suggestions not yet used
export function groupChoices(guests, eventType = 'wedding') {
  const used = []
  for (const g of guests) if (g.group && !used.some((u) => groupKey(u) === groupKey(g.group))) used.push(g.group)
  used.sort((a, b) => a.localeCompare(b))
  const ideas = (SUGGESTIONS[eventType] || SUGGESTIONS.wedding).filter((s) => !used.some((u) => groupKey(u) === groupKey(s)))
  return { used, ideas }
}

// Counts per group, largest first and "No group" last
export function groupCounts(guests) {
  const map = new Map()
  for (const g of guests) {
    const key = groupKey(g.group)
    if (!map.has(key)) map.set(key, { key, name: g.group || '', total: 0, attending: 0, not_attending: 0, pending: 0, opened: 0 })
    const row = map.get(key)
    row.total += 1
    row[g.rsvpStatus] += 1
    if (g.openedAt) row.opened += 1
  }
  return [...map.values()].sort((a, b) => !a.name - !b.name || b.total - a.total || a.name.localeCompare(b.name))
}
