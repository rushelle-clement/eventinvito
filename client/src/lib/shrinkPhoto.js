// Shrinks a photo in the browser before it is uploaded: at most 2000px on its longest side, saved as
// a good-quality JPEG (about 0.5–1 MB instead of a phone's 4–12 MB). Faster on mobile data and saves
// storage. Files the browser can't read (HEIC from iPhones in most browsers) are sent as they are;
// Cloudinary shrinks those on arrival. If anything goes wrong, the original file is used.

const MAX_SIDE = 2000
const QUALITY = 0.86

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable'))
    }
    img.src = url
  })
}

export async function shrinkPhoto(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  try {
    const { img, url } = await loadImage(file)
    const { naturalWidth: w, naturalHeight: h } = img
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h))
    // already small: keep the original
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      URL.revokeObjectURL(url)
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff' // a transparent PNG becomes white, not black
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    if (!blob || blob.size >= file.size) return file
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  }
}
