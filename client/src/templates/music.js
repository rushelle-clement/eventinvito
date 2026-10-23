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
]

// The track that suits each design best (used in gallery previews and suggested in the editor)
export const SUGGESTED_TRACK = {
  'golden-vow': 'piano-romance',
  'balloon-bash': 'happy-birthday-music-box',
  'ocean-adventure': 'happy-birthday-music-box',
  'fairy-garden': 'happy-birthday-music-box',
  'midnight-gala': 'happy-birthday-music-box',
  'rose-wish': 'happy-birthday-music-box',
  'pure-elegance': 'canon-music-box',
  'modern-romance': 'piano-romance',
  'royal-red': 'santoor-evening',
  'crimson-love': 'piano-romance',
  'noir-rouge': 'piano-romance',
  'ran-pahana': 'santoor-evening',
  'white-rose': 'piano-romance',
  'pink-floral': 'canon-music-box',
  'blue-botanical': 'piano-romance',
  'purple-garden': 'canon-music-box',
  'kandyan-heritage': 'santoor-evening',
  'nelum-lotus': 'santoor-evening',
  'swarna-nelum': 'santoor-evening',
  'white-veil': 'piano-romance',
  'enchanted-storybook': 'canon-music-box',
}

export function getTrack(id) {
  return MUSIC_TRACKS.find((t) => t.id === id) || null
}
