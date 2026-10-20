// Sends a file straight from the browser to Cloudinary using a signature from our API.
// Uses XMLHttpRequest (not fetch) so we can show upload progress.

export class UploadError extends Error {}

export function uploadToCloudinary(upload, file, onProgress) {
  const ext = (file.name.split('.').pop() || '').toLowerCase()
  if (upload.allowedFormats && !upload.allowedFormats.includes(ext === 'jpeg' ? 'jpg' : ext) && !upload.allowedFormats.includes(ext)) {
    return Promise.reject(new UploadError(`This file type isn’t supported. Use: ${upload.allowedFormats.join(', ').toUpperCase()}.`))
  }
  if (upload.maxBytes && file.size > upload.maxBytes) {
    return Promise.reject(new UploadError(`This file is too large. The limit is ${Math.round(upload.maxBytes / 1024 / 1024)} MB.`))
  }

  const form = new FormData()
  form.append('file', file)
  form.append('api_key', upload.apiKey)
  form.append('signature', upload.signature)
  for (const [k, v] of Object.entries(upload.params)) form.append(k, v)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', upload.uploadUrl)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100))
    xhr.onerror = () => reject(new UploadError('The upload failed. Check your connection and try again.'))
    xhr.onload = () => {
      let data = {}
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        // fall through
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.public_id) {
        resolve({ publicId: data.public_id, version: data.version, signature: data.signature, original: data.original_filename })
      } else {
        reject(new UploadError(data.error?.message ? `Upload refused: ${data.error.message}` : 'The upload failed. Please try again.'))
      }
    }
    xhr.send(form)
  })
}
