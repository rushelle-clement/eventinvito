// Visual settings for each template. The `key` must match the server's template key
// (server/src/data/templates.js). To add a design: add a theme here and a template there.

import { SINHALA_WORDING, sinhalaWording } from './wording'

// Fallback fonts make Sinhala and Tamil text render properly in every design.
const SI_TA = '"Noto Serif Sinhala", "Noto Serif Tamil"'

export const THEMES = {
  'ran-pahana': {
    // Ran Pahana: red brocade, gold liyawel and the traditional oil lamp
    layout: 'regal',
    page: '#4e0a12',
    card: '#5f0d18',
    text: '#fbeed6',
    muted: '#e9d3a6',
    accent: '#d6a64a',
    accentText: '#f0cf7d',
    onAccent: '#3d070e',
    soft: '#5a0c16',
    border: '#b98a3a',
    headingFont: `"Cinzel", "Cormorant Garamond", ${SI_TA}, serif`,
    namesFont: `"Cinzel", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'noir-rouge': {
    // Noir Rouge: black paper, crimson satin and red roses
    layout: 'regal', // dark page: buttons use the accent
    page: '#0e0c0d',
    card: '#161214',
    text: '#f4ece6',
    muted: '#b8aaa5',
    accent: '#b3122d',
    accentText: '#e8475f',
    onAccent: '#fff6f2',
    soft: '#241417',
    border: '#3c2629',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'pure-elegance': {
    layout: 'classic',
    page: '#fdfbf7',
    card: '#ffffff',
    text: '#2b2625',
    muted: '#6b5f55',
    accent: '#2f2924', // ink buttons with ivory text; gold stays in the details
    accentText: '#8f6e28',
    soft: '#f4ebea',
    border: '#eae4da',
    headingFont: `"Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'italic',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'modern-romance': {
    layout: 'minimal',
    page: '#f4f1ec',
    card: '#ffffff',
    text: '#26231f',
    muted: '#6f6a64',
    accent: '#26231f', // ink buttons with white text
    accentText: '#5c5752',
    soft: '#ece6dc',
    border: '#e2dcd2',
    headingFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'royal-red': {
    // Royal Indian Wedding (key kept so existing invitations keep their design)
    layout: 'regal',
    page: '#4a0912',
    card: '#6e0f1d',
    text: '#f8ead0',
    muted: '#e6cfa3',
    accent: '#c9a24a',
    accentText: '#e8c879',
    soft: '#5a0c17',
    border: '#c9a24a',
    headingFont: `"Cinzel", "Playfair Display", "Noto Serif Devanagari", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", "Noto Serif Devanagari", ${SI_TA}, cursive`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'crimson-love': {
    layout: 'romantic',
    page: '#fbf7f1', // warm ivory, so the reds read as red rather than pink
    card: '#ffffff',
    text: '#2b1215',
    muted: '#6a3036', // deep wine for body text
    accent: '#9c0f24', // crimson
    accentText: '#8e0d20',
    soft: '#f4ece2',
    border: '#9c0f24',
    headingFont: `"Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", ${SI_TA}, cursive`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'white-rose': {
    // White Rose Elegance
    layout: 'classic',
    page: '#faf7f1',
    card: '#ffffff',
    text: '#2f2b27',
    muted: '#6c6459',
    accent: '#7f6a40', // muted champagne gold, dark enough for white button text
    accentText: '#76623b',
    soft: '#f3eee5',
    border: '#e9e2d6',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cinzel", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'pink-floral': {
    // Pink Floral Romance
    layout: 'classic',
    page: '#fbf1ef',
    card: '#fffaf7',
    text: '#4d3a3e',
    muted: '#7d6468',
    accent: '#a35a72', // muted rose, dark enough for white button text
    accentText: '#97546a',
    soft: '#f8e6e6',
    border: '#f0dcdc',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'blue-botanical': {
    // Blue Botanical Elegance
    layout: 'classic',
    page: '#eef3f5',
    card: '#fbfcfc',
    text: '#2f3e4a',
    muted: '#5d6e7a',
    accent: '#4d6b82', // dusty blue, dark enough for white button text
    accentText: '#456279',
    soft: '#e3ecf1',
    border: '#d8e2e8',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Playfair Display", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'italic',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'purple-garden': {
    // Purple Enchanted Garden
    layout: 'classic',
    page: '#f1ecf7',
    card: '#fdfbfe',
    text: '#3d3350',
    muted: '#6b5f7c',
    accent: '#735896', // lavender plum, dark enough for white button text
    accentText: '#6e5592',
    soft: '#ece4f5',
    border: '#e2d8ee',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'italic',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'kandyan-heritage': {
    // Kandyan Heritage
    layout: 'classic',
    page: '#f6eedf',
    card: '#fffaf0',
    text: '#3b2a22',
    muted: '#6b5444',
    accent: '#7a1f2b', // deep maroon
    accentText: '#7a1f2b',
    soft: '#f1e3cc',
    border: '#e6d5b8',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Playfair Display", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'nelum-lotus': {
    // Nelum Elegance
    layout: 'classic',
    page: '#fbf3f0',
    card: '#fffbf8',
    text: '#3f2e33',
    muted: '#715a60',
    accent: '#9c4a66', // deep lotus rose, dark enough for white button text
    accentText: '#8e4560',
    soft: '#f7e4e8',
    border: '#efd9dd',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'italic',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'swarna-nelum': {
    // Swarna Nelum (Golden Lotus)
    layout: 'classic',
    page: '#f9f4e8',
    card: '#fffdf6',
    text: '#3b2f1e',
    muted: '#6b5a40',
    accent: '#86662a', // antique gold, dark enough for white button text
    accentText: '#7d5f22',
    soft: '#f3ead4',
    border: '#e6d6b0',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'white-veil': {
    // White Veil
    layout: 'classic',
    page: '#f7f3ec',
    card: '#fffdf8',
    text: '#2b2620',
    muted: '#6b6156',
    accent: '#2b2620', // modern ink-black buttons, with gold details
    accentText: '#7a5c24',
    soft: '#f3eee4',
    border: '#e6dccb',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'enchanted-storybook': {
    // Enchanted Storybook
    layout: 'classic',
    page: '#e9eef7',
    card: '#fbf5e9',
    text: '#2f3a56',
    muted: '#5b6077',
    accent: '#3e5287', // storybook blue buttons, with gold details
    accentText: '#7a5c24',
    soft: '#f3e9d6',
    border: '#e5d6b8',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'midnight-rose': {
    // Midnight Rose (free static card): black card, red roses
    free: true,
    layout: 'regal',
    page: '#0b0909',
    card: '#141112',
    text: '#f4ece6',
    muted: '#b8aaa5',
    accent: '#b3122d',
    accentText: '#e8475f',
    onAccent: '#fff6f2',
    soft: '#241417',
    border: '#3c2629',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'rathu-liyawela': {
    // Rathu Liyawela (free static card): red card, gold liyawel
    free: true,
    layout: 'regal',
    page: '#3f070e',
    card: '#5f0d18',
    text: '#fbeed6',
    muted: '#e9d3a6',
    accent: '#d6a64a',
    accentText: '#f0cf7d',
    onAccent: '#3d070e',
    soft: '#5a0c16',
    border: '#b98a3a',
    headingFont: `"Cinzel", "Cormorant Garamond", ${SI_TA}, serif`,
    namesFont: `"Cinzel", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'ivory-classic': {
    // Ivory Classic (free static card)
    free: true,
    layout: 'classic',
    page: '#f3eee4',
    card: '#fffdf8',
    text: '#2b2625',
    muted: '#6b6156',
    accent: '#7a5c24',
    accentText: '#7a5c24',
    soft: '#f5efe3',
    border: '#e6dccb',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'modern-monochrome': {
    // Modern Monochrome (free static card)
    free: true,
    layout: 'classic',
    page: '#eeeeec',
    card: '#ffffff',
    text: '#161616',
    muted: '#555555',
    accent: '#161616',
    accentText: '#161616',
    soft: '#f2f2f0',
    border: '#dcdcda',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'pastel-blossom': {
    // Pastel Blossom (free static card)
    free: true,
    layout: 'classic',
    page: '#f6e9e6',
    card: '#fffaf8',
    text: '#4a3a3c',
    muted: '#6e5d5f',
    accent: '#8a5a5c',
    accentText: '#8a5a5c',
    soft: '#f8ebe8',
    border: '#eed8d5',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'sinhala-swarna': {
    // Sinhala Swarna (free static card)
    free: true,
    layout: 'classic',
    page: '#efe5cf',
    card: '#fdf8ec',
    text: '#3b2a12',
    muted: '#6b5634',
    accent: '#7a5a1c',
    accentText: '#7a5a1c',
    soft: '#f5ead2',
    border: '#e3d2ab',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'simple-lotus': {
    // Simple Lotus (free static card)
    free: true,
    layout: 'classic',
    page: '#eef0ea',
    card: '#fdfaf5',
    text: '#33403a',
    muted: '#5d6a63',
    accent: '#8a5462',
    accentText: '#8a5462',
    soft: '#f3e6e6',
    border: '#dfe5dc',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
}

export function getTheme(key) {
  return THEMES[key] || THEMES['pure-elegance']
}

// Example content used for gallery previews
export const SAMPLE_INVITATION = {
  partnerOne: 'Amaya',
  partnerTwo: 'Nuwan',
  hostLine: 'Mr. & Mrs. Perera and Mr. & Mrs. Silva request the honour of your presence',
  message: 'at the celebration of the marriage of their children',
  eventDate: '2026-12-12',
  eventTime: '16:00',
  endTime: '22:00',
  venueName: 'Mount Lavinia Hotel',
  address: '100 Hotel Road, Mount Lavinia',
  mapUrl: '',
  dressCode: 'Formal',
  rsvpDeadline: '2026-11-30',
  language: 'en',
}

// The sample's message for each occasion
const SAMPLE_MESSAGE = {
  wedding: 'at the celebration of the marriage of their children',
  engagement: 'at the celebration of the engagement of their children',
  homecoming: 'at the homecoming celebration of their children',
}

// The full sample for a design and occasion (gallery thumbnails and demos)
export function sampleInvitation(templateKey, occasion = 'wedding') {
  const eventType = SAMPLE_MESSAGE[occasion] ? occasion : 'wedding'
  const extras = SAMPLE_EXTRAS[templateKey]
  const message = extras?.language === 'si' ? sinhalaWording(eventType).message : SAMPLE_MESSAGE[eventType]
  return { ...SAMPLE_INVITATION, ...extras, templateKey, eventType, message }
}

// Extra sample content for the gallery demos, so each design shows what it can do.
// Labelled as samples on the demo page; real invitations only show the couple's own content.
export const SAMPLE_EXTRAS = {
  // The Sinhala traditional designs are shown with the traditional Sinhala wording
  'ran-pahana': {
    language: 'si',
    partnerOne: 'අමායා',
    partnerTwo: 'නුවන්',
    hostLine: '',
    blessing: SINHALA_WORDING.blessing,
    partnerOneParents: 'සුනිල් පෙරේරා මහතා සහ කමලා පෙරේරා මැතිනියගේ ආදරණීය දියණිය',
    partnerTwoParents: 'රංජිත් සිල්වා මහතා සහ නිලන්ති සිල්වා මැතිනියගේ ආදරණීය පුත්',
    inviteLine: SINHALA_WORDING.inviteLine,
    venueName: 'මවුන්ට් ලැවීනියා හෝටලය',
    address: 'හෝටල් පාර, ගල්කිස්ස',
    dressCode: 'සාම්ප්‍රදායික ඇඳුම්',
  },
  'rathu-liyawela': {
    language: 'si',
    partnerOne: 'අමායා',
    partnerTwo: 'නුවන්',
    hostLine: '',
    blessing: SINHALA_WORDING.blessing,
    partnerOneParents: 'සුනිල් පෙරේරා මහතා සහ කමලා පෙරේරා මැතිනියගේ ආදරණීය දියණිය',
    partnerTwoParents: 'රංජිත් සිල්වා මහතා සහ නිලන්ති සිල්වා මැතිනියගේ ආදරණීය පුත්',
    inviteLine: SINHALA_WORDING.inviteLine,
    venueName: 'මවුන්ට් ලැවීනියා හෝටලය',
    address: 'හෝටල් පාර, ගල්කිස්ස',
    dressCode: 'සාම්ප්‍රදායික ඇඳුම්',
  },
  'royal-red': {
    partnerOne: 'Priya',
    partnerTwo: 'Arjun',
    hostLine: 'With the blessings of the Sharma and Mehta families',
    ceremonies: [
      { name: 'Mehendi', date: '2026-12-10', time: '17:00', venue: 'Family home, Colombo 07', note: '' },
      { name: 'Sangeet', date: '2026-12-11', time: '19:00', venue: 'Taj Samudra, Colombo', note: 'Music and dancing' },
      { name: 'Wedding ceremony', date: '2026-12-12', time: '10:00', venue: 'Taj Samudra, Colombo', note: 'Traditional attire' },
      { name: 'Reception', date: '2026-12-12', time: '19:30', venue: 'Taj Samudra, Colombo', note: '' },
    ],
    venueName: 'Taj Samudra',
    address: '25 Galle Face Centre Road, Colombo 03',
    dressCode: 'Traditional attire',
  },
}

