// How a guest is addressed on their invitation ("Dear Mr. & Mrs. Amal Perera and family").
// The couple picks a title and "and family"; the result goes in the guest's "Name on invitation".
// English titles go before the name; Sinhala and Tamil ones go after it, as they're written.

export const TITLES = {
  en: [
    { label: 'Mr.', before: 'Mr.' },
    { label: 'Mrs.', before: 'Mrs.' },
    { label: 'Ms.', before: 'Ms.' },
    { label: 'Mr. & Mrs.', before: 'Mr. & Mrs.' },
    { label: 'Dr.', before: 'Dr.' },
    { label: 'Dr. & Mrs.', before: 'Dr. & Mrs.' },
    { label: 'Rev.', before: 'Rev.' },
  ],
  si: [
    { label: 'මහතා', after: 'මහතා' },
    { label: 'මහත්මිය', after: 'මහත්මිය' },
    { label: 'මෙනවිය', after: 'මෙනවිය' },
    { label: 'මහතා සහ මහත්මිය', after: 'මහතා සහ මහත්මිය' },
    { label: 'වෛද්‍ය', before: 'වෛද්‍ය' },
    { label: 'පූජ්‍ය', before: 'පූජ්‍ය' },
  ],
  ta: [
    { label: 'திரு.', before: 'திரு.' },
    { label: 'திருமதி.', before: 'திருமதி.' },
    { label: 'செல்வி', before: 'செல்வி' },
    { label: 'திரு. & திருமதி.', before: 'திரு. & திருமதி.' },
    { label: 'Dr.', before: 'Dr.' },
  ],
}

export const FAMILY = { en: 'and family', si: 'ඇතුළු පවුලේ සැම', ta: 'மற்றும் குடும்பத்தினர்' }

const allTitles = Object.values(TITLES).flat()
const families = Object.values(FAMILY)

// Splits "Mr. & Mrs. Amal Perera and family" into its title, name and "and family"
export function parseAddress(text = '') {
  let rest = text.trim()
  let family = false
  for (const f of families) {
    if (rest.endsWith(f)) {
      rest = rest.slice(0, -f.length).trim()
      family = true
      break
    }
  }
  // longest titles first, so "Mr. & Mrs." wins over "Mr."
  const sorted = [...allTitles].sort((a, b) => (b.before || b.after).length - (a.before || a.after).length)
  let title = null
  for (const t of sorted) {
    if (t.before && rest.startsWith(`${t.before} `)) {
      title = t
      rest = rest.slice(t.before.length).trim()
      break
    }
    if (t.after && rest.endsWith(` ${t.after}`)) {
      title = t
      rest = rest.slice(0, -t.after.length).trim()
      break
    }
  }
  return { title, name: rest, family }
}

// Puts them back together
export function formatAddress({ title, name, family }, lang = 'en') {
  const parts = [title?.before, name.trim(), title?.after, family ? FAMILY[lang] || FAMILY.en : ''].filter(Boolean)
  return parts.join(' ')
}
