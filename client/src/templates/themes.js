// Visual settings for each template. The `key` must match the server's template key
// (server/src/data/templates.js). To add a design: add a theme here and a template there.

import { SINHALA_WORDING, sinhalaWording } from './wording'

// Fallback fonts make Sinhala and Tamil text render properly in every design.
const SI_TA = '"Noto Serif Sinhala", "Noto Serif Tamil"'

const BODY_FONT_C = `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`

export const THEMES = {
  'ratna-mahal': {
    // Ratna Mahal: a modern Indian wedding in ivory and gold with roses, jasmine, pearls and gems
    layout: 'classic',
    page: '#f8f1e6',
    card: '#fffaf2',
    text: '#3b2f2a',
    muted: '#7b6a5e',
    accent: '#b48a45',
    accentText: '#8a6428',
    onAccent: '#ffffff',
    soft: '#f2e7d6',
    border: '#e6d5b8',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  // ---- Corporate events (corporate: true). Text colours suit each design's own background,
  // so the reply form and the day plan match it.
  'corporate-elegance': {
    // Corporate Elegance: ivory, champagne gold and charcoal; gold lines draw the frame
    free: true, corporate: true, layout: 'classic',
    page: '#f4efe5', card: '#fbf8f2', text: '#2c2c2e', muted: '#6d6a64', accent: '#2c2c2e', accentText: '#7d6330', onAccent: '#ffffff', soft: '#f1ebdf', border: '#e2d8c4',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`, namesFont: `"Cormorant Garamond", ${SI_TA}, serif`, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'modern-business': {
    // Modern Business: navy, white and silver; geometric shapes and bold type
    free: true, corporate: true, layout: 'classic',
    page: '#0f2341', card: '#132b4f', text: '#ffffff', muted: '#b8c0cc', accent: '#ffffff', accentText: '#ffffff', onAccent: '#0f2341', soft: '#1b3963', border: '#2a4a78',
    headingFont: BODY_FONT_C, namesFont: BODY_FONT_C, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'blue-gradient': {
    // Blue Corporate Gradient: a royal-blue front with a moving cyan light, on a clean white page
    free: true, corporate: true, layout: 'classic',
    page: '#eef3fd', card: '#ffffff', text: '#0b1f7a', muted: '#4d5a7c', accent: '#1e5bff', accentText: '#1e5bff', onAccent: '#ffffff', soft: '#f3f7ff', border: 'rgba(30, 91, 255, 0.25)',
    headingFont: BODY_FONT_C, namesFont: BODY_FONT_C, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'minimal-editorial': {
    // Minimal Editorial: white, black and grey Swiss typography
    free: true, corporate: true, layout: 'classic',
    page: '#efefed', card: '#ffffff', text: '#111111', muted: '#6f6f6f', accent: '#111111', accentText: '#111111', onAccent: '#ffffff', soft: '#f2f2f0', border: '#dcdcda',
    headingFont: BODY_FONT_C, namesFont: BODY_FONT_C, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'emerald-prestige': {
    // Emerald Prestige: emerald green, gold and ivory with glowing particles
    free: true, corporate: true, layout: 'classic',
    page: '#082a20', card: '#0d3b2e', text: '#f6f0e2', muted: '#cfc8b6', accent: '#d9bc76', accentText: '#e6cb8a', onAccent: '#0d3b2e', soft: '#124a3a', border: '#2c5a4a',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`, namesFont: `"Cormorant Garamond", ${SI_TA}, serif`, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'black-tie-gala': {
    // Black Tie Gala: black, gold and ivory; a spotlight and a gold shimmer
    corporate: true, layout: 'classic',
    page: '#0b0b0d', card: '#141417', text: '#f4ecdc', muted: '#bdb4a3', accent: '#c9a55c', accentText: '#d8b86e', onAccent: '#0b0b0d', soft: '#1b1a1d', border: '#3a3326',
    headingFont: `"Cinzel", "Cormorant Garamond", ${SI_TA}, serif`, namesFont: `"Cinzel", ${SI_TA}, serif`, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'tech-innovation': {
    // Technology & Innovation: midnight blue, electric blue and violet; light trails and particles
    corporate: true, layout: 'classic',
    page: '#070b24', card: '#0d1436', text: '#e9efff', muted: '#a7b3d9', accent: '#2f7bff', accentText: '#7fb0ff', onAccent: '#ffffff', soft: '#121c4a', border: '#26336b',
    headingFont: BODY_FONT_C, namesFont: BODY_FONT_C, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'corporate-anniversary': {
    // Corporate Anniversary: champagne, silver and burgundy; the big anniversary number
    corporate: true, layout: 'classic',
    page: '#f5ede0', card: '#fffaf2', text: '#2d2226', muted: '#6e6064', accent: '#7a1f2b', accentText: '#7a1f2b', onAccent: '#ffffff', soft: '#f2e6d3', border: '#e0d2bd',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`, namesFont: `"Cormorant Garamond", ${SI_TA}, serif`, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'product-launch': {
    // Product Launch: black, white and metallic silver; the product reveal
    corporate: true, layout: 'classic',
    page: '#050505', card: '#0e0e0f', text: '#f5f5f5', muted: '#a9adb4', accent: '#f5f5f5', accentText: '#f5f5f5', onAccent: '#050505', soft: '#1a1a1c', border: '#2c2d30',
    headingFont: BODY_FONT_C, namesFont: BODY_FONT_C, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'networking-cocktail': {
    // Networking Cocktail Evening: burgundy, plum and champagne; soft evening light
    corporate: true, layout: 'classic',
    page: '#2a0c1a', card: '#3a1226', text: '#f7ead7', muted: '#d6c0b0', accent: '#e8cfa3', accentText: '#ecd5ad', onAccent: '#3a1226', soft: '#4a1a33', border: '#6a2c48',
    headingFont: `"Playfair Display", "Cormorant Garamond", ${SI_TA}, serif`, namesFont: `"Playfair Display", ${SI_TA}, serif`, namesStyle: 'normal', bodyFont: BODY_FONT_C,
  },
  'grace-chapel': {
    // Sage Promise: a church wedding in white, sage green and soft gold, with a white-rose arch
    layout: 'classic',
    page: '#fbf8f1',
    card: '#ffffff',
    text: '#2e2b25',
    muted: '#6b675d',
    accent: '#55644a',
    accentText: '#55644a',
    onAccent: '#ffffff',
    soft: '#eff2ea',
    border: '#dcd6c6',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'white-lily': {
    // White Lily: black and white with white lilies, built around the couple's photos
    layout: 'classic',
    page: '#f7f6f3',
    card: '#ffffff',
    text: '#111111',
    muted: '#5f5f5c',
    accent: '#111111',
    accentText: '#111111',
    onAccent: '#ffffff',
    soft: '#efeeea',
    border: '#d9d8d3',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
  'golden-vow': {
    // Golden Vow: modern gold, ivory and white, built around the couple's photos
    layout: 'classic',
    page: '#faf6ee',
    card: '#ffffff',
    text: '#2b2620',
    muted: '#7a6f60',
    accent: '#b8964f',
    accentText: '#9a7a37',
    onAccent: '#ffffff',
    soft: '#f6efe0',
    border: '#ebdfc6',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`,
  },
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

// ---- Birthdays (free static cards): drawn artwork, one person and their age ----
const KIDS_FONT = `"Fredoka", "Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`
const BODY_FONT = `"Plus Jakarta Sans", "Noto Sans Sinhala", "Noto Sans Tamil", sans-serif`
Object.assign(THEMES, {
  'confetti-pop': {
    // Confetti Pop: kids' party, yellow, teal and coral confetti
    free: true,
    birthday: true,
    layout: 'classic',
    page: '#ffe7a3',
    card: '#fffaf0',
    text: '#2a3a4a',
    muted: '#5c6b78',
    accent: '#1fa6a0',
    accentText: '#13827d',
    soft: '#fff2cf',
    border: '#f3dfa9',
    headingFont: KIDS_FONT,
    namesFont: KIDS_FONT,
    namesStyle: 'normal',
    bodyFont: KIDS_FONT,
  },
  'little-star': {
    // Little Star: a little boy's birthday, baby blue, a gold crown and stars
    free: true,
    birthday: true,
    layout: 'classic',
    page: '#d6e9f6',
    card: '#f6fbff',
    text: '#22406a',
    muted: '#5a7190',
    accent: '#c9a24a',
    accentText: '#9c7a2c',
    soft: '#e8f3fb',
    border: '#c9def0',
    headingFont: KIDS_FONT,
    namesFont: KIDS_FONT,
    namesStyle: 'normal',
    bodyFont: KIDS_FONT,
  },
  'blush-bloom': {
    // Blush Bloom: a little girl's birthday, blush balloons and flowers
    free: true,
    birthday: true,
    layout: 'classic',
    page: '#f9dde3',
    card: '#fff8f9',
    text: '#5a2a3a',
    muted: '#8a5b68',
    accent: '#d9738f',
    accentText: '#b04f6b',
    soft: '#fdecef',
    border: '#f3cdd6',
    headingFont: `"Dancing Script", "Cormorant Garamond", ${SI_TA}, serif`,
    namesFont: `"Dancing Script", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: KIDS_FONT,
  },
  'black-gold': {
    // Black & Gold: an adult milestone, modern and minimal, a huge gold number
    free: true,
    birthday: true,
    layout: 'regal',
    page: '#070707',
    card: '#121212',
    text: '#f5efe2',
    muted: '#bdb3a0',
    accent: '#d4af5a',
    accentText: '#e3c37a',
    onAccent: '#121212',
    soft: '#1c1a16',
    border: '#3a3326',
    headingFont: BODY_FONT,
    namesFont: BODY_FONT,
    namesStyle: 'normal',
    bodyFont: BODY_FONT,
  },
  'rose-bubbles': {
    // Rosé Bubbles: her birthday, rose gold and champagne bubbles
    free: true,
    birthday: true,
    layout: 'classic',
    page: '#f3d9d2',
    card: '#fffaf8',
    text: '#4e2c2b',
    muted: '#86615c',
    accent: '#b9786a',
    accentText: '#9b5c50',
    soft: '#fbeeea',
    border: '#efd6cf',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: BODY_FONT,
  },
})

// ---- Birthdays (Premium, animated): AI illustrations in /public/<key>/ ----
Object.assign(THEMES, {
  'balloon-bash': {
    // Balloon Bash: kids' party; the balloons float away with the name tag
    birthday: true,
    layout: 'classic',
    page: '#fff8ee',
    card: '#ffffff',
    text: '#2a3a4a',
    muted: '#5c6b78',
    accent: '#f2786b',
    accentText: '#d9574a',
    onAccent: '#ffffff',
    soft: '#fff1e2',
    border: '#f3dfc9',
    headingFont: KIDS_FONT,
    namesFont: KIDS_FONT,
    namesStyle: 'normal',
    bodyFont: KIDS_FONT,
  },
  'ocean-adventure': {
    // Ocean Adventure: a boy's party under the sea; the treasure chest opens
    birthday: true,
    layout: 'classic',
    page: '#e6f7f8',
    card: '#ffffff',
    text: '#10405a',
    muted: '#47697c',
    accent: '#1593a6',
    accentText: '#0f7f90',
    onAccent: '#ffffff',
    soft: '#d6f1f3',
    border: '#bfe9ee',
    headingFont: KIDS_FONT,
    namesFont: KIDS_FONT,
    namesStyle: 'normal',
    bodyFont: KIDS_FONT,
  },
  'fairy-garden': {
    // Fairy Garden: a girl's party; the flowered gate opens and butterflies fly out
    birthday: true,
    layout: 'classic',
    page: '#f8f2fc',
    card: '#ffffff',
    text: '#4b2f63',
    muted: '#7b6390',
    accent: '#a674cf',
    accentText: '#8c4fb9',
    onAccent: '#ffffff',
    soft: '#f1e6f9',
    border: '#ead9f6',
    headingFont: KIDS_FONT,
    namesFont: `"Dancing Script", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: KIDS_FONT,
  },
  'midnight-gala': {
    // Midnight Gala: his birthday in navy and gold; the gift's lid lifts off
    birthday: true,
    layout: 'regal',
    page: '#0a1330',
    card: '#101c42',
    text: '#f6efdc',
    muted: '#b7b3c4',
    accent: '#d9b768',
    accentText: '#e8cd8a',
    onAccent: '#0a1330',
    soft: '#13204a',
    border: '#2a3664',
    headingFont: BODY_FONT,
    namesFont: BODY_FONT,
    namesStyle: 'normal',
    bodyFont: BODY_FONT,
  },
})

Object.assign(THEMES, {
  'midnight-glam': {
    // Midnight Glam: black and champagne gold; a starry gold arch, golden particles reveal it
    birthday: true,
    layout: 'regal',
    page: '#0b0a09',
    card: '#15130f',
    text: '#f4ead2',
    muted: '#b5aa93',
    accent: '#d8bc82',
    accentText: '#e6cf9c',
    onAccent: '#0b0a09',
    soft: '#1b1813',
    border: '#3a3326',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Italiana", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: BODY_FONT,
  },
  'disco-fever': {
    // Disco Fever: pink, purple and blue; a mirror ball turning in coloured light
    birthday: true,
    layout: 'classic',
    page: '#1d0b33',
    card: '#2a1046',
    text: '#fff3fb',
    muted: '#d9b9e8',
    accent: '#ff3fa4',
    accentText: '#ff79c6',
    onAccent: '#ffffff',
    soft: '#341257',
    border: '#4f2475',
    headingFont: `"Montserrat", ${SI_TA}, sans-serif`,
    namesFont: `"Montserrat", ${SI_TA}, sans-serif`,
    namesStyle: 'normal',
    bodyFont: BODY_FONT,
  },
  'tropical-paradise': {
    // Tropical Paradise: teal, coral and sunny yellow; palm leaves sway around a hibiscus card
    birthday: true,
    layout: 'classic',
    page: '#e9f7f4',
    card: '#ffffff',
    text: '#14514c',
    muted: '#4b7c76',
    accent: '#ff7a59',
    accentText: '#e8613f',
    onAccent: '#ffffff',
    soft: '#dcf2ee',
    border: '#bfe3dc',
    headingFont: `"Playfair Display", "Cormorant Garamond", ${SI_TA}, serif`,
    namesFont: `"Playfair Display", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: BODY_FONT,
  },
  'rose-wish': {
    // Rosé Wish: her birthday, blush and rose gold; "Make a wish" blows the candles out
    birthday: true,
    layout: 'classic',
    page: '#fbf1ee',
    card: '#ffffff',
    text: '#4e2c2b',
    muted: '#86615c',
    accent: '#b9786a',
    accentText: '#9b5c50',
    onAccent: '#ffffff',
    soft: '#f8e6e1',
    border: '#efd6cf',
    headingFont: `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`,
    namesFont: `"Great Vibes", "Cormorant Garamond", ${SI_TA}, serif`,
    namesStyle: 'normal',
    bodyFont: BODY_FONT,
  },
})

// Gallery samples for the birthday designs
const BIRTHDAY_SAMPLES = {
  'confetti-pop': { celebrant: 'Sanuli', age: 5, venueName: 'Sunshine Play Park', address: '24 Lake Drive, Colombo 05', dressCode: 'Bright colours', eventTime: '15:30', endTime: '18:30' },
  'little-star': {
    celebrant: 'Kavin',
    age: 1,
    hostLine: 'Mr. & Mrs. Fernando invite you to celebrate their little star',
    venueName: 'Cinnamon Lakeside',
    address: '115 Sir Chittampalam A. Gardiner Mawatha, Colombo 02',
    dressCode: 'Smart casual',
    eventTime: '11:00',
    endTime: '14:00',
  },
  'blush-bloom': { celebrant: 'Amaya', age: 7, venueName: 'The Garden Café', address: '32 Flower Road, Colombo 07', dressCode: 'Pastels', eventTime: '16:00', endTime: '19:00' },
  'black-gold': {
    celebrant: 'Ravindu',
    age: 30,
    message: 'Join us for drinks, dinner and dancing as we celebrate thirty years.',
    venueName: 'The Kingsbury Rooftop',
    address: '48 Janadhipathi Mawatha, Colombo 01',
    dressCode: 'Black & gold',
    eventTime: '19:30',
    endTime: '23:30',
  },
  'balloon-bash': { celebrant: 'Sanuli', age: 5, venueName: 'Sunshine Play Park', address: '24 Lake Drive, Colombo 05', dressCode: 'Bright colours', eventTime: '15:30', endTime: '18:30' },
  'ocean-adventure': {
    celebrant: 'Kavin',
    age: 6,
    message: 'Dive in for games, treasure hunts and cake — come and celebrate with us!',
    venueName: 'Blue Lagoon Pool Club',
    address: '9 Marine Drive, Colombo 03',
    dressCode: 'Pirates & sea creatures',
    eventTime: '10:30',
    endTime: '13:30',
  },
  'fairy-garden': {
    celebrant: 'Amaya',
    age: 4,
    hostLine: 'Mr. & Mrs. Silva invite you to celebrate their little fairy',
    venueName: 'The Garden Café',
    address: '32 Flower Road, Colombo 07',
    dressCode: 'Fairy wings welcome',
    eventTime: '16:00',
    endTime: '19:00',
  },
  'midnight-gala': {
    celebrant: 'Dinesh',
    age: 40,
    message: 'An evening of good food, music and the people who matter most.',
    venueName: 'The Kingsbury Ballroom',
    address: '48 Janadhipathi Mawatha, Colombo 01',
    dressCode: 'Navy, black & gold',
    eventTime: '19:30',
    endTime: '23:30',
  },
  'rose-wish': {
    celebrant: 'Nadeesha',
    age: 30,
    message: 'Join us for an evening of cake, champagne and the people she loves most.',
    venueName: 'Shangri-La Colombo',
    address: '1 Galle Face, Colombo 02',
    dressCode: 'Blush, rose & cocktail',
    eventTime: '19:00',
    endTime: '23:00',
  },
  'midnight-glam': {
    celebrant: 'Olivia',
    age: 25,
    message: 'Join us for a night of music, champagne and starlight.',
    venueName: 'Cinnamon Life Sky Lounge',
    address: '1 Justice Akbar Mawatha, Colombo 02',
    dressCode: 'Black & gold glam',
    eventTime: '20:00',
    endTime: '23:59',
  },
  'disco-fever': {
    celebrant: 'Jessica',
    age: 21,
    message: 'Put on your dancing shoes — it’s a disco party!',
    venueName: 'Groove Club Colombo',
    address: '18 Marine Drive, Colombo 03',
    dressCode: '70s disco & sparkle',
    eventTime: '19:30',
    endTime: '23:30',
  },
  'tropical-paradise': {
    celebrant: 'Helena',
    age: 30,
    message: 'Sunshine, cocktails and good friends — join us for a tropical birthday by the sea.',
    venueName: 'Mount Lavinia Beach Club',
    address: '100 Hotel Road, Mount Lavinia',
    dressCode: 'Tropical & bright',
    eventTime: '16:00',
    endTime: '21:00',
  },
  'rose-bubbles': {
    celebrant: 'Nadeesha',
    age: 40,
    message: 'An evening of champagne, cake and the people she loves most.',
    venueName: 'Shangri-La Colombo',
    address: '1 Galle Face, Colombo 02',
    dressCode: 'Cocktail',
    eventTime: '19:00',
    endTime: '23:00',
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

// Sample couple photos for the gallery and demos (/public/samples/couple). The first is the cover.
// Six, like the Premium package. Only the Premium couple designs show photos; real invitations show the couple’s own.
export const SAMPLE_PHOTOS = Array.from({ length: 6 }, (_, i) => {
  const url = `${import.meta.env.BASE_URL}samples/couple/couple-${i + 1}.webp`
  return { id: `sample-${i + 1}`, url, thumb: url }
})

// The full sample for a design and occasion (gallery thumbnails and demos)
// Corporate samples: a made-up company ("Lumora Group") and a fitting event for each design
const SAMPLE_LOGO = { url: `${import.meta.env.BASE_URL}corporate/sample-logo.svg`, width: 420, height: 110 }
const CORPORATE_SAMPLES = {
  'corporate-elegance': { eventTitle: 'Annual Dinner 2026', dressCode: 'Black tie', venueName: 'Cinnamon Grand', address: '77 Galle Road, Colombo 03', eventTime: '19:00', endTime: '23:00' },
  'modern-business': { eventTitle: 'Leadership Summit 2026', dressCode: 'Business formal', venueName: 'BMICH', address: 'Bauddhaloka Mawatha, Colombo 07', eventTime: '09:00', endTime: '17:00' },
  'blue-gradient': { eventTitle: 'Product Innovation Day', dressCode: 'Smart casual', venueName: 'Hilton Colombo', address: '2 Sir Chittampalam A. Gardiner Mawatha, Colombo 02', eventTime: '10:00', endTime: '16:00' },
  'minimal-editorial': { eventTitle: 'Executive Roundtable', dressCode: 'Business formal', venueName: 'The Kingsbury', address: '48 Janadhipathi Mawatha, Colombo 01', eventTime: '18:30', endTime: '21:00' },
  'emerald-prestige': { eventTitle: 'Executive Dinner', blessing: 'Celebrating 20 years together', dressCode: 'Formal', venueName: 'Shangri-La Colombo', address: '1 Galle Face, Colombo 02', eventTime: '19:30', endTime: '23:00' },
  'black-tie-gala': {
    eventTitle: 'Annual Awards Gala',
    dressCode: 'Black tie',
    venueName: 'Shangri-La Colombo',
    address: '1 Galle Face, Colombo 02',
    eventTime: '19:00',
    endTime: '23:30',
    ceremonies: [
      { name: 'Red carpet & cocktails', date: '', time: '19:00', venue: '', note: '' },
      { name: 'Awards ceremony', date: '', time: '20:00', venue: '', note: '' },
      { name: 'Gala dinner', date: '', time: '21:30', venue: '', note: '' },
    ],
  },
  'tech-innovation': {
    eventTitle: 'Tech Summit 2026',
    dressCode: 'Smart casual',
    venueName: 'Colombo City Centre',
    address: '137 Sir James Peiris Mawatha, Colombo 02',
    eventTime: '09:00',
    endTime: '18:00',
    ceremonies: [
      { name: 'Registration', date: '', time: '08:30', venue: '', note: '' },
      { name: 'Keynote: The AI Decade', date: '', time: '09:30', venue: 'Main hall', note: '' },
      { name: 'Product demos & networking', date: '', time: '14:00', venue: '', note: '' },
    ],
  },
  'corporate-anniversary': { eventTitle: 'Silver Jubilee Celebration', milestone: 25, dressCode: 'Formal', venueName: 'Cinnamon Grand', address: '77 Galle Road, Colombo 03', eventTime: '19:00', endTime: '23:00' },
  'product-launch': { eventTitle: 'Introducing Lumora One', dressCode: 'Smart casual', venueName: 'One Galle Face', address: '1A Centre Road, Galle Face, Colombo 02', eventTime: '18:00', endTime: '21:00' },
  'networking-cocktail': { eventTitle: 'Client Appreciation Evening', dressCode: 'Cocktail attire', venueName: 'The Kingsbury Rooftop', address: '48 Janadhipathi Mawatha, Colombo 01', eventTime: '18:30', endTime: '22:00' },
}

// ---- Christmas parties (eventType "christmas"): the party's title and its hosts
const XMAS = (name, page, card, text, muted, accent, accentText, onAccent, soft, border, heading) => ({
  christmas: true,
  layout: 'classic',
  page,
  card,
  text,
  muted,
  accent,
  accentText,
  onAccent,
  soft,
  border,
  headingFont: heading,
  namesFont: heading,
  namesStyle: 'normal',
  bodyFont: BODY_FONT_C,
})
const XMAS_SERIF = `"Cormorant Garamond", "Playfair Display", ${SI_TA}, serif`
Object.assign(THEMES, {
  // Free cards (a light animation on the card)
  'classic-noel': { ...XMAS('Classic Noël', '#efe6d6', '#fbf6ec', '#3b2a22', '#6f5d50', '#b3202e', '#a11c29', '#ffffff', '#f4ead8', '#e3d4bb', XMAS_SERIF), free: true },
  'candy-cane': { ...XMAS('Candy Cane Lane', '#fde9ea', '#ffffff', '#3a1f24', '#7a5a5f', '#d7263d', '#c21f35', '#ffffff', '#fff1f2', '#f6c9cf', `"Fredoka", ${SI_TA}, sans-serif`), free: true },
  'nordic-pine': { ...XMAS('Nordic Pine', '#e7e3da', '#f4f1ea', '#2f3437', '#6b7069', '#5f7d66', '#4f6c56', '#ffffff', '#ebe7de', '#d9d4c8', `"Italiana", "Cormorant Garamond", ${SI_TA}, serif`), free: true },
  'golden-star': { ...XMAS('Starlight', '#0a1128', '#101a3a', '#f5ecd6', '#bdb6a2', '#d9b768', '#e6c77f', '#101a3a', '#16224a', '#2c3866', XMAS_SERIF), free: true },
  // Premium (animated)
  'christmas-elegance': XMAS('Christmas Elegance', '#0f2a1f', '#13392a', '#f6eedb', '#cbbf9f', '#d8bc82', '#e3c98f', '#13241b', '#153d2d', '#2c5442', XMAS_SERIF),
  'pink-christmas': XMAS('Pink Christmas', '#fbe8ee', '#ffffff', '#6b3f4e', '#9a7280', '#d46a8c', '#c0627f', '#ffffff', '#fdf0f4', '#f6d3df', `"Playfair Display", ${SI_TA}, serif`),
  'winter-wonderland': XMAS('Winter Wonderland', '#e9f1fb', '#ffffff', '#23406a', '#5f7697', '#5b8cc9', '#4a7bbb', '#ffffff', '#eef4fc', '#d6e3f4', XMAS_SERIF),
  'cosy-christmas': XMAS('Cosy Christmas', '#efe4d2', '#fbf6ec', '#4a2e1f', '#7d6150', '#a3262f', '#a3262f', '#ffffff', '#f6ecdb', '#e7d6bd', XMAS_SERIF),
  'christmas-after-dark': XMAS('Christmas After Dark', '#151617', '#1f2221', '#f3f1ea', '#b9b7ae', '#d9334a', '#e94a5f', '#ffffff', '#24282a', '#3a3e3f', XMAS_SERIF),
  'silent-night': { ...XMAS('Silent Night', '#0c1733', '#13234a', '#eef3fb', '#b6c3dc', '#f3c969', '#f3c969', '#13234a', '#1a2c58', '#2c3f70', XMAS_SERIF), free: true },
})

// Gallery samples for the Christmas designs
const CHRISTMAS_SAMPLES = {
  'classic-noel': { eventTitle: 'Christmas Party', companyName: 'The Perera Family', venueName: 'The Perera Residence', address: '24 Flower Road, Colombo 07', dressCode: 'Festive red & green', eventTime: '18:30', endTime: '22:30' },
  'candy-cane': { eventTitle: 'Family Christmas Party', companyName: 'The Silvas', venueName: 'Our Home', address: '12 Lake Drive, Nugegoda', dressCode: 'Christmas jumpers', eventTime: '16:00', endTime: '20:00' },
  'nordic-pine': { eventTitle: 'Christmas Dinner', companyName: 'Anna & Mark', venueName: 'The Garden House', address: '5 Ward Place, Colombo 07', dressCode: 'Smart casual', eventTime: '19:00', endTime: '23:00' },
  'golden-star': { eventTitle: 'Christmas Eve Soirée', companyName: 'The Fernandos', venueName: 'Galle Face Hotel', address: '2 Galle Road, Colombo 03', dressCode: 'Black tie & sparkle', eventTime: '19:30', endTime: '23:59' },
  'christmas-elegance': { eventTitle: 'Christmas Party', companyName: 'The Wijesinghe Family', message: 'Join us for an elegant evening of festive dining, carols and good company.', venueName: 'Shangri-La Colombo', address: '1 Galle Face, Colombo 02', dressCode: 'Festive formal', eventTime: '19:00', endTime: '23:30', ceremonies: [{ name: 'Welcome drinks', date: '', time: '19:00', venue: '', note: '' }, { name: 'Carols', date: '', time: '20:00', venue: '', note: '' }, { name: 'Christmas dinner', date: '', time: '20:30', venue: '', note: '' }] },
  'pink-christmas': { eventTitle: 'Christmas Party', companyName: 'Sanduni & Friends', message: 'Pink, sparkly and full of cheer — come celebrate Christmas with us!', venueName: 'The Blush Room', address: '45 Ward Place, Colombo 07', dressCode: 'Pink & sparkle', eventTime: '17:00', endTime: '21:00' },
  'winter-wonderland': { eventTitle: 'Christmas Party', companyName: 'The de Silva Family', message: 'Step into a winter wonderland of carols, cocoa and twinkling lights.', venueName: 'Hill Club', address: 'Grand Hotel Road, Nuwara Eliya', dressCode: 'Winter white & silver', eventTime: '18:30', endTime: '22:30' },
  'cosy-christmas': { eventTitle: 'Christmas Get-together', companyName: 'Nimal & Priya', message: 'Warm drinks, gingerbread and good company — come and share a cosy Christmas with us.', venueName: 'Our Home', address: '8 Temple Lane, Kandy', dressCode: 'Cosy jumpers welcome', eventTime: '17:30', endTime: '21:30' },
  'christmas-after-dark': { eventTitle: 'Christmas Party', companyName: 'The Groove Collective', message: 'Drinks, food and music until late — free entry for friends and family.', venueName: 'The Loft Bar', address: '22 Marine Drive, Colombo 03', dressCode: 'Red, green & sparkle', eventTime: '20:00', endTime: '23:59' },
  'silent-night': { eventTitle: 'Christmas Carol Night', companyName: 'St. Mary’s Youth', venueName: 'St. Mary’s Church Hall', address: 'Church Road, Negombo', dressCode: 'Warm & cosy', eventTime: '18:00', endTime: '21:00' },
}

export function sampleInvitation(templateKey, occasion = 'wedding') {
  if (THEMES[templateKey]?.christmas) {
    return {
      ...SAMPLE_INVITATION,
      partnerOne: '',
      partnerTwo: '',
      hostLine: '',
      message: '',
      photos: [],
      ...CHRISTMAS_SAMPLES[templateKey],
      templateKey,
      eventType: 'christmas',
      eventDate: '2026-12-20',
      rsvpDeadline: '2026-12-12',
    }
  }
  if (THEMES[templateKey]?.corporate) {
    return {
      ...SAMPLE_INVITATION,
      partnerOne: '',
      partnerTwo: '',
      hostLine: '',
      message: '',
      companyName: 'Lumora Group',
      logo: SAMPLE_LOGO,
      logoStyle: 'mono', // the sample logo in each design's own colours
      photos: [],
      ...CORPORATE_SAMPLES[templateKey],
      templateKey,
      eventType: 'corporate',
      eventDate: '2026-12-18',
      rsvpDeadline: '2026-12-08',
    }
  }
  if (THEMES[templateKey]?.birthday) {
    return {
      ...SAMPLE_INVITATION,
      partnerOne: '',
      partnerTwo: '',
      hostLine: '',
      message: '',
      ...BIRTHDAY_SAMPLES[templateKey],
      templateKey,
      eventType: 'birthday',
      eventDate: '2026-12-19',
      rsvpDeadline: '2026-12-10',
    }
  }
  const eventType = SAMPLE_MESSAGE[occasion] ? occasion : 'wedding'
  const photos = THEMES[templateKey]?.free ? [] : SAMPLE_PHOTOS
  const extras = SAMPLE_EXTRAS[templateKey]
  const message = extras?.language === 'si' ? sinhalaWording(eventType).message : SAMPLE_MESSAGE[eventType]
  return { ...SAMPLE_INVITATION, photos, ...extras, templateKey, eventType, message }
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

