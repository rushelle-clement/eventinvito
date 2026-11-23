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
  ChevronRight,
  QrCode,
  Undo2,
  CheckCheck,
  Printer,
  Eye,
  EyeOff,
  Tag,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import { buildShareText, copyText, toWhatsAppNumber, whatsAppUrl } from '../lib/share'
import FormAlert from '../components/FormAlert'
import Modal from '../components/Modal'
import { downloadGuestList } from '../lib/guestExport'
import { FAMILY, TITLES, formatAddress, parseAddress } from '../lib/addressing'
import { MAX_GROUP_LENGTH, groupChoices, groupCounts, groupKey } from '../lib/guestGroups'
import { STRINGS, formatDate, invitationTitle, stringsFor } from '../templates/strings'
import Loader from '../components/Loader'
import Pagination from '../components/Pagination'
import { useAuth } from '../context/AuthContext'
import { qrLockNote } from '../lib/accountPlan'

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
  { value: 'opened_no_reply', label: 'Opened, no reply' },
  { value: 'not_opened', label: 'Not opened' },
  { value: 'not_shared', label: 'Not shared' },
]
// Simple Card sees replies and sharing, but not who opened their invitation (that's Premium)
const OPEN_FILTERS = ['opened_no_reply', 'not_opened']

// Which filter a guest belongs to
function matchesFilter(g, filter) {
  // Sharing and opening are about personal links; printed-card guests have neither
  if (g.cardType === 'physical' && ['not_shared', 'not_opened', 'opened_no_reply', 'opened'].includes(filter)) return false
  switch (filter) {
    case 'all':
      return true
    case 'not_shared':
      return !g.sharedAt && !g.openedAt // a guest who opened it clearly has the link
    case 'opened':
      return Boolean(g.openedAt)
    case 'not_opened':
      return !g.openedAt
    case 'opened_no_reply':
      return Boolean(g.openedAt) && g.rsvpStatus === 'pending'
    default:
      return g.rsvpStatus === filter
  }
}

