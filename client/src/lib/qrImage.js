// Draws the printed-card QR code with the couple's initials in a circle in the middle.
// High error correction (H, ~30%) lets phones read the code even with the middle covered;
// the circle covers well under that.

import QRCode from 'qrcode'

const INK = '#1f1a17' // near-black: scans best on paper
const QUIET = 4 // empty modules round the code, needed by scanners

export function drawQr(canvas, text, initials = '', size = 1024) {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'H' })
  const count = qr.modules.size
  const cell = Math.floor(size / (count + QUIET * 2))
  const px = cell * (count + QUIET * 2)
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, px, px)
  ctx.fillStyle = INK
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.modules.get(r, c)) ctx.fillRect((c + QUIET) * cell, (r + QUIET) * cell, cell, cell)
    }
  }

  const label = String(initials || '').trim()
  if (label) {
    // The circle is ~22% of the code's width (about 5% of its area)
    const mid = px / 2
    const radius = count * cell * 0.11
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(mid, mid, radius + cell * 0.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = INK
    ctx.lineWidth = Math.max(2, cell * 0.35)
    ctx.beginPath()
    ctx.arc(mid, mid, radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = INK
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    let font = radius * (label.length > 2 ? 0.78 : 0.95)
    ctx.font = `600 ${font}px "Playfair Display", Georgia, serif`
    while (ctx.measureText(label).width > radius * 1.6 && font > 8) {
      font -= 2
      ctx.font = `600 ${font}px "Playfair Display", Georgia, serif`
    }
    ctx.fillText(label, mid, mid + font * 0.04)
  }
  return canvas
}

export function downloadQr(text, initials, fileName) {
  const canvas = drawQr(document.createElement('canvas'), text, initials, 1200)
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}
