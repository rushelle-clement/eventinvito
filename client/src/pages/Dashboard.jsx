// Host dashboard — layout from the Stitch "Host Dashboard" screen.
// Lists the signed-in user's invitations. Guest and RSVP numbers arrive with Phases 3–4.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, CalendarDays, CalendarHeart, CircleCheck, Eye, MailOpen, MapPin, PencilLine, Plus, Send, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import FormAlert from '../components/FormAlert'
import Modal from '../components/Modal'
import { occasionLabel } from '../templates/strings'
import TemplateThumbnail from '../templates/TemplateThumbnail'
import { formatDate } from '../templates/strings'

const STATUS_STYLES = {
  draft: 'bg-surface-container text-on-surface-variant',
  published: 'bg-[#e3f4e8] text-[#1e6b3a]',
  unpublished: 'bg-blush-tint text-on-tertiary-fixed-variant',
}

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || ''
  const [invitations, setInvitations] = useState(null)
  const [error, setError] = useState('')
  const [archiving, setArchiving] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/invitations')
      .then((d) => setInvitations(d.invitations))
      .catch((err) => setError(err.message))
  }, [])

  async function confirmArchive() {
    setBusy(true)
    try {
      await api(`/invitations/${archiving.id}`, { method: 'DELETE' })
      setInvitations((list) => list.filter((i) => i.id !== archiving.id))
      setArchiving(null)
    } catch (err) {
      setError(err.message)
      setArchiving(null)
    } finally {
      setBusy(false)
    }
  }

  const list = invitations || []
  const stats = [
    { label: 'Total invitations', value: list.length, icon: MailOpen },
    { label: 'Published', value: list.filter((i) => i.status === 'published').length, icon: Send },
    { label: 'Total guests', value: list.reduce((n, i) => n + (i.guestCounts?.total || 0), 0), icon: Users },
    { label: 'Confirmed RSVPs', value: list.reduce((n, i) => n + (i.guestCounts?.attending || 0), 0), icon: CircleCheck },
  ]

  return (
    <div className="mx-auto max-w-[1200px] px-margin-mobile py-10 md:px-margin">
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant uppercase">
        Home <span className="mx-1">/</span> <span className="text-gold-text">Host dashboard</span>
      </nav>

      <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Your Invitations</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
            Welcome back{firstName && `, ${firstName}`}. Create invitations, manage your guests, and follow RSVPs in one place.
          </p>
        </div>
        <Link to="/templates" className="btn-primary self-start md:self-auto">
          <Plus size={18} aria-hidden="true" /> Create New Invitation
        </Link>
      </div>

      <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, note }) => (
          <li key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-3 font-serif text-headline-md text-espresso">{invitations ? value : '–'}</p>
            {note && <p className="mt-1 text-body-sm text-on-surface-variant">{note}</p>}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <FormAlert>{error}</FormAlert>
      </div>

      {!invitations && !error && (
        <p className="mt-10 text-body-md text-on-surface-variant" role="status">
          Loading your invitations…
        </p>
      )}

      {invitations && list.length === 0 && (
        <section className="card mt-8 flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
            <CalendarHeart size={28} />
          </span>
          <h2 className="mt-5 font-serif text-headline-md-mobile text-espresso md:text-headline-md">No invitations yet</h2>
          <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
            Choose one of our templates, add your event details, and preview it before you share it with guests.
          </p>
          <Link to="/templates" className="btn-primary mt-6">
            <Plus size={18} aria-hidden="true" /> Create your first invitation
          </Link>
        </section>
      )}

      {list.length > 0 && (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {list.map((inv) => {
            const names = inv.partnerOne || inv.partnerTwo ? `${inv.partnerOne || '…'} & ${inv.partnerTwo || '…'}` : 'Untitled invitation'
            return (
              <li key={inv.id} className="card flex flex-col overflow-hidden">
                <div className="flex gap-4 p-5">
                  <div className="w-24 shrink-0 overflow-hidden rounded-md border border-bone">
                    <TemplateThumbnail templateKey={inv.templateKey} invitation={inv} height={130} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-label-sm uppercase ${STATUS_STYLES[inv.status] || ''}`}>{inv.status}</span>
                      <span className="text-body-sm text-on-surface-variant">{occasionLabel(inv.eventType)} · {inv.templateName}</span>
                      {inv.tier === 'free' && <span className="rounded-full border border-bone px-2 py-0.5 text-label-sm text-on-surface-variant uppercase">Free</span>}
                    </p>
                    <h2 className="mt-1.5 truncate font-serif text-headline-sm text-espresso">{names}</h2>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={14} aria-hidden="true" /> {inv.eventDate ? formatDate(inv.eventDate, 'en') : 'Date not set'}
                      </span>
                      {inv.venueName && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} aria-hidden="true" /> {inv.venueName}
                        </span>
                      )}
                    </p>
                    {inv.guestCounts?.total > 0 && inv.tier === 'free' && (
                      <p className="mt-3 text-body-sm text-on-surface-variant">{inv.guestCounts.total} invited · free design, no online RSVP</p>
                    )}
                    {inv.guestCounts?.total > 0 && inv.tier !== 'free' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-body-sm text-on-surface-variant">
                          <span>
                            {inv.guestCounts.attending} attending · {inv.guestCounts.not_attending} declined · {inv.guestCounts.pending} awaiting
                          </span>
                          <span>{inv.guestCounts.total} invited</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container-high" aria-hidden="true">
                          <div className="h-full bg-gold" style={{ width: `${(inv.guestCounts.attending / inv.guestCounts.total) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {inv.status === 'draft' && (
                      <p className="mt-2 text-body-sm text-gold-text">
                        {inv.missingForPublish.length ? `${inv.missingForPublish.length} detail${inv.missingForPublish.length === 1 ? '' : 's'} left before publishing` : 'Ready to publish'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-bone bg-surface-container-low px-5 py-3">
                  <Link to={`/invitations/${inv.id}/edit`} className="btn-secondary px-4 py-2 text-body-sm">
                    <PencilLine size={15} aria-hidden="true" /> Edit
                  </Link>
                  <Link to={`/invitations/${inv.id}/preview`} className="btn-secondary px-4 py-2 text-body-sm">
                    <Eye size={15} aria-hidden="true" /> Preview
                  </Link>
                  <Link to={`/invitations/${inv.id}/guests`} className="btn-secondary px-4 py-2 text-body-sm">
                    <Users size={15} aria-hidden="true" /> Guests
                  </Link>
                  <button
                    type="button"
                    onClick={() => setArchiving(inv)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-body-sm text-on-surface-variant hover:bg-blush-tint hover:text-espresso"
                  >
                    <Archive size={15} aria-hidden="true" /> Archive
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {archiving && (
        <Modal
          title="Archive this invitation?"
          onClose={() => !busy && setArchiving(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setArchiving(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={confirmArchive} disabled={busy}>
                {busy ? 'Archiving…' : 'Archive'}
              </button>
            </>
          }
        >
          <p className="px-5 py-5 text-body-md text-on-surface-variant">
            It will be removed from your dashboard and can no longer be edited. Nothing is permanently deleted.
          </p>
        </Modal>
      )}
    </div>
  )
}
