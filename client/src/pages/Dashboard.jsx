// Host dashboard — layout from the Stitch "Host Dashboard" screen.
// Lists the signed-in user's invitations. Guest and RSVP numbers arrive with Phases 3–4.

import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Archive, CalendarDays, CalendarHeart, CircleCheck, Eye, MailOpen, MapPin, PencilLine, Plus, Printer, QrCode, Send, Users } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import FormAlert from '../components/FormAlert'
import Modal from '../components/Modal'
import { invitationTitle, occasionLabel } from '../templates/strings'
import TemplateThumbnail from '../templates/TemplateThumbnail'
import { formatDate } from '../templates/strings'
import Loader from '../components/Loader'
import { publishCredit } from '../lib/publishCredit'
import { isPrintedOnly, qrLockNote } from '../lib/accountPlan'
import PublishStatus from '../components/PublishStatus'
import { siteUrl } from '../lib/siteUrl'
import { qrInitials } from '../lib/qrStrings'
import { drawQr } from '../lib/qrImage'
import { SIGNUP_PACKAGES, packageOf, paymentHref } from '../lib/packages'
import { useSiteConfig } from '../lib/siteConfig'
import ContactLine from '../components/ContactLine'

// The package chosen at sign-up, waiting for payment: how to pay, and a way to change it until then
function WaitingPackage({ user, usedFreeCard, onChanged }) {
  const pkg = packageOf(user.requestedPlan)
  const { contact } = useSiteConfig()
  const [changing, setChanging] = useState(false)
  const [choice, setChoice] = useState(user.requestedPlan)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!pkg) return null
  const href = paymentHref(contact, pkg, user)

  async function save() {
    setBusy(true)
    setError('')
    try {
      const d = await api('/auth/me/package', { method: 'PATCH', body: { package: choice } })
      onChanged(d.user)
      setChanging(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-gold/40 bg-blush-tint px-5 py-5 sm:px-6" aria-labelledby="waiting-h">
      <p className="text-label-sm text-gold-text uppercase">Waiting for payment</p>
      <h2 id="waiting-h" className="mt-1 font-serif text-headline-sm text-espresso">
        Your {pkg.name} package · {pkg.price}
      </h2>
      <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
        {pkg.key === 'printed'
          ? 'You can set up your printed cards now: your event details and guest list. Your QR code can be downloaded, and replies open, once we’ve received your payment.'
          : 'You can set up your invitation now: choose a design, add your details and guests. You can publish it once we’ve received your payment.'}{' '}
        Send us a message to pay, and we’ll activate your package, usually within a day.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5 text-body-md">
            Pay for {pkg.name}
          </a>
        ) : (
          <ContactLine className="text-body-md" />
        )}
        {!changing && (
          <button type="button" className="text-body-sm font-semibold text-gold-text underline underline-offset-4" onClick={() => setChanging(true)}>
            Change package
          </button>
        )}
      </div>
      {changing && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="change-package">
            Package
          </label>
          <select
            id="change-package"
            className="rounded-lg border border-bone bg-white px-3 py-2 text-body-md text-espresso outline-none focus:border-gold"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
          >
            {/* After the free online card was used, paper cards too means Premium Plus */}
            {SIGNUP_PACKAGES.filter((p) => !(usedFreeCard && p.key === 'printed' && user.requestedPlan !== 'printed')).map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} · {p.price}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary px-4 py-2 text-body-sm" onClick={save} disabled={busy || choice === user.requestedPlan}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn-secondary px-4 py-2 text-body-sm" onClick={() => setChanging(false)} disabled={busy}>
            Cancel
          </button>
          {choice === 'printed' && user.requestedPlan !== 'printed' && (
            <p className="basis-full text-body-sm text-on-surface-variant">Printed Cards are paper cards only, without an online card.</p>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-body-sm text-error">{error}</p>}
    </section>
  )
}

// A small picture of an invitation's QR code, for its card
function QrThumb({ invitation }) {
  const ref = useRef(null)
  const code = invitation.qr?.code
  useEffect(() => {
    if (code && ref.current) drawQr(ref.current, `${siteUrl()}/r/${code}`, qrInitials(invitation), 160)
  }, [code, invitation])
  return <canvas ref={ref} className="h-14 w-14 shrink-0 rounded border border-bone bg-white" aria-hidden="true" />
}

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
          For invitations you print yourself. You get one QR code to put on every card; guests scan it, find their name and reply. Guests without a paper card can reply with the same link on WhatsApp.
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
            : user?.requestedPlan === 'printed'
              ? 'Your Printed Cards package is waiting for payment. You can set everything up now and publish once it’s activated.'
              : 'You’ve used your Printed Cards package. Drafts are free; publishing another one needs the package again (Rs. 1,000).'}
        </p>
      </div>
    </Modal>
  )
}

