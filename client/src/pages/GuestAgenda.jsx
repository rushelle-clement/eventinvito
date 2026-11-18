// A guest's day plan: /i/<token>/agenda, opened from the "Day plan" button on their invitation.
// Public — the personal link is the only credential, as on the invitation itself.

import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import AgendaView from '../components/AgendaView'
import { invitationTitle } from '../templates/strings'
import { agendaStrings } from '../lib/agenda'

export default function GuestAgenda() {
  const { token } = useParams()
  const [state, setState] = useState({ status: 'loading' })

  // Keep personal pages out of search engines
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    api(`/invite/${encodeURIComponent(token)}`, { auth: false })
      .then((data) => {
        setState({ status: 'ready', invitation: data.invitation })
        const lang = data.invitation.language
        document.title = `${agendaStrings(lang).title} — ${invitationTitle(data.invitation, lang)}`
      })
      .catch(() => setState({ status: 'error' }))
    return () => {
      document.title = 'EventInvito'
    }
  }, [token])

  const invitationLink = `/i/${encodeURIComponent(token)}`
  if (state.status === 'loading') {
    return (
      <p className="grid min-h-screen place-items-center bg-ivory text-body-md text-on-surface-variant" role="status">
        Opening the day plan…
      </p>
    )
  }
  // Link problems (ended, not valid…) and a plan that isn't shown: the invitation page explains
  if (state.status === 'error' || !state.invitation.agenda?.length) return <Navigate to={invitationLink} replace />

  return <AgendaView invitation={state.invitation} backTo={invitationLink} />
}
