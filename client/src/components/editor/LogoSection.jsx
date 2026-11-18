// Editor: the company logo for a corporate invitation (every package, free cards included).
// One logo per invitation; uploading a new one replaces it. A PNG with a transparent background
// looks best: dark designs show it on a light plate so any colours stay readable.

import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { api } from '../../lib/api'
import { uploadToCloudinary } from '../../lib/cloudinaryUpload'

const FORMATS = ['png', 'jpg', 'jpeg', 'webp']
const MAX_BYTES = 2 * 1024 * 1024

export default function LogoSection({ invitationId, logo, onChange, logoStyle = 'original', onStyle }) {
  const inputRef = useRef(null)
  const [percent, setPercent] = useState(null)
  const [error, setError] = useState('')

  async function handleFile(file) {
    if (!file) return
    setError('')
    try {
      const { upload } = await api(`/invitations/${invitationId}/logo/signature`, { method: 'POST' })
      // Logos: PNG, JPG or WebP up to 2 MB (no SVG, which can carry scripts)
      const result = await uploadToCloudinary({ ...upload, allowedFormats: FORMATS, maxBytes: MAX_BYTES }, file, setPercent)
      const data = await api(`/invitations/${invitationId}/logo`, { method: 'POST', body: result })
      onChange(data.logo)
    } catch (err) {
      setError(err.message)
    } finally {
      setPercent(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove() {
    setError('')
    try {
      await api(`/invitations/${invitationId}/logo`, { method: 'DELETE' })
      onChange(null)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-label-md text-espresso">Company logo</p>
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-bone bg-white p-4">
        {/* the logo on light and dark, as the designs show it */}
        <div className="flex gap-2" aria-hidden={!logo}>
          <span className="grid h-20 w-28 place-items-center rounded-md border border-bone bg-[repeating-conic-gradient(#f3f0ea_0%_25%,#fff_0%_50%)] bg-[length:14px_14px] p-2">
            {logo ? <img src={logo.url} alt="Your logo" className="max-h-full max-w-full object-contain" /> : <ImagePlus size={22} className="text-on-surface-variant" />}
          </span>
          {logo && (
            <span className="grid h-20 w-28 place-items-center rounded-md bg-[#141414] p-2">
              <span className="grid h-full w-full place-items-center rounded bg-white/95 p-1.5">
                <img src={logo.url} alt="" className="max-h-full max-w-full object-contain" />
              </span>
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm text-on-surface-variant">PNG with a transparent background works best (JPG and WebP too), up to 2 MB. It appears on every design.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn-secondary px-4 py-2 text-body-sm" onClick={() => inputRef.current?.click()} disabled={percent !== null}>
              <ImagePlus size={15} aria-hidden="true" /> {percent !== null ? `Uploading… ${percent}%` : logo ? 'Replace logo' : 'Upload logo'}
            </button>
            {logo && (
              <button type="button" className="rounded-full px-3 py-2 text-body-sm text-error hover:bg-error-container" onClick={remove}>
                <Trash2 size={15} className="mr-1 inline" aria-hidden="true" /> Remove
              </button>
            )}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} tabIndex={-1} aria-hidden="true" />
      </div>
      {logo && onStyle && (
        <fieldset className="mt-3">
          <legend className="mb-1.5 text-body-sm text-espresso">Logo colours</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              ['original', 'Original colours', 'As you uploaded it. On dark designs it sits on a light plate.'],
              ['mono', 'Match the design', 'One colour from the design (gold, silver…). Best with a transparent PNG.'],
            ].map(([value, label, hint]) => (
              <label key={value} className={`cursor-pointer rounded-lg border px-3 py-2.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${logoStyle === value ? 'border-gold bg-blush-tint' : 'border-bone bg-white'}`}>
                <input type="radio" name="logoStyle" value={value} checked={logoStyle === value} onChange={() => onStyle(value)} className="sr-only" />
                <span className="block text-body-sm font-semibold text-espresso">{label}</span>
                <span className="block text-body-sm text-on-surface-variant">{hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {error && (
        <p className="mt-1.5 text-body-sm text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
