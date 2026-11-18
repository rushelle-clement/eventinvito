// Host dashboard — layout from the Stitch "Host Dashboard" screen.
// Lists the signed-in user's invitations. Guest and RSVP numbers arrive with Phases 3–4.

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Archive, CalendarDays, CalendarHeart, CircleCheck, Eye, MailOpen, MapPin, PencilLine, Plus, Printer, QrCode, Send, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import FormAlert from '../components/FormAlert'
import Modal from '../components/Modal'
import { invitationTitle, occasionLabel } from '../templates/strings'
import TemplateThumbnail from '../templates/TemplateThumbnail'
import { formatDate } from '../templates/strings'

// Printed Cards: what the event is (it decides which names the invitation asks for)
const PRINTED_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'homecoming', label: 'Homecoming' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'corporate', label: 'Corporate event' },
  { value: 'christmas', label: 'Christmas party' },
]

// Start a Printed Cards invitation: paper cards with one QR code, no online design
function PrintedModal({ onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [eventType, setEventType] = useState('wedding')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const credits = user?.printedCredits || 0

  async function create() {
    setBusy(true)
    setError('')
    try {
      const d = await api('/invitations', { method: 'POST', body: { printed: true, eventType } })
      navigate(`/invitations/${d.invitation.id}/edit`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Printed cards with a QR code"
      onClose={() => !busy && onClose()}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={create} disabled={busy}>
            {busy ? 'Starting…' : 'Continue'}
          </button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-5">
        <FormAlert>{error}</FormAlert>
        <p className="text-body-md text-on-surface-variant">
          For invitations you print yourself. You get one QR code to put on every card; guests scan it, find their name and reply. There’s no online invitation design.
        </p>
        <fieldset>
          <legend className="mb-2 text-label-md text-espresso uppercase">What are you celebrating?</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRINTED_TYPES.map((t) => (
              <label
                key={t.value}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-body-md has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${eventType === t.value ? 'border-gold bg-gold/10 text-espresso' : 'border-bone bg-white text-on-surface-variant hover:border-gold'}`}
              >
                <input type="radio" name="printed-type" value={t.value} checked={eventType === t.value} onChange={() => setEventType(t.value)} className="sr-only" />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <p className="rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
          {credits > 0
            ? `You have ${credits} Printed Cards invitation${credits === 1 ? '' : 's'} to publish. Drafts are free.`
            : 'Drafts are free. Publishing needs the Printed Cards package (Rs. 500): contact us when you’re ready.'}
        </p>
      </div>
    </Modal>
  )
}

const STATUS_STYLES = {
  draft: 'bg-surface-container text-on-surface-variant',
  published: 'bg-[#e3f4e8] text-[#1e6b3a]',
  unpublished: 'bg-blush-tint text-on-tertiary-fixed-variant',
  ended: 'bg-surface-container-high text-on-surface-variant',
}

export default function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || ''
  const [invitations, setInvitations] = useState(null)
  const [error, setError] = useState('')
  const [archiving, setArchiving] = useState(null)
  const [busy, setBusy] = useState(false)
  const [printedOpen, setPrintedOpen] = useState(false)
  // Just reset their password (ResetPassword sends them here)
  const passwordChanged = Boolean(useLocation().state?.passwordChanged)

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
      {passwordChanged && (
        <p className="mb-6 flex items-center gap-2 rounded-lg border border-gold/40 bg-blush-tint px-4 py-3 text-body-md text-espresso" role="status">
          <CircleCheck size={18} className="shrink-0 text-gold-text" aria-hidden="true" /> Your password has been changed, and you’re signed in.
        </p>
      )}
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant uppercase">
        Home <span className="mx-1">/</span> <span className="text-gold-text">Host dashboard</span>
      </nav>

      <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Your Invitations</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
            Welcome back{firstName && `, ${firstName}`}. Create invitations, manage your guests, and follow RSVPs in one place.
          </p>
          {user?.role !== 'admin' && (
            <p className="mt-2 text-body-sm text-gold-text">
              Free card: {user?.freeCredits || 0} left · Premium invitations: {user?.publishCredits || 0} left
              {user?.printedCredits > 0 && ` · Printed cards: ${user.printedCredits} left`} · Drafts are free
              {!(user?.freeCredits || user?.publishCredits || user?.printedCredits) && ' · Contact us to upgrade'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 self-start md:self-auto">
          <button type="button" className="btn-secondary" onClick={() => setPrintedOpen(true)}>
            <Printer size={17} aria-hidden="true" /> Printed cards (QR)
          </button>
          <Link to="/templates" className="btn-primary">
            <Plus size={18} aria-hidden="true" /> Create New Invitation
          </Link>
        </div>
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
          <button type="button" className="mt-3 text-body-sm text-gold-text underline underline-offset-4" onClick={() => setPrintedOpen(true)}>
            Printing your cards? Get a QR code for replies instead
          </button>
        </section>
      )}

      {list.length > 0 && (
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {list.map((inv) => {
            const status = inv.status === 'published' && inv.ended ? 'ended' : inv.status
            const names = inv.partnerOne || inv.partnerTwo || inv.celebrant ? invitationTitle(inv) : 'Untitled invitation'
            return (
              <li key={inv.id} className="card flex flex-col overflow-hidden">
                <div className="flex gap-4 p-5">
                  {inv.printed ? (
                    <div className="grid h-[130px] w-24 shrink-0 place-items-center rounded-md border border-bone bg-ivory text-gold-text" aria-hidden="true">
                      <QrCode size={40} strokeWidth={1.5} />
                    </div>
                  ) : (
                    <div className="w-24 shrink-0 overflow-hidden rounded-md border border-bone">
                      <TemplateThumbnail templateKey={inv.templateKey} invitation={inv} height={130} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-label-sm uppercase ${STATUS_STYLES[status] || ''}`}>{status}</span>
                      <span className="text-body-sm text-on-surface-variant">{occasionLabel(inv.eventType)} · {inv.printed ? 'Printed cards with QR' : inv.templateName}</span>
                      {inv.tier === 'free' && !inv.printed && <span className="rounded-full border border-bone px-2 py-0.5 text-label-sm text-on-surface-variant uppercase">Free</span>}
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
                    {inv.guestCounts?.total > 0 && (
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
                        {inv.status === 'published' && !inv.printed && (
                          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
                            <span className="inline-flex items-center gap-1.5">
                              <Eye size={14} aria-hidden="true" /> {inv.guestCounts.opened || 0} of {inv.guestCounts.total} opened
                            </span>
                            {/* "Opened, no reply" is a Premium filter */}
                            {inv.limits?.openDetails && inv.guestCounts.openedNoReply > 0 && (
                              <Link to={`/invitations/${inv.id}/guests?filter=opened_no_reply`} className="font-semibold text-gold-text underline-offset-2 hover:underline">
                                {inv.guestCounts.openedNoReply} opened but haven’t replied
                              </Link>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                    {inv.status === 'published' && inv.onlineUntil && (
                      <p className="mt-2 text-body-sm text-on-surface-variant">
                        {inv.ended
                          ? `Ended on ${formatDate(inv.onlineUntil, 'en')}`
                          : inv.printed
                            ? `QR replies open until ${formatDate(inv.rsvpDeadline, 'en')}`
                            : `Online until ${formatDate(inv.onlineUntil, 'en')}`}
                      </p>
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
                  {!inv.printed && (
                    <Link to={`/invitations/${inv.id}/preview`} className="btn-secondary px-4 py-2 text-body-sm">
                      <Eye size={15} aria-hidden="true" /> Preview
                    </Link>
                  )}
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

      {printedOpen && <PrintedModal onClose={() => setPrintedOpen(false)} />}

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
