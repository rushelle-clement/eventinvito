// The couple's preview of their day plan, exactly as guests will see it: /invitations/<id>/preview/agenda
// (shown even before it's switched on for guests, so they can check it first).

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { api } from '../lib/api'
import FormAlert from '../components/FormAlert'
import AgendaView from '../components/AgendaView'

const BAR_HEIGHT = 56

export default function AgendaPreview() {
  const { id } = useParams()
  const [invitation, setInvitation] = useState(null)
  const [error, setError] = useState('')

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

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[80] border-b border-bone bg-ivory/95 backdrop-blur" style={{ height: BAR_HEIGHT }}>
        <div className="mx-auto flex h-full max-w-5xl items-center gap-3 px-3">
          <Link to={`/invitations/${id}/edit`} className="btn-secondary shrink-0 px-3 py-1.5 text-body-sm">
            <ArrowLeft size={15} aria-hidden="true" /> <span className="hidden sm:inline">Editor</span>
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-body-sm text-on-surface-variant">
            Day plan preview — {invitation.agendaVisible ? 'guests open this from the “Day plan” button on their invitation' : 'switched off: guests can’t see it yet'}
          </p>
        </div>
      </div>
      <AgendaView invitation={invitation} backTo={`/invitations/${id}/preview`} topOffset={BAR_HEIGHT} />
    </>
  )
}
