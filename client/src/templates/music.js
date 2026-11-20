// Background music tracks a couple can choose for their invitation.
//
// To add a track: put the audio file in client/public/music/ and add an entry here.
// Only use music you have the right to use (your own, public-domain recordings, or a licence
// that allows use on websites), and record where it came from in `credit`.

export const MUSIC_TRACKS = [
  {
    id: 'canon-music-box',
    title: 'Canon in D — music box',
    mood: 'Gentle, classic',
    src: '/music/canon-in-d-music-box.mp3',
    credit: 'Canon in D: composition by Johann Pachelbel (public domain), original EventInvito recording.',
  },
  {
    id: 'piano-romance',
    title: 'Romance — solo piano',
    mood: 'Warm, romantic',
    src: '/music/piano-romance.mp3',
    credit: 'Romance: original EventInvito composition and recording.',
  },
  {
    id: 'santoor-evening',
    title: 'Evening raag — santoor & tanpura',
    mood: 'Traditional, serene',
    src: '/music/santoor-evening.mp3',
    credit: 'Evening raag: original EventInvito composition and recording, in the style of Raag Yaman.',
  },
  {
    id: 'happy-birthday-music-box',
    title: 'Happy Birthday — music box',
    mood: 'Cheerful, for birthdays',
    src: '/music/happy-birthday-music-box.mp3',
    credit: 'Happy Birthday: melody from “Good Morning to All” by Mildred J. Hill (1893, public domain), original EventInvito recording.',
  },
  {
    id: 'jingle-bells-music-box',
    title: 'Jingle Bells — music box',
    mood: 'Festive, for Christmas',
    src: '/music/jingle-bells-music-box.mp3',
    credit: 'Jingle Bells: melody by James Lord Pierpont (1857, public domain), original EventInvito recording.',
  },
  {
    id: 'shubh-mangal',
    title: 'Shubh Mangal — piano',
    mood: 'Bright, Indian wedding',
    src: '/music/shubh-mangal.mp3',
    credit: 'Shubh Mangal: original EventInvito composition and recording, with a raag colour (Bilawal) and a soft tanpura.',
  },
  {
    id: 'suba-pathum',
    title: 'Suba Pathum — piano',
    mood: 'Joyful, Sinhala wedding',
    src: '/music/suba-pathum.mp3',
    credit: 'Suba Pathum: original EventInvito composition and recording, in a Sinhala folk style.',
  },
  {
    id: 'nelum-mal',
    title: 'Nelum Mal — piano',
    mood: 'Gentle, Sinhala',
    src: '/music/nelum-mal.mp3',
    credit: 'Nelum Mal: original EventInvito composition and recording, in a Sinhala folk style.',
  },
  {
    id: 'grand-evening',
    title: 'Grand Evening — piano & strings',
    mood: 'Elegant, for galas and dinners',
    src: '/music/grand-evening.mp3',
    credit: 'Grand Evening: original EventInvito composition and recording.',
  },
  {
    id: 'bright-horizon',
    title: 'Bright Horizon — modern pulse',
    mood: 'Upbeat, for launches and summits',
    src: '/music/bright-horizon.mp3',
    credit: 'Bright Horizon: original EventInvito composition and recording.',
  },
  {
    id: 'velvet-lounge',
    title: 'Velvet Lounge — electric piano jazz',
    mood: 'Relaxed, for cocktail evenings',
    src: '/music/velvet-lounge.mp3',
    credit: 'Velvet Lounge: original EventInvito composition and recording.',
  },
]

// The track that suits each design best (used in gallery previews and suggested in the editor)
export const SUGGESTED_TRACK = {
  'golden-vow': 'piano-romance',
  'white-lily': 'piano-romance',
  'grace-chapel': 'canon-music-box',
  'ratna-mahal': 'shubh-mangal',
  'balloon-bash': 'happy-birthday-music-box',
  'ocean-adventure': 'happy-birthday-music-box',
  'fairy-garden': 'happy-birthday-music-box',
  'midnight-gala': 'happy-birthday-music-box',
  'rose-wish': 'happy-birthday-music-box',
  'midnight-glam': 'velvet-lounge',
  'disco-fever': 'bright-horizon',
  'tropical-paradise': 'happy-birthday-music-box',
  'christmas-elegance': 'jingle-bells-music-box',
  'pink-christmas': 'jingle-bells-music-box',
  'winter-wonderland': 'jingle-bells-music-box',
  'cosy-christmas': 'jingle-bells-music-box',
  'christmas-after-dark': 'velvet-lounge',
  'pure-elegance': 'canon-music-box',
  'modern-romance': 'piano-romance',
  'royal-red': 'shubh-mangal',
  'crimson-love': 'piano-romance',
  'noir-rouge': 'piano-romance',
  'ran-pahana': 'suba-pathum',
  'white-rose': 'piano-romance',
  'pink-floral': 'canon-music-box',
  'blue-botanical': 'piano-romance',
  'purple-garden': 'canon-music-box',
  'kandyan-heritage': 'suba-pathum',
  'nelum-lotus': 'nelum-mal',
  'swarna-nelum': 'nelum-mal',
  'white-veil': 'piano-romance',
  'enchanted-storybook': 'canon-music-box',
  'black-tie-gala': 'grand-evening',
  'corporate-anniversary': 'grand-evening',
  'tech-innovation': 'bright-horizon',
  'product-launch': 'bright-horizon',
  'networking-cocktail': 'velvet-lounge',
}

// The music a free design (Simple Card) plays: its suggested track, or one for the occasion.
// Free cards can't choose; choosing a song (or their own) comes with Premium.
const OCCASION_TRACK = { birthday: 'happy-birthday-music-box', corporate: 'grand-evening', christmas: 'jingle-bells-music-box' }
export function defaultTrackFor(templateKey, eventType) {
  return SUGGESTED_TRACK[templateKey] || OCCASION_TRACK[eventType] || 'piano-romance'
}

export function getTrack(id) {
  return MUSIC_TRACKS.find((t) => t.id === id) || null
}
