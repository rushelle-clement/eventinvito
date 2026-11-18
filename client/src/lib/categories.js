// The gallery's occasion categories. Each covers several kinds of event (`types`, matched against a
// design's eventType); the gallery shows the main categories only, with no sub-filters.
// `aliases` keep older links working (?occasion=engagement, ?occasion=party …).

export const CATEGORIES = [
  {
    value: 'birthday',
    label: 'Birthday',
    covers: 'Adult, kids, milestone and first birthdays',
    types: ['birthday'],
  },
  {
    value: 'wedding',
    label: 'Wedding',
    covers: 'Weddings, engagements and homecomings',
    types: ['wedding', 'engagement', 'homecoming'],
    aliases: ['engagement', 'homecoming'],
  },
  {
    value: 'parties',
    label: 'Parties',
    covers: 'Housewarmings, farewells, anniversaries and dinners',
    types: ['party', 'housewarming', 'farewell', 'anniversary', 'dinner'],
    aliases: ['party', 'anniversary'],
  },
  {
    value: 'seasonal',
    label: 'Seasonal',
    covers: 'Christmas, New Year, Halloween and Easter',
    properNames: true,
    types: ['seasonal', 'christmas', 'new-year', 'halloween', 'easter'],
  },
  {
    value: 'special',
    label: 'Special Events',
    covers: 'Graduations, proms, reunions, bridal and baby showers, gender reveals and christenings',
    types: ['special', 'graduation', 'prom', 'reunion', 'bridal-shower', 'baby-shower', 'gender-reveal', 'christening'],
  },
  {
    value: 'corporate',
    label: 'Corporate',
    covers: 'Conferences, launches, networking and annual parties',
    types: ['corporate'],
  },
]

// The category a value from the address belongs to ('all' when none)
export function categoryOf(value) {
  if (!value) return 'all'
  const found = CATEGORIES.find((c) => c.value === value || c.aliases?.includes(value))
  return found ? found.value : 'all'
}

// The category a design belongs to, from its event type
export function categoryOfDesign(eventType) {
  return CATEGORIES.find((c) => c.types.includes(eventType)) || null
}
