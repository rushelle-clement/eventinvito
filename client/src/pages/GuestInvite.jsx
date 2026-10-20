// The page a guest sees when they open their personal link: /i/<token>
// Shows the animated invitation with their name on it (FR-043). Public — no sign-in, no site menu.

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { LinkIcon, Clock } from 'lucide-react'
import { api } from '../lib/api'
import InvitationExperience from '../templates/experience/InvitationExperience'
import RsvpForm from '../templates/RsvpForm'

function StatePage({ icon: Icon, title, message }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-margin-mobile py-16 text-center">
      <div className="card max-w-md px-8 py-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
          <Icon size={24} />
        </span>
        <h1 className="mt-5 font-serif text-headline-sm text-espresso">{title}</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">{message}</p>
        <p className="mt-8 font-serif text-body-md text-espresso">
          EventInvito<span className="text-gold">.</span>
        </p>
      </div>
    </main>
  )
}

export default function GuestInvite() {
  const { token } = useParams()
  const [state, setState] = useState({ status: 'loading' })

  // Keep personal invitation pages out of search engines
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
        setState({ status: 'ready', ...data })
        const { partnerOne, partnerTwo } = data.invitation
        document.title = `${partnerOne} & ${partnerTwo} — Invitation`
      })
      .catch((err) => setState({ status: 'error', code: err.status === 403 ? 'not_published' : err.status === 404 ? 'invalid' : 'other', message: err.message }))
    return () => {
      document.title = 'EventInvito'
    }
  }, [token])

  if (state.status === 'loading') {
    return (
      <p className="grid min-h-screen place-items-center bg-ivory text-body-md text-on-surface-variant" role="status">
        Opening your invitation…
      </p>
    )
  }

  if (state.status === 'error') {
    if (state.code === 'invalid') return <StatePage icon={LinkIcon} title="This link isn’t valid" message={state.message} />
    if (state.code === 'not_published') return <StatePage icon={Clock} title="Not available right now" message={state.message} />
    return <StatePage icon={Clock} title="Something went wrong" message={state.message} />
  }

  const { invitation, guest, rsvp } = state
  const setRsvp = (next) => setState((s) => ({ ...s, rsvp: next }))

  return (
    <InvitationExperience
      invitation={invitation}
      guestName={guest.name}
      rsvp={<RsvpForm token={token} invitation={invitation} rsvp={rsvp} onChange={setRsvp} />}
    />
  )
}