// "3 Nov, 2 visits" — shown under "Opened"
function openedNote(g) {
  const when = new Date(g.lastOpenedAt || g.openedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
  return g.openCount > 1 ? `Last ${when} · ${g.openCount} visits` : when
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

// What the "See the packages" message says for each locked feature
const UPGRADE = {
  export: {
    title: 'Download your guest list',
    text: 'Downloading your guest list and replies as an Excel file is part of Premium Plus and Signature. It’s handy for seating plans and catering numbers.',
  },
  import: {
    title: 'Import guests from Excel',
    text: 'Importing your guest list from an Excel or CSV file is part of Premium and above. On Simple Card, add guests one at a time.',
  },
  bulkGroups: {
    title: 'Set the group for many guests',
    text: 'Ticking many guests and putting them in a group at once, with counts and replies for each group, is part of Premium and above. On Simple Card, guests have no groups.',
  },
}

function shortDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ---------------- modals ----------------

// Quick ways to address a guest: a title and "and family". They write the "Name on invitation";
// in English they start from the guest name, in Sinhala and Tamil from what's already written there.
function AddressPicker({ form, setForm, language }) {
  const lang = TITLES[language] ? language : 'en'
  const current = parseAddress(form.displayName || (lang === 'en' ? form.name : ''))
  const base = current.name || (lang === 'en' ? form.name.trim() : '')
  const apply = (next) => {
    const merged = { ...current, name: base, ...next }
    const text = formatAddress(merged, lang)
    // Nothing added and the same as the guest name: leave "Name on invitation" empty
    setForm((f) => ({ ...f, displayName: !merged.title && !merged.family && text === f.name.trim() ? '' : text }))
  }
  const disabled = !base
  const chip = (active) =>
    `rounded-full border px-3 py-1 text-body-sm transition ${active ? 'border-gold bg-gold/15 text-espresso' : 'border-bone bg-white text-on-surface-variant hover:border-gold'} disabled:opacity-40`
  return (
    <div>
      <p className="mb-1.5 text-label-md text-espresso uppercase">Address them as</p>
      <div className="flex flex-wrap gap-1.5" lang={lang}>
        {TITLES[lang].map((t) => {
          const active = current.title?.label === t.label
          return (
            <button key={t.label} type="button" disabled={disabled} className={chip(active)} aria-pressed={active} onClick={() => apply({ title: active ? null : t })}>
              {t.label}
            </button>
          )
        })}
        <button type="button" disabled={disabled} className={chip(current.family)} aria-pressed={current.family} onClick={() => apply({ family: !current.family })}>
          + {FAMILY[lang]}
        </button>
      </div>
      {disabled && lang !== 'en' && <p className="mt-1.5 text-body-sm text-on-surface-variant">Write their name in the box below first, then pick a title.</p>}
    </div>
  )
}

// A group box with the groups already used and a few ideas as one-tap chips
function GroupPicker({ id, value, onChange, guests, eventType, error }) {
  const { used, ideas } = groupChoices(guests, eventType)
  const chip = (active) =>
    `rounded-full border px-3 py-1 text-body-sm transition ${active ? 'border-gold bg-gold/15 text-espresso' : 'border-bone bg-white text-on-surface-variant hover:border-gold'}`
  const pick = (name) => onChange(groupKey(value) === groupKey(name) ? '' : name)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-label-md text-espresso uppercase">
        Group
      </label>
      <input
        id={id}
        value={value}
        maxLength={MAX_GROUP_LENGTH}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional, e.g. Bride's family, Office"
        aria-invalid={error ? 'true' : undefined}
        className={`w-full rounded-lg border bg-white px-4 py-3 text-body-md outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,160,89,0.15)] ${error ? 'border-error' : 'border-bone'}`}
      />
      {error && <p className="mt-1.5 text-body-sm text-error">{error}</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {used.map((name) => (
          <button key={name} type="button" className={chip(groupKey(value) === groupKey(name))} aria-pressed={groupKey(value) === groupKey(name)} onClick={() => pick(name)}>
            {name}
          </button>
        ))}
        {ideas.map((name) => (
          <button key={name} type="button" className={`${chip(groupKey(value) === groupKey(name))} border-dashed`} aria-pressed={groupKey(value) === groupKey(name)} onClick={() => pick(name)}>
            + {name}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-body-sm text-on-surface-variant">Only you see this. Use it to filter your list and count replies by side or group.</p>
    </div>
  )
}

function GuestFormModal({ invitationId, guest, language = 'en', guests = [], eventType, allowGroups = true, allowPhysical = false, physicalOnly = false, defaultCardType = 'online', onlineNote = '', onClose, onSaved }) {
  const [form, setForm] = useState({
    cardType: physicalOnly ? 'physical' : guest?.cardType || (allowPhysical ? defaultCardType : 'online'),
    name: guest?.name || '',
    displayName: guest?.displayName || '',
    email: guest?.email || '',
    phone: guest?.phone || '',
    notes: guest?.notes || '',
    group: guest?.group || '',
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
    // Physical cards have no phone number; the card type is only sent when it can be chosen
    const payload = { ...form, ...(form.cardType === 'physical' && { phone: '' }) }
    if (!allowPhysical && !physicalOnly && guest?.cardType !== 'physical') delete payload.cardType
    try {
      const data = guest
        ? await api(`/invitations/${invitationId}/guests/${guest.id}`, { method: 'PATCH', body: payload })
        : await api(`/invitations/${invitationId}/guests`, { method: 'POST', body: payload })
      onSaved(data.guest, !guest)
      if (!guest && addAnother) {
        // Keep the group: guests are usually added a side at a time
        setForm((f) => ({ cardType: f.cardType, name: '', displayName: '', email: '', phone: '', notes: '', group: f.group }))
        nameRef.current?.focus()
      } else {
        onClose()
      }
    } catch (err) {
      setFormError(err.message)
      setErrors(err.fieldErrors || {})
      if (err.fieldErrors?.name) nameRef.current?.focus() // e.g. a physical card with the same name
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
        {!physicalOnly && (allowPhysical || guest?.cardType === 'physical') && (
          <fieldset>
            <legend className="mb-1.5 block text-label-md text-espresso uppercase">Card type</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'online', label: 'Online card', note: onlineNote || 'Personal link by WhatsApp', Icon: Link2 },
                { value: 'physical', label: 'Physical card', note: 'Replies by the QR code', Icon: Printer },
              ].map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${form.cardType === o.value ? 'border-gold bg-gold/10' : 'border-bone bg-white hover:border-gold'}`}
                >
                  <input
                    type="radio"
                    name="g-cardType"
                    value={o.value}
                    checked={form.cardType === o.value}
                    onChange={() => {
                      setForm((f) => ({ ...f, cardType: o.value }))
                      setErrors((x) => ({ ...x, cardType: undefined, name: undefined }))
                    }}
                    className="sr-only"
                  />
                  <o.Icon size={17} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                  <span>
                    <span className="block text-title-md text-espresso">{o.label}</span>
                    <span className="block text-body-sm text-on-surface-variant">{o.note}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.cardType && <p className="mt-1.5 text-body-sm text-error">{errors.cardType}</p>}
          </fieldset>
        )}
        {input('name', 'Guest name *', { ref: nameRef, maxLength: 100, autoComplete: 'off', placeholder: 'e.g. Amal Perera' })}
        <AddressPicker form={form} setForm={setForm} language={language} />
        <div>
          {input('displayName', 'Name on invitation', {
            maxLength: 100,
            autoComplete: 'off',
            lang: language,
            placeholder: language === 'si' ? 'Optional, e.g. අමල් පෙරේරා මහතා සහ මහත්මිය' : 'Optional, e.g. Mr. & Mrs. Amal Perera and family',
          })}
          <p className="mt-1.5 text-body-sm text-on-surface-variant">
            Shown on their invitation instead of the guest name{language === 'si' ? ' — write it in Sinhala here' : ''}. You can also type it yourself.
          </p>
          <p className="mt-2 rounded-lg bg-surface-container-low px-3 py-2 text-body-sm text-espresso" lang={language}>
            Their invitation will say: <strong>{STRINGS[language]?.dear?.((form.displayName || form.name).trim() || '…') ?? `Dear ${form.displayName || form.name}`}</strong>
          </p>
        </div>
        {form.cardType === 'physical' ? (
          input('email', 'Email', { type: 'email', maxLength: 254, placeholder: 'Optional' })
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {input('phone', 'Phone (for WhatsApp)', { type: 'tel', maxLength: 20, placeholder: 'e.g. 077 123 4567' })}
            {input('email', 'Email', { type: 'email', maxLength: 254, placeholder: 'Optional' })}
          </div>
        )}
        {allowGroups && (
        <GroupPicker
          id="g-group"
          value={form.group}
          onChange={(v) => {
            setForm((f) => ({ ...f, group: v }))
            setErrors((x) => ({ ...x, group: undefined }))
          }}
          guests={guests}
          eventType={eventType}
          error={errors.group}
        />
        )}
        {input('notes', 'Notes', { maxLength: 300, placeholder: 'Optional, only you see this (e.g. Aunt, vegetarian)' })}
        <p className="text-body-sm text-on-surface-variant">
          {form.cardType === 'physical'
            ? 'They’ll scan the QR code on their card, type their name and tap it to reply, so use the name as written on their card. Two physical-card guests can’t have the same name: add a town or note, e.g. “Amal Perera (Kandy)”.'
            : 'Each guest gets their own link that shows their name. For a couple or a family, add them once (e.g. “Mr. & Mrs. Amal Perera and family”): they share one link and send one reply.'}
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
      // Copying isn't sharing: the couple marks it shared from the guest's … menu once sent
      setCopied(what)
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
function SendAllModal({ invitation, guests, selection = false, onClose, onShared, onEditMessage }) {
  const title = selection ? `Send to ${guests.length} selected on WhatsApp` : 'Send to all on WhatsApp'
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
        title={title}
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
      title={title}
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

// Put the selected guests in a group (or take them out of their group)
function BulkGroupModal({ invitationId, selected, guests, eventType, onClose, onDone }) {
  const [group, setGroup] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function save(value) {
    setSaving(true)
    setError('')
    try {
      const d = await api(`/invitations/${invitationId}/guests/group`, { method: 'POST', body: { guestIds: selected.map((g) => g.id), group: value } })
      onDone(d.group)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }
  const n = selected.length
  const inGroups = selected.filter((g) => g.group).length
  return (
    <Modal
      title={`Set the group for ${n} guest${n === 1 ? '' : 's'}`}
      onClose={() => !saving && onClose()}
      footer={
        <>
          {inGroups > 0 && (
            <button type="button" className="btn-secondary mr-auto" disabled={saving} onClick={() => save('')}>
              Remove from group
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" disabled={saving || !group.trim()} onClick={() => save(group)}>
            {saving ? 'Saving…' : 'Save group'}
          </button>
        </>
      }
    >
      <div className="space-y-4 px-5 py-5">
        <FormAlert>{error}</FormAlert>
        <GroupPicker id="bulk-group" value={group} onChange={setGroup} guests={guests} eventType={eventType} />
        {inGroups > 0 && <p className="text-body-sm text-on-surface-variant">{inGroups === n ? 'They are' : `${inGroups} of them are`} already in a group; saving moves them to this one.</p>}
      </div>
    </Modal>
  )
}

// Replies and opens for each group; tap a group to list its guests
function GroupsPanel({ rows, active, onPick, showOpened = true }) {
  const noRsvp = false // every design takes replies
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
  // Printed cards aren't "opened", so that column is left out for them
  const cols = showOpened ? 'md:grid-cols-[minmax(0,2fr)_repeat(5,minmax(0,1fr))]' : 'md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]'
  return (
    <section className="card mt-6 p-0" aria-labelledby="groups-h">
      <div className="flex items-center justify-between gap-3 border-b border-bone px-5 py-3">
        <h2 id="groups-h" className="flex items-center gap-2 text-label-md text-espresso uppercase">
          <Tag size={15} className="text-gold-text" aria-hidden="true" /> Groups
        </h2>
        {active !== null && (
          <button type="button" className="text-body-sm text-gold-text underline underline-offset-2" onClick={() => onPick(null)}>
            Show all groups
          </button>
        )}
      </div>
      <div className={`hidden gap-3 px-5 pt-3 pb-1 text-label-sm text-on-surface-variant uppercase md:grid ${cols}`}>
        <span>Group</span>
        <span className="text-right">Guests</span>
        {!noRsvp && (
          <>
            <span className="text-right">Attending</span>
            <span className="text-right">Declined</span>
            <span className="text-right">Awaiting</span>
          </>
        )}
        {showOpened && <span className="text-right">Opened</span>}
      </div>
      <ul className="pb-2">
        {rows.map((r) => {
          const on = active === r.key
          return (
            <li key={r.key || '__none'}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onPick(on ? null : r.key)}
                className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-5 py-2.5 text-left transition-colors md:gap-3 ${cols} ${on ? 'bg-blush-tint' : 'hover:bg-surface-container-low'}`}
              >
                <span className={`min-w-0 text-body-md [overflow-wrap:anywhere] ${r.name ? 'text-espresso' : 'text-on-surface-variant italic'}`}>{r.name || 'No group'}</span>
                <span className="text-right text-body-md font-semibold text-espresso">{r.total}</span>
                {/* Phones: the numbers sit in one line under the name */}
                <span className="col-span-2 flex flex-wrap gap-x-3 text-body-sm text-on-surface-variant md:hidden">
                  {!noRsvp && (
                    <>
                      <span className="text-[#1e6b3a]">{r.attending} attending</span>
                      <span>{r.not_attending} declined</span>
                      <span>{r.pending} awaiting</span>
                    </>
                  )}
                  {showOpened && <span>{r.opened} opened</span>}
                </span>
                {!noRsvp && (
                  <>
                    <span className="hidden text-right text-body-md text-[#1e6b3a] md:block">{r.attending}</span>
                    <span className="hidden text-right text-body-md text-on-surface-variant md:block">{r.not_attending}</span>
                    <span className="hidden text-right text-body-md text-on-surface-variant md:block">{r.pending}</span>
                  </>
                )}
                {showOpened && (
                  <span className="hidden text-right text-body-md text-on-surface-variant md:block">
                    {r.opened} <span className="text-body-sm">({pct(r.opened, r.total)}%)</span>
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// The menu is placed on the screen itself (position: fixed), so the guest list's rounded,
// clipped card can't cut it off on the last rows; it opens upwards when there's no room below.
const MENU_HEIGHT = 300

function RowMenu({ onEdit, onReset, onRemove, onShared, onReply, reply, shared, name }) {
  const [open, setOpen] = useState(false)
  const [place, setPlace] = useState(null) // where the menu sits on the screen
  const ref = useRef(null)
  const buttonRef = useRef(null)

  function toggle() {
    if (open) return setOpen(false)
    const r = buttonRef.current.getBoundingClientRect()
    const right = window.innerWidth - r.right
    setPlace(window.innerHeight - r.bottom < MENU_HEIGHT + 8 ? { bottom: window.innerHeight - r.top + 4, right } : { top: r.bottom + 4, right })
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    const away = () => setOpen(false) // the menu would no longer sit by its button
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    window.addEventListener('scroll', away, true)
    window.addEventListener('resize', away)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', away, true)
      window.removeEventListener('resize', away)
    }
  }, [open])
  const item = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm hover:bg-blush-tint'
  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More actions for ${name}`}
        className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div role="menu" style={place} className="fixed z-40 w-60 rounded-lg border border-gold/20 bg-white p-1.5 shadow-float">
          {/* Their reply, entered by the couple (e.g. the guest phoned instead of scanning or tapping) */}
          {onReply && (
            <>
              <p className="px-3 pt-1.5 pb-1 text-label-sm text-on-surface-variant uppercase">Their reply</p>
              {['attending', 'not_attending', 'pending'].map((v) => {
                const o = RSVP[v]
                return (
                  <button
                    key={v}
                    role="menuitemradio"
                    aria-checked={reply === v}
                    type="button"
                    className={`${item} ${reply === v ? 'font-semibold text-espresso' : ''}`}
                    onClick={() => (setOpen(false), reply !== v && onReply(v))}
                  >
                    <o.Icon size={15} aria-hidden="true" /> {v === 'pending' ? 'No reply yet' : o.label}
                    {reply === v && <Check size={15} className="ml-auto text-gold-text" aria-hidden="true" />}
                  </button>
                )
              })}
              <div className="my-1 border-t border-bone" />
            </>
          )}
          <button role="menuitem" type="button" className={item} onClick={() => (setOpen(false), onEdit())}>
            <PencilLine size={15} aria-hidden="true" /> Edit details
          </button>
          {onShared && (
            <button role="menuitem" type="button" className={item} onClick={() => (setOpen(false), onShared(!shared))}>
              {shared ? <Undo2 size={15} aria-hidden="true" /> : <CheckCheck size={15} aria-hidden="true" />} {shared ? 'Mark as not shared' : 'Mark as shared'}
            </button>
          )}
          {onReset && <button role="menuitem" type="button" className={item} onClick={() => (setOpen(false), onReset())}>
            <RefreshCw size={15} aria-hidden="true" /> Reset link
          </button>}
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
  const { user } = useAuth()
  const { id } = useParams()
  const [invitation, setInvitation] = useState(null)
  const [guests, setGuests] = useState([])
  // The server's totals: on Simple Card the guests come without opening details, so the
  // "Opened" count is taken from here
  const [serverSummary, setServerSummary] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [toastAction, setToastAction] = useState(null)
  const [query, setQuery] = useState('')
  // ?filter=opened_no_reply (from the dashboard) opens the list already filtered
  const [filter, setFilter] = useState(() => {
    const f = new URLSearchParams(window.location.search).get('filter')
    return [...FILTERS.map((x) => x.value), 'opened'].includes(f) ? f : 'all'
  })
  const [modal, setModal] = useState(null) // { type, guest? }
  const [busy, setBusy] = useState(false)
  // null = every group; '' = guests without a group; otherwise a group's key
  const [groupFilter, setGroupFilter] = useState(null)
  const [selected, setSelected] = useState(() => new Set()) // guest ids ticked for a bulk action
  const [pageSize, setPageSize] = useState(25)
  // The page number belongs to one search/filter: any change of them goes back to page 1
  const [pageState, setPageState] = useState({ key: '', page: 1 })
  const [cardFilter, setCardFilter] = useState('all') // all / online / physical cards
  const toastTimer = useRef(null)

  useEffect(() => {
    let alive = true
    const load = (initial) =>
      api(`/invitations/${id}/guests`)
        .then((d) => {
          if (!alive) return
          setInvitation(d.invitation)
          setGuests(d.guests)
          setServerSummary(d.summary)
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

  // `action`: an optional button in the toast, e.g. { label: 'Mark as shared', onClick }
  const showToast = useCallback((msg, action = null) => {
    setToast(msg)
    setToastAction(action)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), action ? 6000 : 2500)
  }, [])

  const upsertGuest = useCallback((g) => {
    setGuests((list) => {
      const exists = list.some((x) => x.id === g.id)
      const next = exists ? list.map((x) => (x.id === g.id ? g : x)) : [...list, g]
      return next.sort((a, b) => a.name.localeCompare(b.name))
    })
  }, [])

  const markShared = useCallback(
    async (guest, shared = true) => {
      try {
        const d = await api(`/invitations/${id}/guests/${guest.id}/mark-shared`, { method: 'POST', body: { shared } })
        upsertGuest(d.guest)
      } catch {
        // Not important enough to interrupt the couple
      }
    },
    [id, upsertGuest],
  )

  // Links only open once the invitation is published, so sharing waits until then
  const notLive = () => invitation?.status !== 'published'
  const share = (guest) => setModal(notLive() ? { type: 'publishFirst' } : { type: 'share', guest })
  const sendAll = (list) => setModal(notLive() ? { type: 'publishFirst' } : { type: 'sendAll', ...(list && { guests: list }) })

  async function quickCopy(guest) {
    if (notLive()) {
      setModal({ type: 'publishFirst' })
      return
    }
    if (await copyText(guest.link)) {
      // Not marked as shared yet: copying doesn't mean it was sent
      showToast(`Link for ${guest.name} copied`, { label: 'Mark as shared', onClick: () => markShared(guest) })
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
      setSelected((s) => {
        const next = new Set(s)
        next.delete(guest.id)
        return next
      })
      showToast(`${guest.name} removed`)
      setModal(null)
    } catch (err) {
      setError(err.message)
      setModal(null)
    } finally {
      setBusy(false)
    }
  }

  // The couple enters a guest's reply (e.g. they phoned)
  async function setReply(guest, response) {
    try {
      const d = await api(`/invitations/${id}/guests/${guest.id}/reply`, { method: 'POST', body: { response } })
      upsertGuest(d.guest)
      showToast(response === 'pending' ? `${guest.name}'s reply cleared` : `${guest.name}: ${RSVP[response].label.toLowerCase()}`, {
        label: 'Undo',
        onClick: () => api(`/invitations/${id}/guests/${guest.id}/reply`, { method: 'POST', body: { response: guest.rsvpStatus } }).then((x) => upsertGuest(x.guest)),
      })
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeGuests(list) {
    setBusy(true)
    try {
      const d = await api(`/invitations/${id}/guests/remove`, { method: 'POST', body: { guestIds: list.map((g) => g.id) } })
      const gone = new Set(list.map((g) => g.id))
      setGuests((all) => all.filter((g) => !gone.has(g.id)))
      setSelected(new Set())
      showToast(`${d.removed} guest${d.removed === 1 ? '' : 's'} removed`)
      setModal(null)
    } catch (err) {
      setError(err.message)
      setModal(null)
    } finally {
      setBusy(false)
    }
  }

  const summary = useMemo(() => {
    const card = () => ({ total: 0, attending: 0, not_attending: 0, pending: 0 })
    const s = { total: guests.length, attending: 0, not_attending: 0, pending: 0, shared: 0, opened: 0, openedNoReply: 0, viaQr: 0, online: card(), physical: card() }
    for (const g of guests) {
      s[g.rsvpStatus] += 1
      const c = s[g.cardType === 'physical' ? 'physical' : 'online']
      c.total += 1
      c[g.rsvpStatus] += 1
      if (g.rsvpVia === 'qr' && g.rsvpStatus !== 'pending') s.viaQr += 1
      if (g.sharedAt) s.shared += 1
      if (g.openedAt) {
        s.opened += 1
        if (g.rsvpStatus === 'pending') s.openedNoReply += 1
      }
    }
    // Simple Card: who opened isn't shown, only how many (from the server)
    if (invitation?.limits?.openDetails === false && serverSummary) s.opened = serverSummary.opened || 0
    return s
  }, [guests, invitation, serverSummary])

  const groups = useMemo(() => groupCounts(guests), [guests])
  const hasGroups = groups.some((r) => r.name)
  // The chosen group, before the reply filters and search
  const inGroup = useMemo(
    () =>
      guests.filter(
        (g) =>
          (groupFilter === null || groupKey(g.group) === groupFilter) &&
          (cardFilter === 'all' || (g.cardType === 'physical' ? 'physical' : 'online') === cardFilter),
      ),
    [guests, groupFilter, cardFilter],
  )

  // Simple Card has no "opened" filters, even if one comes in the address (?filter=)
  const activeFilter = invitation?.limits?.openDetails === false && [...OPEN_FILTERS, 'opened'].includes(filter) ? 'all' : filter
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inGroup.filter((g) => {
      if (!matchesFilter(g, activeFilter)) return false
      if (!q) return true
      return [g.name, g.displayName, g.email, g.phone, g.notes, g.group].join(' ').toLowerCase().includes(q)
    })
  }, [inGroup, query, activeFilter])

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
      <Loader label="Loading guests" />
    )
  }

  const names = invitationTitle(invitation)
  const live = invitation.status === 'published'
  const pct = (n) => (summary.total ? `${Math.round((n / summary.total) * 100)}%` : '–')
  // The filter counts follow the chosen group
  const counts = Object.fromEntries([...FILTERS.map((f) => f.value), 'opened'].map((f) => [f, inGroup.filter((g) => matchesFilter(g, f)).length]))
  const activeGroup = groupFilter === null ? null : groups.find((r) => r.key === groupFilter)
  const groupLabel = activeGroup ? activeGroup.name || 'No group' : ''

  // Pages of the filtered list
  const filterKey = `${query}|${activeFilter}|${groupFilter}|${cardFilter}|${pageSize}`
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize))
  const page = Math.min(pageState.key === filterKey ? pageState.page : 1, pageCount)
  const setPage = (n) => setPageState({ key: filterKey, page: Math.max(1, Math.min(pageCount, n)) })
  const pageGuests = visible.slice((page - 1) * pageSize, page * pageSize)

  // Ticked guests (only those still on the list); the header box ticks this page,
  // then offers every guest that matches the search and filters
  const selectedGuests = guests.filter((g) => selected.has(g.id))
  const allShownSelected = pageGuests.length > 0 && pageGuests.every((g) => selected.has(g.id))
  const allMatchingSelected = visible.length > 0 && visible.every((g) => selected.has(g.id))
  const selectAllMatching = () => setSelected(new Set(visible.map((g) => g.id)))
  const toggle = (gid) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(gid)) next.delete(gid)
      else next.add(gid)
      return next
    })
  const toggleAllShown = () =>
    setSelected((s) => {
      const next = new Set(s)
      for (const g of pageGuests) {
        if (allShownSelected) next.delete(g.id)
        else next.add(g.id)
      }
      return next
    })

  // What the package includes (see server/src/utils/packages.js)
  const limits = invitation.limits || {}
  const can = {
    openDetails: limits.openDetails !== false, // who opened, and "opened, no reply" (Premium and above)
    groups: limits.groups !== false, // guest groups and the group filter (Premium and above)
    groupStats: limits.groupStats !== false, // the per-group counts panel (Premium and above)
    bulkGroups: limits.bulkGroups !== false, // set the group for many guests at once (Premium and above)
    import: limits.import !== false, // import from Excel or CSV (Premium and above)
    qr: limits.qrRsvp === true, // physical cards with a QR code (Premium Plus and Signature)
  }
  // Printed Cards package: every guest has a paper card and replies by QR (no links to share)
  const physicalOnly = limits.onlineCards === false
  // Online / physical counts are shown once physical cards are possible or used
  const showCards = !physicalOnly && (can.qr || summary.physical.total > 0)
  const onlineGuests = guests.filter((g) => g.cardType !== 'physical')
  const split = (k) => `${summary.online[k]} online · ${summary.physical[k]} physical`
  const noDeadline = limits.rsvpDeadline === false // Simple Card: replies stay open until the event
  const stats = [
    {
      label: 'Total guests',
      value: summary.total,
      note: showCards ? `${summary.online.total} online · ${summary.physical.total} physical` : invitation.limits?.guests ? `of ${invitation.limits.guests} in ${invitation.limits.planName}` : 'On your list',
      Icon: Users,
    },
    { label: 'Links shared', value: summary.shared, note: showCards ? `of ${summary.online.total} online guests` : `${pct(summary.shared)} shared`, Icon: Send },
    {
      label: 'Opened',
      value: summary.opened,
      // the most useful nudge: they've seen it but haven't answered
      note: can.openDetails && summary.openedNoReply ? `${summary.openedNoReply} opened, no reply yet` : showCards ? `of ${summary.online.total} online guests` : `${pct(summary.opened)} of guests`,
      Icon: Eye,
      filter: can.openDetails ? 'opened_no_reply' : null,
    },
    { label: 'Attending', value: summary.attending, note: showCards ? split('attending') : `${pct(summary.attending)} confirmed`, Icon: CircleCheck },
    { label: 'Declined', value: summary.not_attending, note: showCards ? split('not_attending') : 'Sent regrets', Icon: CircleSlash },
    { label: 'Awaiting reply', value: summary.pending, note: showCards ? split('pending') : noDeadline ? 'Open until your event' : invitation.rsvpDeadline ? `Deadline ${formatDate(invitation.rsvpDeadline, 'en', { day: 'numeric', month: 'short' })}` : 'No deadline set', Icon: Hourglass },
  ]

  if (physicalOnly) {
    // No links to share or open: show replies by QR instead
    stats.splice(1, 2, { label: 'Replied by QR', value: summary.viaQr, note: `${pct(summary.viaQr)} of guests`, Icon: QrCode })
    stats[0].note = `of ${limits.guests} in ${limits.planName}`
  }

  // The package sets the guest limit (Simple Card 50, Premium 150, Premium Plus 300, Signature 500)
  // and whether the list can be downloaded as Excel (Premium Plus and Signature)
  const guestLimit = limits.guests
  const full = Boolean(guestLimit) && guests.length >= guestLimit
  const addGuest = () => (full ? setModal({ type: 'upgrade', reason: 'guests' }) : setModal({ type: 'add' }))
  const downloadExcel = () =>
    limits?.export
      ? downloadGuestList(invitation, guests).catch(() => setError('The Excel file couldn’t be made. Please try again.'))
      : setModal({ type: 'upgrade', reason: 'export' })
  const filters = (can.openDetails ? FILTERS : FILTERS.filter((f) => !OPEN_FILTERS.includes(f.value))).filter((f) => !physicalOnly || f.value !== 'not_shared')
  // Reply tabs, and the sharing / opening filters in a drop-down beside them
  const REPLY_FILTERS = ['all', 'attending', 'pending', 'not_attending']
  const replyFilters = filters.filter((f) => REPLY_FILTERS.includes(f.value))
  const linkFilters = filters.filter((f) => !REPLY_FILTERS.includes(f.value))
  const selectCls = 'w-full rounded-full border py-2.5 pr-9 pl-4 text-body-md text-espresso outline-none focus:border-gold'
  const importGuests = (e) => {
    if (can.import) return
    e.preventDefault()
    setModal({ type: 'upgrade', reason: 'import' })
  }

  return (
    <div className="mx-auto max-w-[1200px] px-margin-mobile py-10 md:px-margin">
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant uppercase">
        <Link to="/dashboard" className="hover:text-gold-text">
          Invitations
        </Link>{' '}
        <span className="mx-1">/</span> <span className="text-gold-text">{names}</span>
      </nav>

      {/* Title, then one toolbar: adding guests on the left, sending and downloading on the right */}
      <div className="mt-3">
        <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Manage Guests</h1>
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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
          <button type="button" className="btn-primary w-full px-3 py-2.5 text-body-sm sm:w-auto sm:px-5 sm:text-body-md" onClick={addGuest}>
            <UserPlus size={16} aria-hidden="true" /> Add Guest
          </button>
          <Link to={`/invitations/${id}/guests/import`} onClick={importGuests} className="btn-secondary w-full px-3 py-2.5 text-body-sm sm:w-auto sm:px-5 sm:text-body-md">
            <Upload size={16} aria-hidden="true" /> Import from Excel
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
          {!physicalOnly && (
            <button type="button" className="btn-secondary w-full px-3 py-2.5 text-body-sm sm:w-auto sm:px-4 sm:text-body-md" onClick={() => setModal({ type: 'message' })}>
              <MessageSquareText size={16} aria-hidden="true" /> Edit message
            </button>
          )}
          {guests.length > 0 && (
            <button type="button" className="btn-secondary w-full px-3 py-2.5 text-body-sm sm:w-auto sm:px-4 sm:text-body-md" onClick={downloadExcel}>
              <Download size={16} aria-hidden="true" /> Download Excel
            </button>
          )}
          {onlineGuests.length > 0 && (
            <button type="button" className="btn-primary col-span-2 w-full bg-[#25D366] px-3 py-2.5 text-body-sm text-white sm:w-auto sm:px-5 sm:text-body-md hover:shadow-[0_4px_14px_rgba(37,211,102,0.35)]" onClick={() => sendAll()}>
              <Send size={16} aria-hidden="true" /> Send to all
            </button>
          )}
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

      {live && invitation.ended && !physicalOnly && (
        <p className="mt-6 flex items-start gap-2 rounded-lg border border-gold/30 bg-blush-tint px-5 py-4 text-body-md text-espresso">
          <Info size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
          This invitation ended on {formatDate(invitation.onlineUntil, 'en')}, the day after your last event. Guests who open their link now see a short note that it has ended.
        </p>
      )}
      {live && !invitation.ended && invitation.onlineUntil && !physicalOnly && (
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

      <ul className={`mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 ${physicalOnly ? 'xl:grid-cols-5' : 'xl:grid-cols-6'}`}>
        {stats.map(({ label, value, note, Icon, filter: show }) => {
          const body = (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                  <Icon size={15} />
                </span>
              </div>
              <p className="mt-3 font-serif text-headline-md text-espresso">{value}</p>
              <p className={`mt-1 text-body-sm ${show && value ? 'text-gold-text underline-offset-2 group-hover:underline' : 'text-on-surface-variant'}`}>{note}</p>
            </>
          )
          return (
            <li key={label} className="card p-0">
              {/* "Opened": tap to list who opened it but hasn't replied */}
              {show && value ? (
                <button type="button" className="group block h-full w-full rounded-[inherit] p-5 text-left hover:bg-surface-container-low" onClick={() => setFilter(show)}>
                  {body}
                </button>
              ) : (
                <div className="p-5">{body}</div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="mt-6">
        <FormAlert>{error}</FormAlert>
      </div>

      {/* The QR code has its own page; here, just where things stand and the way there */}
      {can.qr && (
        <Link
          to={`/invitations/${id}/qr`}
          className="card mt-6 flex items-center gap-4 p-4 hover:border-gold"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
            <QrCode size={19} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-title-md text-espresso">QR code for physical cards</span>
            <span className="block text-body-sm text-on-surface-variant">
              {invitation.qr?.locked
                ? qrLockNote(user).short
                : invitation.qr?.enabled
                  ? `On · ${summary.physical.total} with physical cards · ${summary.viaQr} replied by QR`
                  : 'Off'}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-body-sm font-semibold text-gold-text">
            Open <ChevronRight size={16} aria-hidden="true" />
          </span>
        </Link>
      )}

      {hasGroups && can.groupStats ? (
        <GroupsPanel rows={groups} active={groupFilter} onPick={setGroupFilter} showOpened={!physicalOnly} />
      ) : (
        !hasGroups &&
        can.groups &&
        guests.length >= 10 && (
          <p className="mt-6 flex items-start gap-2 rounded-lg border border-bone bg-white px-5 py-4 text-body-md text-on-surface-variant">
            <Tag size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
            <span>
              Tip: put guests in groups such as “Bride’s family”, “Groom’s friends” or “Office” to filter the list by group.{' '}
              {can.bulkGroups ? (
                <>
                  Tick guests below and choose <strong className="text-espresso">Set group</strong>, add a Group column when you import, or edit a guest.
                </>
              ) : (
                'Add a Group column when you import, or edit a guest.'
              )}
            </span>
          </p>
        )
      )}

      {/* Search + filters: the search and the drop-downs on top, the reply tabs below */}
      <div className="card mt-6 space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block min-w-0 flex-1">
            <span className="sr-only">Search guests</span>
            <Search size={17} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={physicalOnly ? 'Search by name or email' : 'Search by name, phone or email'}
              className="w-full rounded-full border border-bone bg-ivory py-2.5 pr-4 pl-11 text-body-md outline-none focus:border-gold"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:flex sm:shrink-0">
            {hasGroups && can.groups && (
              <label className="block">
                <span className="sr-only">Group</span>
                <select
                  value={groupFilter ?? '__all'}
                  onChange={(e) => setGroupFilter(e.target.value === '__all' ? null : e.target.value)}
                  className={`${selectCls} sm:w-48 ${groupFilter !== null ? 'border-gold bg-gold/15' : 'border-bone bg-ivory'}`}
                >
                  {/* the counts per group are part of Premium and above */}
                  <option value="__all">All groups{can.groupStats ? ` (${guests.length})` : ''}</option>
                  {groups.map((r) => (
                    <option key={r.key || '__none'} value={r.key}>
                      {r.name || 'No group'}
                      {can.groupStats ? ` (${r.total})` : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {showCards && (
              <label className="block">
                <span className="sr-only">Card type</span>
                <select
                  value={cardFilter}
                  onChange={(e) => setCardFilter(e.target.value)}
                  className={`${selectCls} sm:w-44 ${cardFilter !== 'all' ? 'border-gold bg-gold/15' : 'border-bone bg-ivory'}`}
                >
                  <option value="all">All cards ({guests.length})</option>
                  <option value="online">Online ({summary.online.total})</option>
                  <option value="physical">Physical cards ({summary.physical.total})</option>
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-bone pt-3 md:flex-row md:items-center md:justify-between">
          {/* Replies: one row of tabs */}
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by reply">
            {replyFilters.map((f) => {
              const on = activeFilter === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFilter(f.value)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-body-sm font-medium transition-colors ${on ? 'bg-espresso text-white' : 'text-on-surface-variant hover:bg-surface-container hover:text-espresso'}`}
                >
                  {f.value === 'all' ? 'All' : f.label}
                  <span className={`rounded-full px-1.5 text-[12px] tabular-nums ${on ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface-variant'}`}>{counts[f.value]}</span>
                </button>
              )
            })}
          </div>
          {/* Sharing and opening: a drop-down, so the tabs stay short */}
          {linkFilters.length > 0 && (
            <label className="flex shrink-0 items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="shrink-0">Invitation</span>
              <select
                value={linkFilters.some((f) => f.value === activeFilter) ? activeFilter : ''}
                onChange={(e) => setFilter(e.target.value || 'all')}
                className={`${selectCls} md:w-52 ${linkFilters.some((f) => f.value === activeFilter) ? 'border-gold bg-gold/15' : 'border-bone bg-ivory'}`}
              >
                <option value="">Any</option>
                {linkFilters.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label} ({counts[f.value]})
                  </option>
                ))}
              </select>
            </label>
          )}
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
            {physicalOnly
              ? 'Add the guests you’re giving printed cards to, using the names on their cards. They reply by scanning your QR code.'
              : 'Each guest gets a personal link that greets them by name. Add a phone number to send it straight to their WhatsApp.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-primary" onClick={addGuest}>
              <UserPlus size={16} aria-hidden="true" /> Add Guest
            </button>
            <Link to={`/invitations/${id}/guests/import`} onClick={importGuests} className="btn-secondary">
              <Upload size={16} aria-hidden="true" /> Import from Excel or CSV
            </Link>
          </div>
        </section>
      ) : (
        <div className="card mt-6 overflow-hidden">
          <p className="sr-only" aria-live="polite">
            Showing {pageGuests.length} of {visible.length} guests, page {page} of {pageCount}
          </p>
          {/* Tick guests to put them in a group or send to just them */}
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-bone px-5 py-2.5 ${selected.size ? 'bg-blush-tint' : 'bg-white'}`}>
            <label className="flex cursor-pointer items-center gap-2.5 text-body-sm text-espresso">
              <input type="checkbox" className="h-4 w-4 accent-espresso" checked={allShownSelected} onChange={toggleAllShown} disabled={!pageGuests.length} />
              <span>
                {allShownSelected ? 'Untick this page' : pageCount > 1 ? `Select the ${pageGuests.length} on this page` : `Select all ${visible.length} shown`}
                {groupLabel && !allShownSelected && <span className="text-on-surface-variant"> in “{groupLabel}”</span>}
              </span>
            </label>
            {pageCount > 1 && allShownSelected && !allMatchingSelected && (
              <button type="button" className="text-body-sm font-semibold text-gold-text underline underline-offset-2" onClick={selectAllMatching}>
                Select all {visible.length} guests
              </button>
            )}
            {selected.size > 0 && (
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="text-body-sm font-semibold text-espresso">{selected.size} selected</span>
                {can.groups && (
                  <button
                    type="button"
                    className="btn-secondary px-3.5 py-1.5 text-body-sm"
                    onClick={() => setModal(can.bulkGroups ? { type: 'bulkGroup' } : { type: 'upgrade', reason: 'bulkGroups' })}
                  >
                    <Tag size={15} aria-hidden="true" /> Set group
                  </button>
                )}
                {selectedGuests.some((g) => g.cardType !== 'physical') && (
                  <button
                    type="button"
                    className="btn-primary bg-[#25D366] px-3.5 py-1.5 text-body-sm text-white"
                    onClick={() => sendAll(selectedGuests.filter((g) => g.cardType !== 'physical'))}
                  >
                    <Send size={15} aria-hidden="true" /> Send to selected
                  </button>
                )}
                <button type="button" className="btn-secondary px-3.5 py-1.5 text-body-sm text-error hover:border-error" onClick={() => setModal({ type: 'removeMany', guests: selectedGuests })}>
                  <Trash2 size={15} aria-hidden="true" /> Remove
                </button>
                <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          {/* Header (desktop) */}
          <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_136px] gap-4 border-b border-bone bg-surface-container-low px-5 py-3 text-label-md text-on-surface-variant uppercase md:grid">
            <span>Guest</span>
            <span>Contact</span>
            <span>Invitation</span>
            <span>RSVP</span>
            <span className="text-right">Actions</span>
          </div>
          {visible.length === 0 && (
            <p className="px-5 py-10 text-center text-body-md text-on-surface-variant">No guests match this search or filter{groupLabel ? ` in “${groupLabel}”` : ''}{cardFilter !== 'all' ? ` among ${cardFilter === 'physical' ? 'physical-card' : 'online'} guests` : ''}.</p>
          )}
          <ul>
            {pageGuests.map((g) => {
              const r = RSVP[g.rsvpStatus]
              const physical = g.cardType === 'physical'
              return (
                <li
                  key={g.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-bone px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_136px]"
                >
                  <div className="col-span-2 flex min-w-0 items-center gap-3 md:col-span-1">
                    <input type="checkbox" className="h-4 w-4 shrink-0 accent-espresso" checked={selected.has(g.id)} onChange={() => toggle(g.id)} aria-label={`Select ${g.name}`} />
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-fixed font-serif text-body-md text-on-primary-fixed-variant" aria-hidden="true">
                      {initials(g.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-title-md text-espresso [overflow-wrap:anywhere]">{g.name}</p>
                      {g.displayName && g.displayName !== g.name && <p className="text-body-sm text-espresso [overflow-wrap:anywhere]" lang={invitation.language}>{g.displayName}</p>}
                      {!g.displayName && invitation.language === 'si' && (
                        <p className="truncate text-body-sm text-on-surface-variant italic">No Sinhala name yet: the invitation will show “{g.name}”</p>
                      )}
                      {g.group && can.groups && (
                        <button
                          type="button"
                          onClick={() => setGroupFilter(groupKey(g.group))}
                          title={`Show only “${g.group}”`}
                          className="mt-1 inline-flex max-w-full items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-label-sm text-espresso hover:bg-gold/25"
                        >
                          <Tag size={11} className="shrink-0 text-gold-text" aria-hidden="true" /> <span className="truncate">{g.group}</span>
                        </button>
                      )}
                      {g.notes && <p className="truncate text-body-sm text-on-surface-variant">{g.notes}</p>}
                    </div>
                  </div>

                  <div className="col-span-2 min-w-0 text-body-sm text-on-surface-variant md:col-span-1">
                    {g.phone && <p className="truncate font-mono">{g.phone}</p>}
                    {g.email && <p className="truncate">{g.email}</p>}
                    {!g.phone && !g.email && <p className="italic">{physical ? 'Printed card, no phone needed' : 'No contact details'}</p>}
                  </div>

                  <div className="order-last flex flex-col items-start gap-1 md:order-none">
                    {physical ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1ebf8] px-2.5 py-1 text-label-sm text-[#5b3d86]">
                        <Printer size={13} aria-hidden="true" /> Physical card
                      </span>
                    ) : g.openedAt ? null : g.sharedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-2.5 py-1 text-label-sm text-espresso">
                        <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" /> Shared {shortDate(g.sharedAt)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-outline-variant px-2.5 py-1 text-label-sm text-on-surface-variant">
                        Not shared
                      </span>
                    )}
                    {/* Opened: when they first saw it; the last visit and how many visits on hover */}
                    {physical ? null : g.openedAt ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f0fb] px-2.5 py-1 text-label-sm text-[#24508a]" title={openedNote(g)}>
                        <Eye size={13} aria-hidden="true" /> Opened {shortDate(g.openedAt)}
                        {g.openCount > 1 && <span className="opacity-75">· {g.openCount}×</span>}
                      </span>
                    ) : (
                      live &&
                      can.openDetails &&
                      g.sharedAt && (
                        <span className="inline-flex items-center gap-1.5 px-1 text-label-sm text-on-surface-variant">
                          <EyeOff size={13} aria-hidden="true" /> Not opened yet
                        </span>
                      )
                    )}
                  </div>

                  <div className="order-last md:order-none">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm ${r.className}`}>
                      <r.Icon size={13} aria-hidden="true" /> {r.label}
                    </span>
                    {g.respondedAt && (
                      <span className="mt-1 block text-body-sm text-on-surface-variant" title={new Date(g.respondedAt).toLocaleString('en-GB')}>
                        Replied {shortDate(g.respondedAt)}
                        {g.rsvpStatus !== 'pending' && g.rsvpVia && (
                          <span className={g.rsvpVia === 'qr' ? 'font-semibold text-[#5b3d86]' : ''}> · {g.rsvpVia === 'qr' ? 'by QR' : g.rsvpVia === 'host' ? 'entered by you' : 'by link'}</span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Phones: the name gets the full width, and these buttons sit at the bottom of the card */}
                  <div className="order-last col-span-2 -mt-1 flex items-center justify-end gap-1 md:order-none md:col-span-1 md:mt-0">
                    {physical ? null : g.link ? (
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
                          onClick={() => share(g)}
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
                      onReset={physical ? null : () => setModal({ type: 'reset', guest: g })}
                      onShared={physical || g.openedAt ? null : (on) => markShared(g, on)}
                      shared={Boolean(g.sharedAt)}
                      onRemove={() => setModal({ type: 'remove', guest: g })}
                      onReply={(v) => setReply(g, v)}
                      reply={g.rsvpStatus}
                    />
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Pages */}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={visible.length}
            onPage={setPage}
            onPageSize={setPageSize}
            label="Guest list pages"
            className="border-t border-bone px-5 py-3"
          />
        </div>
      )}

      {/* Modals */}
      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <GuestFormModal
          invitationId={id}
          guest={modal.guest}
          language={invitation.language}
          guests={guests}
          eventType={invitation.eventType}
          allowGroups={can.groups}
          allowPhysical={can.qr && !physicalOnly}
          physicalOnly={physicalOnly}
          onlineNote={limits.onlineGuests ? `Free online card · ${summary.online.total} of ${limits.onlineGuests} used` : ''}
          defaultCardType={cardFilter === 'physical' || (limits.plan === 'printed' && cardFilter !== 'online') ? 'physical' : 'online'}
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
          guests={modal.guests || onlineGuests}
          selection={Boolean(modal.guests)}
          onClose={() => setModal(null)}
          onShared={markShared}
          onEditMessage={() => setModal({ type: 'message' })}
        />
      )}
      {modal?.type === 'bulkGroup' && (
        <BulkGroupModal
          invitationId={id}
          selected={selectedGuests}
          guests={guests}
          eventType={invitation.eventType}
          onClose={() => setModal(null)}
          onDone={(group) => {
            const ids = new Set(selectedGuests.map((g) => g.id))
            setGuests((list) => list.map((g) => (ids.has(g.id) ? { ...g, group } : g)))
            showToast(group ? `${ids.size} guest${ids.size === 1 ? '' : 's'} put in “${group}”` : `${ids.size} guest${ids.size === 1 ? '' : 's'} taken out of their group`)
            setSelected(new Set())
            setModal(null)
          }}
        />
      )}
      {modal?.type === 'publishFirst' && (
        <Modal
          title="Publish your invitation first"
          onClose={() => setModal(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>
                Not now
              </button>
              <Link to={`/invitations/${id}/edit`} className="btn-primary">
                {invitation.status === 'unpublished' ? 'Go to publish again' : 'Go to publish'}
              </Link>
            </>
          }
        >
          <div className="px-5 py-5 text-body-md text-on-surface-variant">
            <p>
              {invitation.status === 'unpublished'
                ? 'This invitation is unpublished, so guests who open their link would see “not available”.'
                : 'This invitation is still a draft, so guests who open their link would see “not available”.'}
            </p>
            <p className="mt-2">Publish it, then come back here to copy links and send them on WhatsApp. You can keep adding guests in the meantime.</p>
          </div>
        </Modal>
      )}
      {modal?.type === 'upgrade' && (
        <Modal
          title={UPGRADE[modal.reason]?.title || 'Your guest list is full'}
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
            {UPGRADE[modal.reason]?.text ||
              `${limits.planName || 'Your package'} includes up to ${guestLimit} guests per invitation. Premium includes 150, Premium Plus 300 and Signature 500.`}
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
      {modal?.type === 'removeMany' && (
        <Modal
          title={`Remove ${modal.guests.length} guest${modal.guests.length === 1 ? '' : 's'}?`}
          onClose={() => !busy && setModal(null)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setModal(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn-primary bg-error text-white" onClick={() => removeGuests(modal.guests)} disabled={busy}>
                {busy ? 'Removing…' : `Remove ${modal.guests.length} guest${modal.guests.length === 1 ? '' : 's'}`}
              </button>
            </>
          }
        >
          <div className="px-5 py-5 text-body-md text-on-surface-variant">
            <p>
              {modal.guests
                .slice(0, 5)
                .map((g) => g.name)
                .join(', ')}
              {modal.guests.length > 5 ? ` and ${modal.guests.length - 5} more` : ''} will be taken off your list.
            </p>
            <p className="mt-2">Their personal links will stop working and their replies will be deleted. This can’t be undone.</p>
          </div>
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
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-full bg-espresso px-5 py-3 text-body-sm text-white shadow-float">
            <span className="flex items-center gap-2">
              <Check size={16} aria-hidden="true" /> {toast}
            </span>
            {toastAction && (
              <button
                type="button"
                className="pointer-events-auto font-semibold text-gold underline underline-offset-2 hover:text-white"
                onClick={() => {
                  toastAction.onClick()
                  setToast('')
                }}
              >
                {toastAction.label}
              </button>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
