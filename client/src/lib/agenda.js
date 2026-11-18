// The wedding day agenda ("day plan"): working out what's on now and what's next.
//
// Items are { date, time, endTime, title, place, note }. `date` is empty for items on the event
// date. Times are the event's local times; guests are almost always in the same time zone, so
// the guest's own clock is compared directly with them.

const DEFAULT_LENGTH = 60 // minutes, for the last item of a day when it has no end time

const at = (date, time) => {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d, h, min)
}

// The items in time order, each with its start, end and the day it belongs to
export function scheduleOf(items = [], eventDate = '') {
  const list = items
    .filter((a) => a.time && (a.date || eventDate))
    .map((a) => ({ ...a, day: a.date || eventDate }))
    .sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`))
  return list.map((a, i) => {
    const start = at(a.day, a.time)
    let end
    if (a.endTime) {
      end = at(a.day, a.endTime)
      if (end <= start) end = new Date(end.getTime() + 86400000) // runs past midnight
    } else {
      const next = list[i + 1]
      end = next && next.day === a.day ? at(next.day, next.time) : new Date(start.getTime() + DEFAULT_LENGTH * 60000)
    }
    return { ...a, start, end }
  })
}

// Where the day stands at `now`:
//  before → nothing has started yet; during → `current` may be set (an item is on), `next` is coming;
//  after → everything has finished
export function agendaState(schedule, now = new Date()) {
  if (!schedule.length) return { phase: 'empty' }
  const current = schedule.find((a) => a.start <= now && now < a.end) || null
  const next = schedule.find((a) => a.start > now) || null
  const first = schedule[0]
  const last = schedule.reduce((m, a) => (a.end > m ? a.end : m), schedule[0].end)
  const phase = now < first.start ? 'before' : now >= last ? 'after' : 'during'
  return { phase, current, next, first }
}

// Whole days from today to an ISO date (0 = today), on the guest's calendar
export function daysUntil(isoDate, now = new Date()) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((new Date(y, m - 1, d) - today) / 86400000)
}

// Wording for the day plan, per language. Sinhala and Tamil are drafts to be checked, like the rest.
const AGENDA_STRINGS = {
  en: {
    dayPlan: 'Day plan',
    title: 'The plan for the day',
    now: 'Happening now',
    next: 'Up next',
    done: 'Done',
    until: (t) => `until ${t}`,
    inMinutes: (m) => (m < 60 ? `in ${m} min` : `in ${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`),
    daysToGo: (n) => (n === 1 ? 'Tomorrow' : `${n} days to go`),
    startsToday: (t) => `Today · starts at ${t}`,
    over: 'That’s everything. Thank you for celebrating with us.',
    back: 'Back to the invitation',
    empty: 'The plan for the day will appear here.',
  },
  si: {
    dayPlan: 'දවසේ සැලැස්ම',
    title: 'දවසේ වැඩසටහන',
    now: 'දැන් සිදුවෙමින්',
    next: 'ඊළඟට',
    done: 'අවසන්',
    until: (t) => `${t} දක්වා`,
    inMinutes: (m) => (m < 60 ? `මිනිත්තු ${m} කින්` : `පැය ${Math.floor(m / 60)}${m % 60 ? ` මිනිත්තු ${m % 60}` : ''} කින්`),
    daysToGo: (n) => (n === 1 ? 'හෙට' : `තව දින ${n} යි`),
    startsToday: (t) => `අද · ${t} ට ආරම්භ වේ`,
    over: 'සියල්ල අවසන්. අප සමඟ සැමරීමට පැමිණීම ගැන ස්තූතියි.',
    back: 'ආරාධනාවට ආපසු',
    empty: 'දවසේ වැඩසටහන මෙහි දිස් වේ.',
  },
  ta: {
    dayPlan: 'நிகழ்ச்சி நிரல்',
    title: 'அன்றைய நிகழ்ச்சி நிரல்',
    now: 'இப்போது நடைபெறுகிறது',
    next: 'அடுத்து',
    done: 'முடிந்தது',
    until: (t) => `${t} வரை`,
    inMinutes: (m) => (m < 60 ? `${m} நிமிடங்களில்` : `${Math.floor(m / 60)} மணி${m % 60 ? ` ${m % 60} நிமிடங்களில்` : 'யில்'}`),
    daysToGo: (n) => (n === 1 ? 'நாளை' : `இன்னும் ${n} நாட்கள்`),
    startsToday: (t) => `இன்று · ${t} மணிக்குத் தொடங்கும்`,
    over: 'அனைத்தும் நிறைவடைந்தது. எங்களுடன் கொண்டாடியதற்கு நன்றி.',
    back: 'அழைப்பிதழுக்குத் திரும்பு',
    empty: 'அன்றைய நிகழ்ச்சி நிரல் இங்கே தோன்றும்.',
  },
}

export const agendaStrings = (lang) => AGENDA_STRINGS[lang] || AGENDA_STRINGS.en

// A sample wedding day plan for the gallery demos (wedding designs only for now).
const SAMPLE_STEPS = {
  wedding: {
    en: [
      ['Guests arrive', 'Hotel lobby', 'Welcome drinks on the terrace'],
      ['Wedding ceremony', 'Main lawn', 'Please be seated 15 minutes before'],
      ['Family photos', 'Garden', ''],
      ['Lunch', 'Ballroom', ''],
      ['Cake cutting & first dance', 'Ballroom', ''],
      ['Going away', '', ''],
    ],
    si: [
      ['අමුත්තන් පැමිණීම', 'හෝටල් ප්‍රවේශය', 'පිළිගැනීමේ පාන වර්ග'],
      ['පෝරුව චාරිත්‍රය', 'ප්‍රධාන තණතීරුව', 'කරුණාකර විනාඩි 15 කට පෙර අසුන් ගන්න'],
      ['පවුලේ ඡායාරූප', 'උද්‍යානය', ''],
      ['දිවා භෝජනය', 'උත්සව ශාලාව', ''],
      ['කේක් කැපීම සහ පළමු නර්තනය', 'උත්සව ශාලාව', ''],
      ['ගමන් යාම', '', ''],
    ],
  },
}

// Realistic daytime timings: [start, end]
const SAMPLE_TIMES = [
  ['10:00', ''],
  ['10:30', '11:30'],
  ['11:45', ''],
  ['12:30', ''],
  ['15:00', ''],
  ['16:30', ''],
]

// The sample plan, on the visitor's today, and the moment the demo shows it at (during the ceremony),
// so every visitor sees "Happening now" and "Up next" whatever their own time is
export function sampleAgenda(language = 'en', today = new Date()) {
  const steps = SAMPLE_STEPS.wedding[language] || SAMPLE_STEPS.wedding.en
  const pad = (n) => String(n).padStart(2, '0')
  const day = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
  const agenda = steps.map(([title, place, note], i) => ({ date: '', time: SAMPLE_TIMES[i][0], endTime: SAMPLE_TIMES[i][1], title, place, note }))
  const at = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 4)
  return { eventDate: day, agenda, at }
}
