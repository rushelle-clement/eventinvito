// Editor: choose background music — none, a built-in track, or the couple's own file.

import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Trash2, Upload } from 'lucide-react'
import { api } from '../../lib/api'
import { uploadToCloudinary } from '../../lib/cloudinaryUpload'
import { MUSIC_TRACKS, SUGGESTED_TRACK } from '../../templates/music'

function duration(seconds) {
  if (!seconds) return ''
  const s = Math.round(seconds)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function MusicChooser({ invitationId, templateKey, value, customMusic, onChange, onInvitation }) {
  const audioRef = useRef(null)
  const inputRef = useRef(null)
  const [listening, setListening] = useState('')
  const [unavailable, setUnavailable] = useState('')
  const [rights, setRights] = useState(false)
  const [title, setTitle] = useState('')
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => () => audioRef.current?.pause(), [])

  function listen(id, src) {
    if (listening === id) {
      audioRef.current?.pause()
      setListening('')
      return
    }
    audioRef.current?.pause()
    const audio = new Audio(src)
    audio.volume = 0.6
    audio.addEventListener('error', () => {
      setUnavailable(id)
      setListening('')
    })
    audio.addEventListener('ended', () => setListening(''))
    audioRef.current = audio
    audio
      .play()
      .then(() => setListening(id))
      .catch(() => setListening(''))
  }

  async function uploadFile(file) {
    if (!file) return
    setError('')
    setProgress(0)
    try {
      const { upload } = await api(`/invitations/${invitationId}/music/signature`, { method: 'POST', body: { rightsConfirmed: rights } })
      const result = await uploadToCloudinary(upload, file, setProgress)
      const data = await api(`/invitations/${invitationId}/music`, {
        method: 'POST',
        body: { ...result, title: title.trim() || file.name.replace(/\.[^.]+$/, ''), rightsConfirmed: rights },
      })
      onInvitation(data.invitation)
      setTitle('')
    } catch (err) {
      setError(err.status === 503 ? 'Music uploads aren’t switched on yet — the Cloudinary settings are missing on the server.' : err.message)
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function removeCustom() {
    if (!window.confirm('Remove your music file from this invitation?')) return
    audioRef.current?.pause()
    setListening('')
    try {
      const data = await api(`/invitations/${invitationId}/music`, { method: 'DELETE' })
      onInvitation(data.invitation)
    } catch (err) {
      setError(err.message)
    }
  }

  const playButton = (id, src, label) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        listen(id, src)
      }}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-bone bg-white text-espresso hover:border-gold"
      aria-label={listening === id ? `Stop ${label}` : `Listen to ${label}`}
    >
      {listening === id ? <Pause size={15} /> : <Play size={15} />}
    </button>
  )

  const option = (id, label, sub, extra, disabled = false) => (
    <label key={id || 'none'} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${disabled ? 'opacity-60' : 'cursor-pointer'} ${value === id ? 'border-gold bg-blush-tint' : 'border-bone bg-white'}`}>
      <input type="radio" name="musicTrack" checked={value === id} disabled={disabled} onChange={() => onChange('musicTrack', id)} className="accent-espresso" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-md text-espresso">{label}</span>
        {sub && <span className="block text-body-sm text-on-surface-variant">{sub}</span>}
      </span>
      {extra}
    </label>
  )

  return (
    <fieldset>
      <legend className="mb-3 text-body-sm text-on-surface-variant">
        Music starts only when a guest taps “Open Invitation”, and they can pause it at any time.
      </legend>
      <div className="space-y-2">
        {option('', 'No music', 'The invitation opens silently')}
        {MUSIC_TRACKS.map((track) =>
          option(
            track.id,
            track.title,
            unavailable === track.id
              ? 'This track can’t be played right now'
              : `${track.mood}${SUGGESTED_TRACK[templateKey] === track.id ? ' · Suggested for this design' : ''}`,
            playButton(track.id, track.src, track.title),
          ),
        )}
        {customMusic &&
          option(
            'custom',
            customMusic.title || 'Your music',
            `Your own file${customMusic.duration ? ` · ${duration(customMusic.duration)}` : ''}`,
            <span className="flex gap-1">
              {customMusic.url && playButton('custom', customMusic.url, customMusic.title || 'your music')}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  removeCustom()
                }}
                className="grid h-9 w-9 place-items-center rounded-full border border-bone bg-white text-error hover:bg-error-container"
                aria-label="Remove your music file"
              >
                <Trash2 size={15} />
              </button>
            </span>,
          )}
      </div>

      {/* Upload your own */}
      <div className="mt-4 rounded-lg border border-bone bg-surface-container-low p-4">
        <p className="text-title-md text-espresso">{customMusic ? 'Replace your music' : 'Use your own music'}</p>
        <p className="mt-1 text-body-sm text-on-surface-variant">MP3, M4A, WAV, OGG or FLAC · under 15 MB · up to 10 minutes. Guests hear it as a 128 kbps MP3.</p>
        <label htmlFor="music-title" className="mt-3 block text-label-md text-espresso uppercase">
          Song title (optional)
        </label>
        <input
          id="music-title"
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Our first dance"
          className="mt-1 w-full rounded-lg border border-bone bg-white px-3 py-2 text-body-md outline-none focus:border-gold"
        />
        <label className="mt-3 flex items-start gap-2 text-body-sm text-espresso">
          <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 accent-espresso" />
          I have the right to use this music on my invitation (for example, I own it, it’s royalty-free, or I have a licence).
        </label>
        <label className={`btn-secondary mt-3 ${rights && progress === null ? 'cursor-pointer' : 'pointer-events-none opacity-50'}`}>
          <Upload size={16} aria-hidden="true" /> {progress !== null ? `Uploading… ${progress}%` : 'Choose music file'}
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.m4a,.aac,.wav,.ogg,.flac"
            className="sr-only"
            disabled={!rights || progress !== null}
            onChange={(e) => uploadFile(e.target.files?.[0])}
          />
        </label>
        {error && (
          <p className="mt-2 text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <p className="mt-3 text-body-sm text-on-surface-variant">{MUSIC_TRACKS.map((t) => t.credit).join(' ')}</p>
    </fieldset>
  )
}