// Printed Cards: the four steps, each with where it stands and where to do it
function PrintedSteps({ inv, user, onPublished }) {
  const missing = inv.missingForPublish?.length || 0
  const total = inv.guestCounts?.total || 0
  const live = inv.status === 'published' && !inv.ended
  const steps = [
    {
      done: !missing,
      title: 'Event details',
      note: missing ? `${missing} to fill in` : 'Done',
      to: `/invitations/${inv.id}/edit`,
    },
    {
      done: total > 0,
      title: 'Guest list',
      note: total ? `${total} guest${total === 1 ? '' : 's'}` : 'Add or import your guests',
      to: `/invitations/${inv.id}/guests`,
    },
    {
      done: !inv.qr?.locked,
      title: 'QR code',
      note: inv.qr?.locked ? qrLockNote(user).short : 'Ready to download and print',
      to: `/invitations/${inv.id}/qr`,
    },
    {
      done: live,
      title: 'Replies',
      note: live
        ? `${inv.guestCounts?.viaQr || 0} by QR · open until ${formatDate(inv.rsvpDeadline, 'en')}`
        : inv.ended
          ? 'Closed'
          : 'Publish to open the QR reply page',
      to: `/invitations/${inv.id}/edit`,
      action: !live && !inv.ended && <PublishStatus invitation={inv} onPublished={onPublished} compact />,
    },
  ]
  return (
    <ol className="mt-3 divide-y divide-bone rounded-lg border border-bone bg-white">
      {steps.map((st, i) => (
        <li key={st.title}>
          <div className="flex items-center gap-2 pr-3 hover:bg-surface-container-low">
          <Link to={st.to} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-label-sm ${st.done ? 'bg-[#e3f4e8] text-[#1e6b3a]' : 'bg-surface-container text-on-surface-variant'}`}
              aria-hidden="true"
            >
              {st.done ? <CircleCheck size={15} /> : i + 1}
            </span>
            <span className="min-w-0 flex-1 text-body-sm">
              <span className="block font-semibold text-espresso">{st.title}</span>
              <span className="block text-on-surface-variant">{st.note}</span>
            </span>
            <span className="sr-only">{st.done ? 'done' : 'to do'}</span>
          </Link>
          {st.action}
          </div>
        </li>
      ))}
    </ol>
  )
}

const STATUS_STYLES = {
  draft: 'bg-surface-container text-on-surface-variant',
  published: 'bg-[#e3f4e8] text-[#1e6b3a]',
  unpublished: 'bg-blush-tint text-on-tertiary-fixed-variant',
  ended: 'bg-surface-container-high text-on-surface-variant',
}

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const firstName = user?.name?.split(' ')[0] || ''
  const [invitations, setInvitations] = useState(null)
  const [error, setError] = useState('')
  const [archiving, setArchiving] = useState(null)
  const [busy, setBusy] = useState(false)
  const [printedOpen, setPrintedOpen] = useState(false)
  // Printed Cards is a package the admin turns on; Premium Plus and Signature have QR on their own invitations
  // (or chose it when signing up, while it waits for payment)
  // Not for Premium (a QR code is Premium Plus), nor after the free online card was used (paper and
  // online cards together are Premium Plus too)
  const usedFreeCard = (invitations || []).some((i) => i.paidKind === 'free')
  const canPrint =
    user?.role === 'admin' ||
    user?.requestedPlan === 'printed' ||
    (!['premium', 'plus', 'signature'].includes(user?.plan) &&
      !['premium', 'plus', 'signature'].includes(user?.requestedPlan) &&
      !usedFreeCard &&
      (user?.printedMember || (user?.printedCredits || 0) > 0 || (invitations || []).some((i) => i.printed && i.paidKind === 'printed')))
  // A Printed Cards account: paper cards only (no free online card), so printed cards come first
  const printedOnly = isPrintedOnly(user)
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
      {user?.requestedPlan && user.role !== 'admin' && <WaitingPackage key={user.requestedPlan} user={user} usedFreeCard={usedFreeCard} onChanged={updateUser} />}
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant uppercase">
        Home <span className="mx-1">/</span> <span className="text-gold-text">Host dashboard</span>
      </nav>

      <div className="mt-3 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Your Invitations</h1>
          <p className="mt-2 max-w-xl text-body-md text-on-surface-variant">
            Welcome back{firstName && `, ${firstName}`}. Create invitations, manage your guests, and follow RSVPs in one place.
          </p>
          {user?.role !== 'admin' && !user?.requestedPlan && (
            <p className="mt-2 text-body-sm text-gold-text">
              {printedOnly
                ? `Printed cards: ${user?.printedCredits || 0} left`
                : `Free card: ${user?.freeCredits || 0} left · Premium invitations: ${user?.publishCredits || 0} left${user?.printedCredits > 0 ? ` · Printed cards: ${user.printedCredits} left` : ''}`}{' '}
              · Drafts are free
              {!(user?.freeCredits || user?.publishCredits || user?.printedCredits) && ' · Contact us to upgrade'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 self-start md:self-auto">
          {canPrint && (
            <button type="button" className={printedOnly ? 'btn-primary' : 'btn-secondary'} onClick={() => setPrintedOpen(true)}>
              <Printer size={17} aria-hidden="true" /> New printed cards (QR)
            </button>
          )}
          {!printedOnly && (
            <Link to="/templates" className="btn-primary">
              <Plus size={18} aria-hidden="true" /> Create New Invitation
            </Link>
          )}
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
        <Loader label="Loading your invitations" />
      )}

      {invitations && list.length === 0 && (
        <section className="card mt-8 flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
            <CalendarHeart size={28} />
          </span>
          <h2 className="mt-5 font-serif text-headline-md-mobile text-espresso md:text-headline-md">No invitations yet</h2>
          <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
            {printedOnly
              ? 'Start your printed cards: add your event details and your guest list, then print the QR code on every card.'
              : 'Choose one of our templates, add your event details, and preview it before you share it with guests.'}
          </p>
          {printedOnly ? (
            <button type="button" className="btn-primary mt-6" onClick={() => setPrintedOpen(true)}>
              <Printer size={18} aria-hidden="true" /> Start your printed cards
            </button>
          ) : (
            <Link to="/templates" className="btn-primary mt-6">
              <Plus size={18} aria-hidden="true" /> Create your first invitation
            </Link>
          )}
          {canPrint && !printedOnly && (
            <button type="button" className="mt-3 text-body-sm text-gold-text underline underline-offset-4" onClick={() => setPrintedOpen(true)}>
              Printing your cards? Start your printed cards with a QR code
            </button>
          )}
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
                    <div className="grid h-[130px] w-24 shrink-0 place-items-center self-start rounded-md border border-bone bg-ivory text-gold-text" aria-hidden="true">
                      <QrCode size={40} strokeWidth={1.5} />
                    </div>
                  ) : (
                    <div className="w-24 shrink-0 self-start overflow-hidden rounded-md border border-bone">
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
                        <div className="flex flex-wrap justify-between gap-x-3 text-body-sm text-on-surface-variant">
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
                    {/* Its QR code for physical cards, once there is one */}
                    {inv.printed && (
                      <PrintedSteps
                        inv={inv}
                        user={user}
                        onPublished={(next) => setInvitations((list) => list.map((i) => (i.id === next.id ? { ...i, ...next, guestCounts: i.guestCounts } : i)))}
                      />
                    )}
                    {!inv.printed && inv.limits?.qrRsvp && inv.qr?.enabled && (
                      <Link to={`/invitations/${inv.id}/qr`} className="mt-3 flex items-center gap-3 rounded-lg border border-bone bg-white p-2 pr-3 hover:border-gold">
                        {inv.qr.locked ? (
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded border border-bone bg-blush-tint text-gold-text" aria-hidden="true">
                            <QrCode size={22} />
                          </span>
                        ) : (
                          <QrThumb invitation={inv} />
                        )}
                        <span className="min-w-0 flex-1 text-body-sm">
                          <span className="block font-semibold text-espresso">QR code for physical cards</span>
                          <span className="block text-on-surface-variant">
                            {inv.qr.locked ? qrLockNote(user).short : `${inv.guestCounts?.viaQr || 0} replied by QR`}
                          </span>
                        </span>
                        <span className="shrink-0 text-body-sm font-semibold text-gold-text">Open</span>
                      </Link>
                    )}
                    {!inv.printed && inv.status === 'published' && inv.onlineUntil && (
                      <p className="mt-2 text-body-sm text-on-surface-variant">
                        {inv.ended
                          ? `Ended on ${formatDate(inv.onlineUntil, 'en')}`
                          : inv.printed
                            ? `QR replies open until ${formatDate(inv.rsvpDeadline, 'en')}`
                            : `Online until ${formatDate(inv.onlineUntil, 'en')}`}
                      </p>
                    )}
                    {!inv.printed && inv.status !== 'published' && (() => {
                      // Not live: what's left before it can be published — details, or a package
                      const credit = publishCredit({ printed: inv.printed, paid: inv.paid, paidKind: inv.paidKind, freeDesign: inv.tier === 'free' }, user)
                      const missing = inv.missingForPublish.length
                      if (inv.status === 'unpublished' && !credit.blocked && !missing) return null
                      return (
                        <p className="mt-2 text-body-sm text-gold-text">
                          {missing ? `${missing} detail${missing === 1 ? '' : 's'} left before publishing` : !credit.blocked && 'Ready to publish'}
                          {credit.blocked && (
                            <>
                              {missing ? ' · ' : ''}
                              {credit.short}.{' '}
                              {!credit.waiting && (
                                <a href="/#pricing" className="font-semibold underline underline-offset-2">
                                  See the packages
                                </a>
                              )}
                            </>
                          )}
                        </p>
                      )
                    })()}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-bone bg-surface-container-low px-5 py-3">
                  <Link to={`/invitations/${inv.id}/edit`} className="btn-secondary px-4 py-2 text-body-sm">
                    <PencilLine size={15} aria-hidden="true" /> {inv.printed ? 'Event details' : 'Edit'}
                  </Link>
                  {!inv.printed && (
                    <Link to={`/invitations/${inv.id}/preview`} className="btn-secondary px-4 py-2 text-body-sm">
                      <Eye size={15} aria-hidden="true" /> Preview
                    </Link>
                  )}
                  <Link to={`/invitations/${inv.id}/guests`} className="btn-secondary px-4 py-2 text-body-sm">
                    <Users size={15} aria-hidden="true" /> Guests
                  </Link>
                  {inv.printed && (
                    <Link to={`/invitations/${inv.id}/qr`} className="btn-secondary px-4 py-2 text-body-sm">
                      <QrCode size={15} aria-hidden="true" /> QR code
                    </Link>
                  )}
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
