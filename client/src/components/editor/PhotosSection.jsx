// Editor: upload, order and remove invitation photos (FR-022). The first photo is the cover.

import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { uploadToCloudinary } from '../../lib/cloudinaryUpload'
import { shrinkPhoto } from '../../lib/shrinkPhoto'

// The package sets the limit: 3 photos on Premium, 6 on Premium Plus and Signature
export default function PhotosSection({ invitationId, photos, limits, onChange }) {
  const MAX = limits?.photos ?? 3
  const more = MAX < 6 // Premium Plus allows more
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null) // { done, total, percent }
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).slice(0, MAX - photos.length)
    if (!files.length) return
    setError('')
    for (const [i, file] of files.entries()) {
      setProgress({ done: i, total: files.length, percent: 0 })
      try {
        const { upload } = await api(`/invitations/${invitationId}/photos/signature`, { method: 'POST' })
        // shrink it first (large phone photos become about 0.5–1 MB)
        const ready = await shrinkPhoto(file)
        const result = await uploadToCloudinary(upload, ready, (percent) => setProgress({ done: i, total: files.length, percent }))
        const data = await api(`/invitations/${invitationId}/photos`, { method: 'POST', body: result })
        onChange(data.photos)
      } catch (err) {
        setError(`${file.name}: ${err.message}`)
        break
      }
    }
    setProgress(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function move(index, delta) {
    const ids = photos.map((p) => p.id)
    const j = index + delta
    if (j < 0 || j >= ids.length) return
    ;[ids[index], ids[j]] = [ids[j], ids[index]]
    await save(ids)
  }

  async function makeCover(index) {
    const ids = photos.map((p) => p.id)
    const [chosen] = ids.splice(index, 1)
    await save([chosen, ...ids])
  }

  async function save(ids) {
    setBusy(true)
    setError('')
    try {
      const data = await api(`/invitations/${invitationId}/photos/order`, { method: 'PUT', body: { ids } })
      onChange(data.photos)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(photo) {
    if (!window.confirm('Remove this photo from the invitation?')) return
    setBusy(true)
    setError('')
    try {
      const data = await api(`/invitations/${invitationId}/photos/${photo.id}`, { method: 'DELETE' })
      onChange(data.photos)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const uploading = progress !== null

  return (
    <div>
      <p className="text-body-sm text-on-surface-variant">
        Add up to {MAX} photos (JPG, PNG, WebP or HEIC; large photos are made smaller automatically). The first one is the cover — Modern Romance opens with it full screen.
      </p>
      {limits?.planName && (
        <p className="mt-2 text-body-sm text-on-surface-variant">
          {limits.planName} includes {MAX} photos.
          {more && (
            <>
              {' '}
              Premium Plus includes 6 —{' '}
              <a href="/#pricing" className="font-semibold text-gold-text underline underline-offset-2">
                see the packages
              </a>
              .
            </>
          )}
        </p>
      )}

      {photos.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <li key={p.id} className="overflow-hidden rounded-lg border border-bone bg-white">
              <div className="relative aspect-[4/3] bg-surface-container">
                {p.thumb && <img src={p.thumb} alt={`Photo ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />}
                {i === 0 && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-espresso/85 px-2 py-0.5 text-label-sm text-white">
                    <Star size={11} aria-hidden="true" /> Cover
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-1.5 py-1.5">
                <div className="flex">
                  <button type="button" onClick={() => move(i, -1)} disabled={busy || i === 0} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-container disabled:opacity-30" aria-label={`Move photo ${i + 1} earlier`}>
                    <ArrowLeft size={15} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={busy || i === photos.length - 1} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-container disabled:opacity-30" aria-label={`Move photo ${i + 1} later`}>
                    <ArrowRight size={15} />
                  </button>
                </div>
                <div className="flex">
                  {i > 0 && (
                    <button type="button" onClick={() => makeCover(i)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface-container" aria-label={`Use photo ${i + 1} as the cover`} title="Use as cover">
                      <Star size={15} />
                    </button>
                  )}
                  <button type="button" onClick={() => remove(p)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-full text-error hover:bg-error-container" aria-label={`Remove photo ${i + 1}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {photos.length >= MAX && photos.length > 0 && (
        <p className="mt-4 rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
          You’ve added all {MAX} photos{limits?.planName ? ` your ${limits.planName} package includes` : ''}. Remove one to add another.
        </p>
      )}
      {photos.length < MAX && (
        <label className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${uploading ? 'border-gold bg-blush-tint' : 'border-outline-variant bg-ivory hover:border-gold'}`}>
          <ImagePlus size={24} className="text-gold-text" aria-hidden="true" />
          <span className="mt-2 text-title-md text-espresso">{uploading ? `Uploading ${progress.done + 1} of ${progress.total}… ${progress.percent}%` : 'Add photos'}</span>
          {!uploading && <span className="text-body-sm text-on-surface-variant">{MAX - photos.length} more allowed</span>}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,.heic" multiple className="sr-only" disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
        </label>
      )}
      {uploading && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-high" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
          <div className="h-full bg-gold transition-[width]" style={{ width: `${progress.percent}%` }} />
        </div>
      )}
      {error && (
        <p className="mt-3 text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
