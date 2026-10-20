// Full-page preview of an invitation exactly as a guest will see it, including the
// opening animation and music (FR-024). Only the owner can open this.

import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { api } from '../lib/api'
import FormAlert from '../components/FormAlert'
import InvitationExperience from '../templates/experience/InvitationExperience'
import { sampleGuestName } from '../templates/strings'

const BAR_HEIGHT = 56

export default function InvitationPreview() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')
  const [run, setRun] = useState(0) // changing this replays the opening

  useEffect(() => {
    api(`/invitations/${id}`)
      .then((d) => setInvitation(d.invitation))
      .catch((err) => setError(err.status === 404 ? 'This invitation could not be found.' : err.message))
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-margin-mobile py-16 text-center">
        <FormAlert>{error}</FormAlert>
        <Link to="/dashboard" className="btn-secondary mt-6">
          Back to dashboard
        </Link>
      </div>
    )
  }

  if (!invitation) {
    return (
      <p className="py-20 text-center text-body-md text-on-surface-variant" role="status">
        Loading preview…
      </p>
    )
  }

  const guest = params.get('guest') ?? sampleGuestName(invitation.language)

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[80] border-b border-bone bg-ivory/95 backdrop-blur" style={{ height: BAR_HEIGHT }}>
        <div className="mx-auto flex h-full max-w-5xl items-center gap-2 px-3 sm:gap-3">
          <Link to={`/invitations/${id}/edit`} className="btn-secondary shrink-0 px-3 py-1.5 text-body-sm">
            <ArrowLeft size={15} aria-hidden="true" /> <span className="hidden sm:inline">Editor</span>
          </Link>
          <button type="button" onClick={() => setRun((n) => n + 1)} className="btn-secondary shrink-0 px-3 py-1.5 text-body-sm">
            <RotateCcw size={15} aria-hidden="true" /> <span className="hidden sm:inline">Replay opening</span>
          </button>
          <p className="hidden flex-1 truncate text-center text-body-sm text-on-surface-variant md:block">
            Preview — {invitation.status === 'published' ? 'guests see this through their personal links' : 'guests can’t see this until it’s published'}
          </p>
          <label className="ml-auto flex min-w-0 items-center gap-2 text-body-sm text-on-surface-variant">
            <span className="hidden sm:inline">As</span>
            <input
              value={guest}
              onChange={(e) => setParams({ guest: e.target.value }, { replace: true })}
              maxLength={60}
              className="w-32 min-w-0 rounded-full border border-bone bg-white px-3 py-1.5 text-body-sm outline-none focus:border-gold sm:w-40"
              aria-label="Guest name for preview"
            />
          </label>
        </div>
      </div>

      <InvitationExperience key={run} invitation={invitation} guestName={guest.trim()} topOffset={BAR_HEIGHT} />
    </>
  )
}
