// Manage Guests — guest list, personal links and sharing for one invitation
// (based on the Stitch "Manage Guests" screen). FR-035, FR-040 – FR-046.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  Download,
  Check,
  CircleCheck,
  CircleSlash,
  Copy,
  Hourglass,
  Link2,
  MapPin,
  MessageSquareText,
  MoreHorizontal,
  PencilLine,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Info,
  SkipForward,
  PartyPopper,
} from 'lucide-react'
import { api } from '../lib/api'
import { buildShareText, copyText, toWhatsAppNumber, whatsAppUrl } from '../lib/share'
import FormAlert from '../components/FormAlert'
import Modal from '../components/Modal'
import { downloadGuestList } from '../lib/guestExport'
import { STRINGS, formatDate, invitationTitle, stringsFor } from '../templates/strings'

const RSVP = {
  attending: { label: 'Attending', Icon: CircleCheck, className: 'bg-[#e3f4e8] text-[#1e6b3a]' },
  not_attending: { label: 'Declined', Icon: CircleSlash, className: 'bg-blush-tint text-on-tertiary-fixed-variant' },
  pending: { label: 'Awaiting reply', Icon: Hourglass, className: 'bg-surface-container text-on-surface-variant' },
}

const FILTERS = [
  { value: 'all', label: 'All guests' },
  { value: 'attending', label: 'Attending' },
  { value: 'pending', label: 'Awaiting' },
  { value: 'not_attending', label: 'Declined' },
  { value: 'not_shared', label: 'Not shared' },
]

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function shortDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ---------------- modals ----------------

