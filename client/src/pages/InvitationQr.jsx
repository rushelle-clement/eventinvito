// The invitation's QR code page (/invitations/:id/qr): the one code for physical cards — switch it on
// or off, download it to print, and see who replied with it. Reached from the Dashboard card and the
// guest list. Premium Plus, Signature and Printed Cards.

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { api } from '../lib/api'
import { formatDate, invitationTitle } from '../templates/strings'
import FormAlert from '../components/FormAlert'
import Loader from '../components/Loader'
import QrPanel from '../components/QrPanel'
import PublishStatus from '../components/PublishStatus'

export default function InvitationQr() {
  const { id } = useParams()
  const [data, setData] = useState(null) // { invitation, guests }
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let alive = true
    api(`/invitations/${id}/guests`)
      .then((d) => alive && setData({ invitation: d.invitation, guests: d.guests || [] }))
      .catch((err) => alive && setLoadError(err.status === 404 ? 'This invitation could not be found.' : err.message))
    return () => {
      alive = false
    }
  }, [id])

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  if (loadError) {
    return (
      <div className="mx-auto max-w-[1200px] px-margin-mobile py-10 md:px-margin">
        <FormAlert>{loadError}</FormAlert>
        <Link to="/dashboard" className="btn-secondary mt-6">
          Back to dashboard
        </Link>
      </div>
    )
  }
  if (!data) return <Loader label="Loading the QR code" />

  const { invitation, guests } = data
  const limits = invitation.limits || {}
  const names = invitationTitle(invitation)
  const physicalOnly = limits.onlineCards === false
  const physical = { total: guests.filter((g) => g.cardType === 'physical').length }
  const viaQr = guests.filter((g) => g.rsvpVia === 'qr' && g.rsvpStatus !== 'pending').length

  return (
    <div className="mx-auto max-w-[1200px] px-margin-mobile py-8 md:px-margin md:py-10">
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant uppercase">
        <Link to="/dashboard" className="hover:text-gold-text">
          Invitations
        </Link>{' '}
        <span className="mx-1">/</span>{' '}
        <Link to={`/invitations/${id}/guests`} className="hover:text-gold-text">
          {names}
        </Link>{' '}
        <span className="mx-1">/</span> <span className="text-gold-text">QR code</span>
      </nav>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">QR Code</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-md text-on-surface-variant">
            {invitation.eventDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={16} aria-hidden="true" /> {formatDate(invitation.eventDate, 'en')}
              </span>
            )}
            {invitation.venueName && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={16} aria-hidden="true" /> {invitation.venueName}
              </span>
            )}
          </p>
        </div>
        <Link to={`/invitations/${id}/guests`} className="btn-secondary self-start sm:self-auto">
          <Users size={16} aria-hidden="true" /> Manage guests
        </Link>
      </div>

      {/* Live or not, with Publish right here */}
      <PublishStatus invitation={invitation} onPublished={(inv) => setData((d) => ({ ...d, invitation: { ...d.invitation, ...inv } }))} />

      <div className="mt-6">
        <FormAlert>{error}</FormAlert>
      </div>

      {limits.qrRsvp ? (
        <QrPanel
          invitation={invitation}
          physical={physical}
          viaQr={viaQr}
          live={invitation.status === 'published'}
          physicalOnly={physicalOnly}
          onSaved={(qr) => {
            setData((d) => ({ ...d, invitation: { ...d.invitation, qr } }))
            setToast(qr.enabled ? 'QR code switched on' : 'QR code switched off')
          }}
          onError={setError}
        />
      ) : (
        <div className="card mt-6 p-6 text-body-md text-on-surface-variant">
          Physical cards with a QR code are part of Premium Plus, Signature and Printed Cards.{' '}
          <a href="/#pricing" className="font-semibold text-gold-text underline underline-offset-4">
            See the packages
          </a>
        </div>
      )}

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status">
          <p className="rounded-full bg-espresso px-5 py-2.5 text-body-sm text-white shadow-lg">{toast}</p>
        </div>
      )}
    </div>
  )
}
