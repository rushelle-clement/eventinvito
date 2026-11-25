// A short celebration when a guest accepts: petals (or confetti for birthdays) in the design's own
// colours fall across the screen for about 2.5 seconds, and a soft chime plays if the invitation's
// music is already on. Drawn on one canvas that removes itself; nothing for guests who prefer less motion.

const DURATION = 2600

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// colors: a few hex colours from the design; kind: 'petals' | 'confetti'
export function celebrate({ colors = ['#c5a059'], kind = 'petals' } = {}) {
  if (typeof document === 'undefined' || reducedMotion()) return
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '9999' })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = window.innerWidth
  const H = window.innerHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.scale(dpr, dpr)

  const count = Math.round(Math.min(90, Math.max(40, W / 9)))
  const bits = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: -20 - Math.random() * H * 0.45,
    size: kind === 'confetti' ? 5 + Math.random() * 5 : 7 + Math.random() * 7,
    // about two seconds to cross the screen, whatever its height
    vy: (H / 120) * (0.75 + Math.random() * 0.6),
    vx: (Math.random() - 0.5) * 1.2,
    sway: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.12,
    angle: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }))

  const start = performance.now()
  function frame(now) {
    const elapsed = now - start
    ctx.clearRect(0, 0, W, H)
    // fade everything out over the last 0.6 s
    ctx.globalAlpha = Math.max(0, Math.min(1, (DURATION - elapsed) / 600))
    for (const b of bits) {
      b.sway += 0.04
      b.x += b.vx + Math.sin(b.sway) * 0.6
      b.y += b.vy
      b.angle += b.spin
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(b.angle)
      ctx.fillStyle = b.color
      if (kind === 'confetti') {
        ctx.fillRect(-b.size / 2, -b.size / 4, b.size, b.size / 2)
      } else {
        // a petal: a soft ellipse, slightly see-through
        ctx.globalAlpha *= 0.85
        ctx.beginPath()
        ctx.ellipse(0, 0, b.size / 2, b.size / 4.2, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    if (elapsed < DURATION) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}

// A soft three-note chime (made in the browser, no sound file)
export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ac = new AudioCtx()
    const notes = [1046.5, 1318.5, 1568] // C6, E6, G6
    notes.forEach((freq, i) => {
      const at = ac.currentTime + i * 0.14
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(0.06, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 1.2)
      osc.connect(gain).connect(ac.destination)
      osc.start(at)
      osc.stop(at + 1.25)
    })
    setTimeout(() => ac.close().catch(() => {}), 2000)
  } catch {
    // no sound: the celebration still shows
  }
}
