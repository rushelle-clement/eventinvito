// One background-music player for an invitation.
//
// - The <audio> element lives in a ref, so React re-renders and the opening animation
//   never restart or stop the music.
// - Nothing downloads or plays until the guest taps (browsers block autoplay anyway).
// - If the file is missing or the browser refuses to play, `available` turns false and the
//   invitation simply carries on without sound.

import { useCallback, useEffect, useRef, useState } from 'react'

const TARGET_VOLUME = 0.55

// Is an invitation's music playing right now? (the reply chime only plays when it is)
let musicOn = false
export const isMusicPlaying = () => musicOn

export default function useBackgroundMusic(src) {
  const audioRef = useRef(null)
  const fadeRef = useRef(null)
  const resumeOnReturn = useRef(false)
  const [playing, setPlaying] = useState(false)
  const [failedSrc, setFailedSrc] = useState(null) // which track couldn't play
  const failed = !!src && failedSrc === src

  // Create the element once per track
  useEffect(() => {
    if (!src) return undefined
    const audio = new Audio()
    audio.src = src
    audio.loop = true
    audio.preload = 'none' // don't use the guest's mobile data until they want music
    audio.volume = 0
    const onError = () => {
      setFailedSrc(src)
      setPlaying(false)
    }
    const onPause = () => {
      musicOn = false
      setPlaying(false)
    }
    const onPlay = () => {
      musicOn = true
      setPlaying(true)
    }
    audio.addEventListener('error', onError)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('play', onPlay)
    audioRef.current = audio

    return () => {
      clearInterval(fadeRef.current)
      audio.removeEventListener('error', onError)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('play', onPlay)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
  }, [src])

  const fadeTo = useCallback((target, ms, then) => {
    const audio = audioRef.current
    if (!audio) return
    clearInterval(fadeRef.current)
    const steps = 20
    const start = audio.volume
    let i = 0
    fadeRef.current = setInterval(() => {
      i += 1
      audio.volume = Math.min(1, Math.max(0, start + ((target - start) * i) / steps))
      if (i >= steps) {
        clearInterval(fadeRef.current)
        then?.()
      }
    }, ms / steps)
  }, [])

  // Must be called from a tap/click so the browser allows sound
  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || failed) return false
    try {
      await audio.play()
      fadeTo(TARGET_VOLUME, 1200)
      return true
    } catch {
      // Autoplay blocked or file can't play: stay silent. A blocked play can be retried with the button.
      setPlaying(false)
      return false
    }
  }, [failed, fadeTo])

  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    fadeTo(0, 400, () => audio.pause())
  }, [fadeTo])

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play])

  // Pause when the guest switches app/tab, resume when they come back
  useEffect(() => {
    const onVisibility = () => {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden) {
        resumeOnReturn.current = !audio.paused
        audio.pause()
      } else if (resumeOnReturn.current) {
        resumeOnReturn.current = false
        audio.play().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  return { available: !!src && !failed, playing, play, pause, toggle }
}
