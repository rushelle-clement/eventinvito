// Public demo of a template: the real animated invitation with sample details and music,
// opened from "Preview" in the Explore Invitations gallery.

import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import InvitationExperience from '../templates/experience/InvitationExperience'
import { THEMES, sampleInvitation } from '../templates/themes'
import { OCCASIONS, sampleGuestName } from '../templates/strings'
import { SUGGESTED_TRACK } from '../templates/music'

const BAR_HEIGHT = 56

export default function TemplateDemo() {
  const { key } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const occasion = OCCASIONS.some((o) => o.value === params.get('occasion')) ? params.get('occasion') : 'wedding'
  const [run, setRun] = useState(0)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  // Custom designs (custom: true in themes.js) stay private to their couple until they join the
  // collection, so the server decides whether this visitor may see one
  const [allowed, setAllowed] = useState(!THEMES[key]?.custom)
  useEffect(() => {
    if (!THEMES[key]?.custom) return
    let alive = true
    api(`/templates/${key}`)
      .then(() => alive && setAllowed(true))
      .catch(() => alive && setAllowed(false))
    return () => {
      alive = false
    }
  }, [key, user?.id])

  if (!THEMES[key] || !allowed) {
    return (
      <div className="mx-auto max-w-xl px-margin-mobile py-16 text-center">
        <p className="text-body-md text-on-surface-variant">This design doesn’t exist.</p>
        <Link to="/templates" className="btn-secondary mt-6">
          Back to designs
        </Link>
      </div>
    )
  }

  const invitation = { ...sampleInvitation(key, occasion), musicTrack: SUGGESTED_TRACK[key] || '' }
  // Birthday designs are only for birthdays, so there's no occasion to choose
  const birthday = Boolean(THEMES[key].birthday)

  async function useDesign() {
    if (!user) {
      navigate('/signin', { state: { from: '/templates' } })
      return
    }
    setCreating(true)
    try {
      const data = await api('/invitations', { method: 'POST', body: { templateKey: key, ...(!birthday && { eventType: occasion }) } })
      navigate(`/invitations/${data.invitation.id}/edit`)
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[80] border-b border-bone bg-ivory/95 backdrop-blur" style={{ height: BAR_HEIGHT }}>
        <div className="mx-auto flex h-full max-w-5xl items-center gap-2 px-3 sm:gap-3">
          <Link to="/templates" className="btn-secondary shrink-0 px-3 py-1.5 text-body-sm">
            <ArrowLeft size={15} aria-hidden="true" /> <span className="hidden sm:inline">All designs</span>
          </Link>
          <button type="button" onClick={() => setRun((n) => n + 1)} className="btn-secondary shrink-0 px-3 py-1.5 text-body-sm">
            <RotateCcw size={15} aria-hidden="true" /> <span className="hidden sm:inline">Replay</span>
          </button>
          {birthday ? (
            <span className="flex-1 sm:flex-none" />
          ) : (
          <select
            aria-label="Occasion"
            value={occasion}
            onChange={(e) => setParams({ occasion: e.target.value }, { replace: true })}
            className="w-0 min-w-0 flex-1 rounded-full border border-bone bg-white py-1.5 pr-7 pl-3 text-body-sm text-espresso outline-none focus:border-gold sm:w-auto sm:max-w-[170px] sm:flex-none"
          >
            {OCCASIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          )}
          <p className="hidden flex-1 truncate text-center text-body-sm text-on-surface-variant md:block">{error || 'Sample invitation — your own names, photos and details go here'}</p>
          <button type="button" onClick={useDesign} disabled={creating} className="btn-primary ml-auto shrink-0 px-3 py-1.5 text-body-sm sm:px-4">
            {creating ? 'Creating…' : 'Use this design'}
          </button>
        </div>
      </div>
      <InvitationExperience key={`${key}-${occasion}-${run}`} invitation={invitation} guestName={sampleGuestName(invitation.language)} topOffset={BAR_HEIGHT} />
    </>
  )
}