function GuestFormModal({ invitationId, guest, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: guest?.name || '',
    displayName: guest?.displayName || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    notes: guest?.notes || '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [addAnother, setAddAnother] = useState(false)
  const nameRef = useRef(null)

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
    setErrors((x) => ({ ...x, [k]: undefined }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: "Enter the guest's name." })
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const data = guest
        ? await api(`/invitations/${invitationId}/guests/${guest.id}`, { method: 'PATCH', body: form })
        : await api(`/invitations/${invitationId}/guests`, { method: 'POST', body: form })
      onSaved(data.guest, !guest)
      if (!guest && addAnother) {
        setForm({ name: '', displayName: '', email: '', phone: '', notes: '' })
        nameRef.current?.focus()
      } else {
        onClose()
      }
    } catch (err) {
      setFormError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setSaving(false)
    }
  }

  const input = (k, label, props = {}) => (
    <div>
      <label htmlFor={`g-${k}`} className="mb-1.5 block text-label-md text-espresso uppercase">
        {label}
      </label>
      <input
        id={`g-${k}`}
        value={form[k]}
        onChange={set(k)}
        aria-invalid={errors[k] ? 'true' : undefined}
        aria-describedby={errors[k] ? `g-${k}-err` : undefined}
        className={`w-full rounded-lg border bg-white px-4 py-3 text-body-md outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,160,89,0.15)] ${errors[k] ? 'border-error' : 'border-bone'}`}
        {...props}
      />
      {errors[k] && (
        <p id={`g-${k}-err`} className="mt-1.5 text-body-sm text-error">
          {errors[k]}
        </p>
      )}
    </div>
  )

  return (
    <Modal title={guest ? 'Edit guest' : 'Add guest'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-5 px-5 py-5">
        <FormAlert>{formError}</FormAlert>
        {input('name', 'Guest name *', { ref: nameRef, maxLength: 100, autoComplete: 'off', placeholder: 'e.g. Amal Perera' })}
        <div>
          {input('displayName', 'Name on invitation', { maxLength: 100, autoComplete: 'off', lang: 'si', placeholder: 'Optional, e.g. අමල් පෙරේරා මහතා' })}
          <p className="mt-1.5 text-body-sm text-on-surface-variant">Shown on their invitation instead of the guest name. Use it to write the name in Sinhala or add a title.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {input('phone', 'Phone (for WhatsApp)', { type: 'tel', maxLength: 20, placeholder: 'e.g. 077 123 4567' })}
          {input('email', 'Email', { type: 'email', maxLength: 254, placeholder: 'Optional' })}
        </div>
        {input('notes', 'Notes', { maxLength: 300, placeholder: "Optional, only you see this (e.g. Bride's family)" })}
        <p className="text-body-sm text-on-surface-variant">
          Each guest gets their own link that shows their name. One person per guest: plus-ones can’t be added.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bone pt-4">
          {!guest ? (
            <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <input type="checkbox" checked={addAnother} onChange={(e) => setAddAnother(e.target.checked)} className="accent-espresso" />
              Add another after this
            </label>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : guest ? 'Save changes' : 'Add guest'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

function ShareModal({ invitation, guest, onClose, onShared }) {
  const [text, setText] = useState(() => buildShareText(invitation, guest))
  const [copied, setCopied] = useState('')
  const [manual, setManual] = useState(false)
  const hasNumber = !!toWhatsAppNumber(guest.phone)

  async function copy(what) {
    const ok = await copyText(what === 'link' ? guest.link : text)
    if (ok) {
      setCopied(what)
      onShared(guest)
      setTimeout(() => setCopied(''), 2000)
    } else {
      setManual(true)
    }
  }

  return (
    <Modal title={`Share with ${guest.name}`} onClose={onClose}>
      <div className="space-y-4 px-5 py-5">
        <div>
          <label htmlFor="share-text" className="mb-1.5 block text-label-md text-espresso uppercase">
            Message
          </label>
          <textarea
            id="share-text"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-lg border border-bone bg-white px-4 py-3 text-body-md outline-none focus:border-gold"
          />
          <p className="mt-1.5 text-body-sm text-on-surface-variant">
            You can change the wording for this guest. Keep the link at the end so it opens their personal invitation.
          </p>
        </div>

        {manual && (
          <div className="rounded-lg bg-surface-container-low p-3">
            <p className="text-body-sm text-espresso">Your browser blocked copying. Select the link below and copy it yourself:</p>
            <input readOnly value={guest.link} onFocus={(e) => e.target.select()} className="mt-2 w-full rounded border border-bone bg-white px-3 py-2 text-body-sm" aria-label="Guest link" />
          </div>
        )}

        <p className="rounded-lg bg-blush-tint px-4 py-3 text-body-sm text-espresso">
          WhatsApp will open with this message filled in. Check it, then press <strong>Send</strong> yourself.
          {!hasNumber && ' This guest has no phone number, so you’ll choose the chat in WhatsApp.'}
        </p>

        <div className="flex flex-wrap justify-end gap-3 border-t border-bone pt-4">
          <button type="button" className="btn-secondary" onClick={() => copy('link')}>
            {copied === 'link' ? <Check size={16} aria-hidden="true" /> : <Link2 size={16} aria-hidden="true" />}
            {copied === 'link' ? 'Copied' : 'Copy link only'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => copy('message')}>
            {copied === 'message' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied === 'message' ? 'Copied' : 'Copy message'}
          </button>
          <a
            href={whatsAppUrl(guest.phone, text)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onShared(guest)}
            className="btn-primary bg-[#25D366] text-white hover:shadow-[0_4px_14px_rgba(37,211,102,0.35)]"
          >
            <Send size={16} aria-hidden="true" /> Open WhatsApp
          </a>
        </div>
        <span aria-live="polite" className="sr-only">
          {copied ? 'Copied to clipboard' : ''}
        </span>
      </div>
    </Modal>
  )
}

// "Send to all on WhatsApp": goes through the guests one by one. Each step opens WhatsApp with
// that guest's personal message and link; the couple presses Send there and comes back, and the
// next guest is ready. WhatsApp only lets a person send from their own number this way (no
// automatic bulk sending), so each message is still sent by the couple with one tap.
function SendAllModal({ invitation, guests, onClose, onShared, onEditMessage }) {
  const notSent = guests.filter((g) => !g.sharedAt)
  const [includeSent, setIncludeSent] = useState(notSent.length === 0)
  const [skipNoPhone, setSkipNoPhone] = useState(false)
  // The list is fixed when the round starts, so guests don't shift while sending
  const [queue, setQueue] = useState(null)
  const [index, setIndex] = useState(0)
  const [opened, setOpened] = useState(false)
  const [sent, setSent] = useState(0)

  const candidates = (includeSent ? guests : notSent).filter((g) => !skipNoPhone || toWhatsAppNumber(g.phone))
  const noPhone = candidates.filter((g) => !toWhatsAppNumber(g.phone)).length
  const guest = queue?.[index]
  const done = queue && index >= queue.length

  const next = useCallback(() => {
    setOpened(false)
    setIndex((i) => i + 1)
  }, [])

  // Back from WhatsApp: the next guest is ready
  useEffect(() => {
    if (!opened) return undefined
    const onBack = () => document.visibilityState === 'visible' && window.setTimeout(next, 400)
    document.addEventListener('visibilitychange', onBack)
    return () => document.removeEventListener('visibilitychange', onBack)
  }, [opened, next])

  // Before starting: who will be included
  if (!queue) {
    return (
      <Modal
        title="Send to all on WhatsApp"
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary bg-[#25D366] text-white" onClick={() => setQueue(candidates)} disabled={!candidates.length}>
              <Send size={16} aria-hidden="true" /> Start ({candidates.length})
            </button>
          </>
        }
      >
        <div className="space-y-4 px-5 py-5 text-body-md text-espresso">
          <p>
            We&apos;ll go through your guests one by one. For each guest, WhatsApp opens with their personal message and link filled in — press{' '}
            <strong>Send</strong>, come back here, and the next guest is ready.
          </p>
          <ul className="space-y-1 rounded-lg bg-surface-container-low px-4 py-3 text-body-sm">
            <li>
              <strong>{candidates.length}</strong> guest{candidates.length === 1 ? '' : 's'} to send to
              {!includeSent && guests.length > notSent.length && ` (${guests.length - notSent.length} already sent are left out)`}
            </li>
            {noPhone > 0 && <li>{noPhone} without a phone number: you&apos;ll pick their chat in WhatsApp</li>}
          </ul>
          <label className="flex cursor-pointer items-start gap-3 text-body-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-espresso" checked={includeSent} onChange={(e) => setIncludeSent(e.target.checked)} />
            Also send again to guests who were already sent their link
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-body-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-espresso" checked={skipNoPhone} onChange={(e) => setSkipNoPhone(e.target.checked)} />
            Leave out guests without a phone number
          </label>
          <p className="text-body-sm text-on-surface-variant">
            The message is the same for everyone, with each guest&apos;s own name and link.{' '}
            <button type="button" className="font-semibold text-gold-text underline underline-offset-4" onClick={onEditMessage}>
              Edit the message
            </button>
          </p>
          {invitation.status !== 'published' && (
            <p className="flex items-start gap-2 rounded-lg border border-gold/30 bg-blush-tint px-4 py-3 text-body-sm">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
              This invitation isn&apos;t published yet, so the links won&apos;t open until you publish it.
            </p>
          )}
        </div>
      </Modal>
    )
  }

  if (done) {
    return (
      <Modal
        title="All done"
        onClose={onClose}
        footer={
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        }
      >
        <div className="px-5 py-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e3f4e8] text-[#1e6b3a]" aria-hidden="true">
            <PartyPopper size={26} />
          </span>
          <p className="mt-4 font-serif text-headline-sm text-espresso">
            {sent} invitation{sent === 1 ? '' : 's'} opened in WhatsApp
          </p>
          <p className="mt-2 text-body-md text-on-surface-variant">Guests you skipped stay on the “Not shared” list, so you can send to them later.</p>
        </div>
      </Modal>
    )
  }

  const text = buildShareText(invitation, guest)
  const hasNumber = !!toWhatsAppNumber(guest.phone)
  return (
    <Modal
      title="Send to all on WhatsApp"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={next}>
            <SkipForward size={16} aria-hidden="true" /> {opened ? 'Next guest' : 'Skip'}
          </button>
          <a
            href={whatsAppUrl(guest.phone, text)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              onShared(guest)
              if (!opened) setSent((n) => n + 1)
              setOpened(true)
            }}
            className="btn-primary bg-[#25D366] text-white hover:shadow-[0_4px_14px_rgba(37,211,102,0.35)]"
          >
            <Send size={16} aria-hidden="true" /> {opened ? 'Open again' : 'Open WhatsApp'}
          </a>
        </>
      }
    >
      <div className="space-y-4 px-5 py-5">
        <div>
          <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
            <span>
              Guest {index + 1} of {queue.length}
            </span>
            <span>{sent} opened</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-container-high" aria-hidden="true">
            <div className="h-full bg-[#25D366] transition-[width]" style={{ width: `${(index / queue.length) * 100}%` }} />
          </div>
        </div>
        <div>
          <p className="font-serif text-headline-sm text-espresso">{guest.displayName || guest.name}</p>
          <p className="text-body-sm text-on-surface-variant">{hasNumber ? guest.phone : 'No phone number: choose their chat in WhatsApp'}</p>
        </div>
        <p className="whitespace-pre-wrap rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-espresso [overflow-wrap:anywhere]">{text}</p>
        <p className="text-body-sm text-on-surface-variant" aria-live="polite">
          {opened ? 'Sent it? Come back here and the next guest is ready — or tap “Next guest”.' : 'Tap “Open WhatsApp”, then press Send in WhatsApp.'}
        </p>
      </div>
    </Modal>
  )
}

function MessageTemplateModal({ invitation, onClose, onSaved }) {
  const lang = STRINGS[invitation.language] ? invitation.language : 'en'
  const [value, setValue] = useState(invitation.shareMessage || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      const data = await api(`/invitations/${invitation.id}`, { method: 'PATCH', body: { shareMessage: value } })
      onSaved(data.invitation)
      onClose()
    } catch (err) {
      setError(err.fieldErrors?.shareMessage || err.message)
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Message sent with each link"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={() => setValue('')}>
            Use standard message
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save message'}
          </button>
        </>
      }
    >
      <div className="space-y-3 px-5 py-5">
        <FormAlert>{error}</FormAlert>
        <label htmlFor="share-template" className="block text-label-md text-espresso uppercase">
          Message
        </label>
        <textarea
          id="share-template"
          rows={5}
          maxLength={500}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={stringsFor(lang, invitation.eventType).shareDefault}
          className="w-full rounded-lg border border-bone bg-white px-4 py-3 text-body-md outline-none focus:border-gold"
        />
        <p className="text-body-sm text-on-surface-variant">
          Write <code className="rounded bg-surface-container px-1">{'{name}'}</code> where the guest’s name should go and{' '}
          <code className="rounded bg-surface-container px-1">{'{couple}'}</code> for your names. The personal link is added at the end automatically. {value.length}/500
        </p>
      </div>
    </Modal>
  )
}

function RowMenu({ onEdit, onReset, onRemove, name }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])
  const item = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm hover:bg-blush-tint'
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${name}`}
        className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-gold/20 bg-white p-1.5 shadow-float">
          <button role="menuitem" type="button" className={item} onClick={() => (setOpen(false), onEdit())}>
            <PencilLine size={15} aria-hidden="true" /> Edit details
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => (setOpen(false), onReset())}>
            <RefreshCw size={15} aria-hidden="true" /> Reset link
          </button>
          <button role="menuitem" type="button" className={`${item} text-error`} onClick={() => (setOpen(false), onRemove())}>
            <Trash2 size={15} aria-hidden="true" /> Remove guest
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------- page ----------------

export default function ManageGuests() {
  const { id } = useParams()
  const [invitation, setInvitation] = useState(null)
  const [guests, setGuests] = useState([])
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null) // { type, guest? }
  const [busy, setBusy] = useState(false)
  const toastTimer = useRef(null)

  useEffect(() => {
    let alive = true
    const load = (initial) =>
      api(`/invitations/${id}/guests`)
        .then((d) => {
          if (!alive) return
          setInvitation(d.invitation)
          setGuests(d.guests)
        })
        .catch((err) => {
          if (alive && initial) setLoadError(err.status === 404 ? 'This invitation could not be found.' : err.message)
        })
    load(true)
    // New replies arrive while the page is open — refresh when the couple comes back to this tab
    const onVisible = () => document.visibilityState === 'visible' && load(false)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      alive = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [id])

  const showToast = useCallback((msg) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2500)
  }, [])

  const upsertGuest = useCallback((g) => {
    setGuests((list) => {
      const exists = list.some((x) => x.id === g.id)
      const next = exists ? list.map((x) => (x.id === g.id ? g : x)) : [...list, g]
      return next.sort((a, b) => a.name.localeCompare(b.name))
    })
  }, [])

  const markShared = useCallback(
    async (guest) => {
      try {
        const d = await api(`/invitations/${id}/guests/${guest.id}/mark-shared`, { method: 'POST' })
        upsertGuest(d.guest)
      } catch {
        // Not important enough to interrupt the couple
      }
    },
    [id, upsertGuest],
  )

  async function quickCopy(guest) {
    if (await copyText(guest.link)) {
      showToast(`Link for ${guest.name} copied`)
      markShared(guest)
    } else {
      setModal({ type: 'share', guest })
    }
  }

  async function resetLink(guest) {
    setBusy(true)
    try {
      const d = await api(`/invitations/${id}/guests/${guest.id}/reset-link`, { method: 'POST' })
      upsertGuest(d.guest)
      showToast(`New link created for ${guest.name}. The old one no longer works.`)
      setModal(null)
    } catch (err) {
      setError(err.message)
      setModal(null)
    } finally {
      setBusy(false)
    }
  }

  async function removeGuest(guest) {
    setBusy(true)
    try {
      await api(`/invitations/${id}/guests/${guest.id}`, { method: 'DELETE' })
      setGuests((list) => list.filter((g) => g.id !== guest.id))
      showToast(`${guest.name} removed`)
      setModal(null)
    } catch (err) {
      setError(err.message)
      setModal(null)
    } finally {
      setBusy(false)
    }
  }

  const summary = useMemo(() => {
    const s = { total: guests.length, attending: 0, not_attending: 0, pending: 0, shared: 0 }
    for (const g of guests) {
      s[g.rsvpStatus] += 1
      if (g.sharedAt) s.shared += 1
    }
    return s
  }, [guests])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return guests.filter((g) => {
      if (filter === 'not_shared' ? g.sharedAt : filter !== 'all' && g.rsvpStatus !== filter) return false
      if (!q) return true
      return [g.name, g.displayName, g.email, g.phone, g.notes].join(' ').toLowerCase().includes(q)
    })
  }, [guests, query, filter])

  if (loadError) {
    return (
      <div className="mx-auto max-w-xl px-margin-mobile py-16 text-center">
        <FormAlert>{loadError}</FormAlert>
        <Link to="/dashboard" className="btn-secondary mt-6">
          Back to dashboard
        </Link>
      </div>
    )
  }
  if (!invitation) {
    return (
      <p className="py-20 text-center text-body-md text-on-surface-variant" role="status">
        Loading guests…
      </p>
    )
  }

  const names = invitationTitle(invitation)
  const live = invitation.status === 'published'
  const pct = (n) => (summary.total ? `${Math.round((n / summary.total) * 100)}%` : '–')
  const counts = { all: summary.total, attending: summary.attending, pending: summary.pending, not_attending: summary.not_attending, not_shared: summary.total - summary.shared }

  // Free designs don't collect replies online, so the RSVP numbers and filters are left out
  const noRsvp = invitation.tier === 'free'
  const allStats = [
    { label: 'Total guests', value: summary.total, note: invitation.limits?.guests ? `of ${invitation.limits.guests} in ${invitation.limits.planName}` : 'On your list', Icon: Users },
    { label: 'Links shared', value: summary.shared, note: `${pct(summary.shared)} shared`, Icon: Send },
    { label: 'Attending', value: summary.attending, note: `${pct(summary.attending)} confirmed`, Icon: CircleCheck },
    { label: 'Declined', value: summary.not_attending, note: 'Sent regrets', Icon: CircleSlash },
    { label: 'Awaiting reply', value: summary.pending, note: invitation.rsvpDeadline ? `Deadline ${formatDate(invitation.rsvpDeadline, 'en', { day: 'numeric', month: 'short' })}` : 'No deadline set', Icon: Hourglass },
  ]
  const stats = noRsvp ? allStats.slice(0, 2) : allStats

  // The package sets the guest limit (Simple Card 50, Premium 150, Premium Plus 300, Signature 500)
  // and whether the list can be downloaded as Excel (Premium Plus and Signature)
  const limits = invitation.limits
  const guestLimit = limits?.guests
  const full = Boolean(guestLimit) && guests.length >= guestLimit
  const addGuest = () => (full ? setModal({ type: 'upgrade', reason: 'guests' }) : setModal({ type: 'add' }))
  const downloadExcel = () =>
    limits?.export
      ? downloadGuestList(invitation, guests).catch(() => setError('The Excel file couldn’t be made. Please try again.'))
      : setModal({ type: 'upgrade', reason: 'export' })
  const filters = noRsvp ? FILTERS.filter((f) => f.value === 'all' || f.value === 'not_shared') : FILTERS

  return (
    <div className="mx-auto max-w-[1200px] px-margin-mobile py-10 md:px-margin">
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant uppercase">
        <Link to="/dashboard" className="hover:text-gold-text">
          Invitations
        </Link>{' '}
        <span className="mx-1">/</span> <span className="text-gold-text">{names}</span>
      </nav>

      <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Manage Guests</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-md text-on-surface-variant">
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
        <div className="flex flex-wrap gap-3">
          {guests.length > 0 && (
            <button type="button" className="btn-primary bg-[#25D366] text-white hover:shadow-[0_4px_14px_rgba(37,211,102,0.35)]" onClick={() => setModal({ type: 'sendAll' })}>
              <Send size={16} aria-hidden="true" /> Send to all
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={() => setModal({ type: 'message' })}>
            <MessageSquareText size={16} aria-hidden="true" /> Edit message
          </button>
          <Link to={`/invitations/${id}/guests/import`} className="btn-secondary">
            <Upload size={16} aria-hidden="true" /> Import Guests
          </Link>
          {guests.length > 0 && (
            <button type="button" className="btn-secondary" onClick={downloadExcel}>
              <Download size={16} aria-hidden="true" /> Download Excel
            </button>
          )}
          <button type="button" className="btn-primary" onClick={addGuest}>
            <UserPlus size={16} aria-hidden="true" /> Add Guest
          </button>
        </div>
      </div>

      {!live && (
        <div className="mt-6 flex flex-col gap-3 rounded-lg border border-gold/30 bg-blush-tint px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-body-md text-espresso">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
            {invitation.status === 'unpublished'
              ? 'This invitation is unpublished, so guest links show “not available” until you publish it again.'
              : 'This invitation is still a draft. You can add guests now, but their links will only open once you publish.'}
          </p>
          <Link to={`/invitations/${id}/edit`} className="btn-secondary shrink-0">
            Go to publish
          </Link>
        </div>
      )}

      {live && invitation.ended && (
        <p className="mt-6 flex items-start gap-2 rounded-lg border border-gold/30 bg-blush-tint px-5 py-4 text-body-md text-espresso">
          <Info size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
          This invitation ended on {formatDate(invitation.onlineUntil, 'en')}, the day after your last event. Guests who open their link now see a short note that it has ended.
        </p>
      )}
      {live && !invitation.ended && invitation.onlineUntil && (
        <p className="mt-6 flex items-start gap-2 rounded-lg border border-bone bg-white px-5 py-4 text-body-md text-on-surface-variant">
          <Info size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
          Guest links open the invitation until {formatDate(invitation.onlineUntil, 'en')}, the day after your last event.
        </p>
      )}

      {full && (
        <p className="mt-6 flex items-start gap-2 rounded-lg border border-gold/30 bg-blush-tint px-5 py-4 text-body-md text-espresso">
          <Info size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
          <span>
            You’ve added all {guestLimit} guests your {limits.planName} package includes.{' '}
            {guestLimit < 500 && (
              <>
                To invite more,{' '}
                <a href="/#pricing" className="font-semibold text-gold-text underline underline-offset-2">
                  see the packages
                </a>
                .
              </>
            )}
          </span>
        </p>
      )}

      {noRsvp && (
        <p className="mt-6 flex items-start gap-2 rounded-lg border border-bone bg-white px-5 py-4 text-body-md text-on-surface-variant">
          <Info size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
          This invitation uses a free design, so guests can’t reply online. Online RSVP comes with the Premium designs.
        </p>
      )}

      <ul className={`mt-8 grid grid-cols-2 gap-4 ${noRsvp ? 'md:max-w-xl' : 'md:grid-cols-3 lg:grid-cols-5'}`}>
        {stats.map(({ label, value, note, Icon }) => (
          <li key={label} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                <Icon size={15} />
              </span>
            </div>
            <p className="mt-3 font-serif text-headline-md text-espresso">{value}</p>
            <p className="mt-1 text-body-sm text-on-surface-variant">{note}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <FormAlert>{error}</FormAlert>
      </div>

      {/* Search + filters */}
      <div className="card mt-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
        <label className="relative block lg:w-80">
          <span className="sr-only">Search guests</span>
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, phone or email"
            className="w-full rounded-full border border-bone bg-ivory py-2.5 pr-4 pl-11 text-body-md outline-none focus:border-gold"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter guests">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-label-md uppercase transition-colors ${filter === f.value ? 'bg-gold text-espresso' : 'border border-bone bg-white text-on-surface-variant hover:border-gold'}`}
            >
              {f.label} ({counts[f.value]})
            </button>
          ))}
        </div>
      </div>

      {/* Guest list */}
      {guests.length === 0 ? (
        <section className="card mt-6 flex flex-col items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
            <UserPlus size={26} />
          </span>
          <h2 className="mt-5 font-serif text-headline-md-mobile text-espresso">Add your first guest</h2>
          <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
            Each guest gets a personal link that greets them by name. Add a phone number to send it straight to their WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-primary" onClick={addGuest}>
              <UserPlus size={16} aria-hidden="true" /> Add Guest
            </button>
            <Link to={`/invitations/${id}/guests/import`} className="btn-secondary">
              <Upload size={16} aria-hidden="true" /> Import from Excel or CSV
            </Link>
          </div>
        </section>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <p className="sr-only" aria-live="polite">
            Showing {visible.length} of {guests.length} guests
          </p>
          {/* Header (desktop) */}
          <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] gap-4 border-b border-bone bg-surface-container-low px-5 py-3 text-label-md text-on-surface-variant uppercase md:grid">
            <span>Guest</span>
            <span>Contact</span>
            <span>Link</span>
            <span>{noRsvp ? '' : 'RSVP'}</span>
            <span className="w-[136px] text-right">Actions</span>
          </div>
          {visible.length === 0 && <p className="px-5 py-10 text-center text-body-md text-on-surface-variant">No guests match this search or filter.</p>}
          <ul>
            {visible.map((g) => {
              const r = RSVP[g.rsvpStatus]
              return (
                <li
                  key={g.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-bone px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-fixed font-serif text-body-md text-on-primary-fixed-variant" aria-hidden="true">
                      {initials(g.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-title-md text-espresso">{g.name}</p>
                      {g.displayName && g.displayName !== g.name && <p className="truncate text-body-sm text-espresso" lang="si">{g.displayName}</p>}
                      {!g.displayName && invitation.language === 'si' && (
                        <p className="truncate text-body-sm text-on-surface-variant italic">No Sinhala name yet: the invitation will show “{g.name}”</p>
                      )}
                      {g.notes && <p className="truncate text-body-sm text-on-surface-variant">{g.notes}</p>}
                    </div>
                  </div>

                  <div className="col-span-2 min-w-0 text-body-sm text-on-surface-variant md:col-span-1">
                    {g.phone && <p className="truncate font-mono">{g.phone}</p>}
                    {g.email && <p className="truncate">{g.email}</p>}
                    {!g.phone && !g.email && <p className="italic">No contact details</p>}
                  </div>

                  <div className="order-last md:order-none">
                    {g.sharedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-espresso">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" /> Shared {shortDate(g.sharedAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-outline-variant px-2.5 py-1 text-label-sm text-on-surface-variant">
                        Not shared
                      </span>
                    )}
                  </div>

                  <div className="order-last md:order-none">
                    {!noRsvp && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm ${r.className}`}>
                        <r.Icon size={13} aria-hidden="true" /> {r.label}
                      </span>
                    )}
                    {g.respondedAt && (
                      <span className="mt-1 block text-body-sm text-on-surface-variant" title={new Date(g.respondedAt).toLocaleString('en-GB')}>
                        Replied {shortDate(g.respondedAt)}
                      </span>
                    )}
                  </div>

                  <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 md:col-start-auto md:row-start-auto">
                    {g.link ? (
                      <>
                        <button
                          type="button"
                          onClick={() => quickCopy(g)}
                          title="Copy link"
                          aria-label={`Copy link for ${g.name}`}
                          className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-espresso"
                        >
                          <Link2 size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setModal({ type: 'share', guest: g })}
                          title="Share on WhatsApp"
                          aria-label={`Share with ${g.name} on WhatsApp`}
                          className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-espresso"
                        >
                          <Send size={17} />
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setModal({ type: 'reset', guest: g })} className="rounded-full px-3 py-1.5 text-body-sm text-gold-text underline">
                        Reset link
                      </button>
                    )}
                    <RowMenu
                      name={g.name}
                      onEdit={() => setModal({ type: 'edit', guest: g })}
                      onReset={() => setModal({ type: 'reset', guest: g })}
                      onRemove={() => setModal({ type: 'remove', guest: g })}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <GuestFormModal
          invitationId={id}
          guest={modal.guest}
          onClose={() => setModal(null)}
          onSaved={(g, isNew) => {
            upsertGuest(g)
            showToast(isNew ? `${g.name} added` : 'Guest updated')
          }}
        />
      )}
      {modal?.type === 'share' && <ShareModal invitation={invitation} guest={modal.guest} onClose={() => setModal(null)} onShared={markShared} />}
      {modal?.type === 'message' && <MessageTemplateModal invitation={invitation} onClose={() => setModal(null)} onSaved={setInvitation} />}
      {modal?.type === 'sendAll' && (
        <SendAllModal
          invitation={invitation}
          guests={guests}
          onClose={() => setModal(null)}
          onShared={markShared}
          onEditMessage={() => setModal({ type: 'message' })}
        />
      )}
      {modal?.type === 'upgrade' && (
        <Modal
          title={modal.reason === 'export' ? 'Download your guest list' : 'Your guest list is full'}
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
                Close
              </button>
              <a href="/#pricing" className="btn-primary">
                See the packages
              </a>
            </>
          }
        >
          <p className="px-5 py-5 text-body-md text-on-surface-variant">
            {modal.reason === 'export'
              ? 'Downloading your guest list and replies as an Excel file is part of Premium Plus and Signature. It’s handy for seating plans and catering numbers.'
              : `${limits?.planName || 'Your package'} includes up to ${guestLimit} guests per invitation. Premium includes 150, Premium Plus 300 and Signature 500.`}
          </p>
        </Modal>
      )}
      {modal?.type === 'reset' && (
        <Modal
          title="Reset this guest’s link?"
          onClose={() => !busy && setModal(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={() => resetLink(modal.guest)} disabled={busy}>
                {busy ? 'Resetting…' : 'Reset link'}
              </button>
            </>
          }
        >
          <p className="px-5 py-5 text-body-md text-on-surface-variant">
            {modal.guest.name}’s current link will stop working straight away. Use this if a link was sent to the wrong person. You’ll need to share the new link with them.
          </p>
        </Modal>
      )}
      {modal?.type === 'remove' && (
        <Modal
          title={`Remove ${modal.guest.name}?`}
          onClose={() => !busy && setModal(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary bg-error text-white" onClick={() => removeGuest(modal.guest)} disabled={busy}>
                {busy ? 'Removing…' : 'Remove guest'}
              </button>
            </>
          }
        >
          <p className="px-5 py-5 text-body-md text-on-surface-variant">
            Their personal link will stop working and their RSVP will be deleted. This can’t be undone.
          </p>
        </Modal>
      )}

      {/* Toast */}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <p className="flex items-center gap-2 rounded-full bg-espresso px-5 py-3 text-body-sm text-white shadow-float">
            <Check size={16} aria-hidden="true" /> {toast}
          </p>
        )}
      </div>
    </div>
  )
}
