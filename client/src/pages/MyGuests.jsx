// "My Guests" in the top menu: pick which invitation's guest list to open.
// With a single invitation it goes straight there.

import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import { api } from '../lib/api'
import FormAlert from '../components/FormAlert'

export default function MyGuests() {
  const [invitations, setInvitations] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/invitations')
      .then((d) => setInvitations(d.invitations))
      .catch((err) => setError(err.message))
  }, [])

  if (invitations?.length === 1) return <Navigate to={`/invitations/${invitations[0].id}/guests`} replace />

  return (
    <div className="mx-auto max-w-[800px] px-margin-mobile py-10 md:px-margin">
      <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">My Guests</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">Choose an invitation to manage its guest list.</p>
      <div className="mt-6">
        <FormAlert>{error}</FormAlert>
      </div>
      {!invitations && !error && (
        <p className="mt-6 text-body-md text-on-surface-variant" role="status">
          Loading…
        </p>
      )}
      {invitations?.length === 0 && (
        <div className="card mt-6 px-6 py-12 text-center">
          <p className="text-body-md text-on-surface-variant">Create an invitation first, then add your guests.</p>
          <Link to="/templates" className="btn-primary mt-5">
            Choose a design
          </Link>
        </div>
      )}
      {invitations?.length > 1 && (
        <ul className="mt-6 space-y-3">
          {invitations.map((inv) => (
            <li key={inv.id}>
              <Link to={`/invitations/${inv.id}/guests`} className="card flex items-center gap-4 p-5 hover:border-gold">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                  <Users size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-headline-sm text-espresso">
                    {inv.partnerOne || inv.partnerTwo ? `${inv.partnerOne || '…'} & ${inv.partnerTwo || '…'}` : 'Untitled invitation'}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {inv.guestCounts.total} guest{inv.guestCounts.total === 1 ? '' : 's'} · {inv.status}
                  </span>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
