// Floating play/pause button for the invitation's background music.

import { Music, Pause } from 'lucide-react'

export default function MusicButton({ music, labels, style }) {
  if (!music.available) return null
  return (
    <button
      type="button"
      onClick={music.toggle}
      aria-pressed={music.playing}
      aria-label={music.playing ? labels.pauseMusic : labels.playMusic}
      title={music.playing ? labels.pauseMusic : labels.playMusic}
      className="ei-music-btn"
      style={style}
    >
      {music.playing ? (
        <>
          <span className="ei-eq" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <Pause size={16} aria-hidden="true" className="ei-music-pause" />
        </>
      ) : (
        <Music size={18} aria-hidden="true" />
      )}
    </button>
  )
}
