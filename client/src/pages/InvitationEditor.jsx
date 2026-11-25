// Invitation editor — settings on the left, live preview on the right
// (based on the Stitch "Invitation Editor" screen). Template-based: no drag-and-drop.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Eye,
  Languages,
  LayoutTemplate,
  MapPin,
  Monitor,
  NotebookPen,
  Save,
  Smartphone,
  TicketCheck,
  Send,
  Users,
  EyeOff,
  Music,
  ImageIcon,
  CalendarClock,
  QrCode,
  Sparkles,
  Lock,
} from 'lucide-react'
import { api } from '../lib/api'
import FormAlert from '../components/FormAlert'
import Modal from '../components/Modal'
import InvitationCard from '../templates/InvitationCard'
import TemplateThumbnail from '../templates/TemplateThumbnail'
import TierBadge from '../components/TierBadge'
import { getTheme } from '../templates/themes'
import { defaultTrackFor, getTrack } from '../templates/music'
import { LANGUAGES, OCCASIONS, invitationTitle, ordinalEn, sampleGuestName } from '../templates/strings'
import { sinhalaWording } from '../templates/wording'
import { onlineUntil, untilText } from '../lib/onlineUntil'
import { useAuth } from '../context/AuthContext'
import ContactLine from '../components/ContactLine'
import { useSiteConfig } from '../lib/siteConfig'
import MusicChooser from '../components/editor/MusicChooser'
import PhotosSection from '../components/editor/PhotosSection'
import CeremoniesEditor from '../components/editor/CeremoniesEditor'
import AgendaEditor from '../components/editor/AgendaEditor'
import LogoSection from '../components/editor/LogoSection'
import Loader from '../components/Loader'
import { publishCredit } from '../lib/publishCredit'

// The fields this screen edits, in the order the server expects
const FIELDS = [
  'partnerOne', 'partnerTwo', 'celebrant', 'age', 'companyName', 'eventTitle', 'milestone', 'logoStyle', 'blessing', 'ceremonies', 'hostLine', 'partnerOneParents', 'partnerTwoParents', 'message', 'inviteLine', 'eventDate', 'eventTime', 'endTime',
  'venueName', 'address', 'mapUrl', 'dressCode', 'rsvpDeadline', 'language', 'eventType', 'templateKey', 'musicTrack',
  'agenda', 'agendaVisible',
]

const FIELD_LABELS = {
  partnerOne: 'First partner’s name',
  partnerTwo: 'Second partner’s name',
  celebrant: 'Birthday person’s name',
  companyName: 'Company name',
  eventTitle: 'Event title',
  eventDate: 'Event date',
  eventTime: 'Start time',
  venueName: 'Venue name',
  address: 'Venue address',
  rsvpDeadline: 'RSVP deadline',
}

// Fields that aren't text, and what they are when empty
const LIST_DEFAULTS = { ceremonies: [], agenda: [], agendaVisible: false, eventType: 'wedding', logoStyle: 'original' }

function pickFields(inv) {
  return Object.fromEntries(
    FIELDS.map((f) => [f, f === 'age' || f === 'milestone' ? (inv?.[f] == null ? '' : String(inv[f])) : (inv?.[f] ?? LIST_DEFAULTS[f] ?? '')]),
  )
}

// Fields can be text or a list (ceremonies), so compare by value
function same(a, b) {
  return typeof a === 'object' || typeof b === 'object' ? JSON.stringify(a) === JSON.stringify(b) : a === b
}

// ---------- small form building blocks ----------

// Under the names once it's been published: they belong to this event now (small fixes only)
function NamesLockNote({ saved }) {
  if (!saved.paid) return null
  return saved.namesLocked ? (
    <p className="flex items-start gap-2 rounded-lg bg-surface-container-low px-3 py-2.5 text-body-sm text-on-surface-variant">
      <Lock size={15} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
      <span>Published, so these names belong to this event. You can fix small spelling mistakes; to change a name, contact us.</span>
    </p>
  ) : (
    <p className="rounded-lg bg-blush-tint px-3 py-2.5 text-body-sm text-espresso">EventInvito has allowed you to change the names once. Save the new names and they’ll stay.</p>
  )
}

const ENDED_DATE_NOTE = 'This event has taken place, so its date can’t be moved. Contact us if the event has been moved.'

function Section({ id, icon: Icon, number, title, subtitle, open, onToggle, children }) {
  return (
    <section className="card">
      <h2>
        <button
          type="button"
          onClick={() => onToggle(id)}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          className="flex w-full items-center gap-4 px-5 py-4 text-left"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
            <Icon size={17} />
          </span>
          <span className="flex-1">
            <span className="block text-title-md text-espresso">
              {number ? `${number}. ` : ''}
              {title}
            </span>
            <span className="block text-body-sm text-on-surface-variant">{subtitle}</span>
          </span>
          <ChevronDown size={18} aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open && (
        <div id={`${id}-panel`} className="space-y-5 border-t border-bone px-5 pt-5 pb-6">
          {children}
        </div>
      )}
    </section>
  )
}

function Field({ label, name, value, onChange, error, hint, as = 'input', required, ...props }) {
  const id = `f-${name}`
  const Tag = as
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-label-md text-espresso uppercase">
        {label} {required && <span className="text-gold-text" aria-hidden="true">*</span>}
      </label>
      <Tag
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-lg border bg-surface-container-low px-4 py-3 text-body-md text-on-surface outline-none transition-[border-color,box-shadow] focus:border-gold focus:bg-white focus:shadow-[0_0_0_3px_rgba(197,160,89,0.15)] ${
          error ? 'border-error' : 'border-transparent'
        } ${as === 'textarea' ? 'min-h-24 resize-y' : ''}`}
        {...props}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-body-sm text-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-body-sm text-on-surface-variant">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

// ---------- the page ----------

export default function InvitationEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [saved, setSaved] = useState(null) // last version from the server
  const { user, updateUser } = useAuth()
  const { contact } = useSiteConfig()
  const [form, setForm] = useState(null) // what's on screen
  const [templates, setTemplates] = useState([])
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: 'idle', message: '' }) // idle | saving | saved | error
  const [loadError, setLoadError] = useState('')
  const [open, setOpen] = useState('language') // the first step: language decides the standard wording
  const [device, setDevice] = useState('mobile')
  // null = a sample name in the invitation's language (follows the language until the couple types one)
  const [previewGuestInput, setPreviewGuest] = useState(null)
  const [showPreviewMobile, setShowPreviewMobile] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [justPublished, setJustPublished] = useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)

  // Opened from "Fill in N details" (?fill=1): go straight to what's missing for publishing
  const [params, setParams] = useSearchParams()
  const [fillFirst, setFillFirst] = useState('')

  // Load the invitation and the list of designs
  useEffect(() => {
    Promise.all([api(`/invitations/${id}`), api('/templates')])
      .then(([inv, tpl]) => {
        setSaved(inv.invitation)
        setForm(pickFields(inv.invitation))
        const missingNow = inv.invitation.missingForPublish || []
        if (params.get('fill') && missingNow.length) {
          // open its section, mark every missing field, and say which ones at the top
          setOpen(sectionFor(missingNow[0]))
          setErrors(Object.fromEntries(missingNow.map((f) => [f, 'Fill this in to publish.'])))
          setStatus({ type: 'fill', message: `Fill in to publish: ${missingNow.map((f) => FIELD_LABELS[f] || f).join(', ')}` })
          setFillFirst(missingNow[0])
        }
        // A Signature couple's own custom design comes first
        setTemplates([...tpl.templates].sort((a, b) => (b.custom ? 1 : 0) - (a.custom ? 1 : 0)))
      })
      .catch((err) => setLoadError(err.status === 404 ? 'This invitation could not be found.' : err.message))
    // load once per invitation; ?fill is read on arrival
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ...then scroll to the first missing field and put the cursor in it (once its section is open),
  // and take ?fill out of the address so a refresh doesn't do it again
  useEffect(() => {
    if (!fillFirst) return undefined
    const t = setTimeout(() => {
      const el = document.querySelector(`[name="${fillFirst}"]`)
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el?.focus({ preventScroll: true })
      setFillFirst('')
      setParams((p) => {
        p.delete('fill')
        return p
      }, { replace: true })
    }, 250)
    return () => clearTimeout(t)
  }, [fillFirst, setParams])

  const dirty = useMemo(() => {
    if (!form || !saved) return false
    const base = pickFields(saved)
    return FIELDS.some((f) => !same(form[f], base[f]))
  }, [form, saved])

  // Warn before closing the tab with unsaved changes
  useEffect(() => {
    if (!dirty) return
    const handler = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const update = useCallback((name, value) => {
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((e) => ({ ...e, [name]: undefined }))
    setStatus((s) => (s.type === 'saved' ? { type: 'idle', message: '' } : s))
  }, [])

  const save = useCallback(async () => {
    if (!form || status.type === 'saving') return false
    // Send only what changed
    const base = pickFields(saved)
    const changes = Object.fromEntries(FIELDS.filter((f) => !same(form[f], base[f])).map((f) => [f, form[f]]))
    if (!Object.keys(changes).length) {
      setStatus({ type: 'saved', message: 'All changes saved' })
      return true
    }
    // Printed cards moving to online invitations: once published, that uses a Premium invitation
    if (saved.printed && 'templateKey' in changes && saved.paid && templates.find((t) => t.key === changes.templateKey)?.tier !== 'free') {
      const ok = window.confirm('Move these printed cards to online invitations? This uses 1 of your Premium invitations. Your guests, replies and QR code are kept.')
      if (!ok) return false
    }
    setStatus({ type: 'saving', message: 'Saving…' })
    try {
      const data = await api(`/invitations/${id}`, { method: 'PATCH', body: changes })
      setSaved(data.invitation)
      setForm(pickFields(data.invitation))
      setErrors({})
      setStatus({ type: 'saved', message: 'All changes saved' })
      return true
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setStatus({ type: 'error', message: err.message })
      // Open the section that holds the first error
      const first = Object.keys(err.fieldErrors || {})[0]
      if (first) setOpen(sectionFor(first))
      return false
    }
  }, [form, saved, id, status.type, templates])

  // Ctrl+S / Cmd+S saves
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  async function openAgendaPreview() {
    if (dirty && !(await save())) return
    navigate(`/invitations/${id}/preview/agenda`)
  }

  async function openPreview() {
    if (dirty && !(await save())) return
    navigate(`/invitations/${id}/preview?guest=${encodeURIComponent(previewGuest.trim())}`)
  }

  async function publish() {
    if (dirty && !(await save())) return
    setPublishing(true)
    try {
      const data = await api(`/invitations/${id}/publish`, { method: 'POST' })
      updateUser(data.user) // one fewer invitation left to publish
      setSaved(data.invitation)
      setForm(pickFields(data.invitation))
      setJustPublished(true)
      setStatus({ type: 'saved', message: 'Published' })
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setStatus({ type: 'error', message: err.message })
      const first = Object.keys(err.fieldErrors || {})[0]
      if (first) setOpen(sectionFor(first))
    } finally {
      setPublishing(false)
    }
  }

  async function unpublish() {
    setPublishing(true)
    try {
      const data = await api(`/invitations/${id}/unpublish`, { method: 'POST' })
      setSaved(data.invitation)
      setJustPublished(false)
      setConfirmUnpublish(false)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setPublishing(false)
    }
  }

  function leave(e) {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) e.preventDefault()
  }

  const toggle = (sectionId) => setOpen((o) => (o === sectionId ? '' : sectionId))

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

  if (!form) {
    return (
      <Loader label="Loading your invitation" />
    )
  }

  const missing = saved.missingForPublish || []
  // Printed Cards package: no online design, guests reply with the QR code on their paper card
  const printed = Boolean(saved.printed)
  // Free designs are static cards: no photos, music or reply-by date (guests still reply)
  // (printed cards keep a free design only for a later upgrade: they have a reply-by date)
  const freeDesign = !printed && (templates.find((t) => t.key === form.templateKey)?.tier || saved.tier) === 'free'
  const isLive = saved.status === 'published'
  const ended = isLive && saved.ended
  const until = onlineUntil(form) // follows the dates as they are typed
  // Birthdays are for one person and their age instead of a couple
  const birthday = form.eventType === 'birthday'
  // Corporate events: a company, the event's title and logo instead of a couple
  const corporate = form.eventType === 'corporate'
  // Christmas parties: the party's title and its hosts (stored as eventTitle and companyName)
  const christmas = form.eventType === 'christmas'
  const noPhotos = corporate || christmas // these designs don't show photos
  const kindOf = (eventType) => (['birthday', 'corporate', 'christmas'].includes(eventType) ? eventType : 'couple')
  const title =
    form.partnerOne || form.partnerTwo || form.celebrant || form.eventTitle || form.companyName
      ? invitationTitle({ ...form, age: form.age === '' ? null : Number(form.age) })
      : 'Untitled invitation'
  const theme = getTheme(form.templateKey)
  // Photos and the couple's music are saved immediately, so they come from the saved copy
  const previewGuest = previewGuestInput ?? sampleGuestName(form.language)
  const previewInvitation = { ...form, photos: noPhotos ? [] : saved.photos || [], customMusic: saved.customMusic }
  const today = new Date().toISOString().slice(0, 10)

  // What publishing this uses: the free card (free designs), a Premium credit (animated designs)
  // or a Printed Cards credit. `blocked`: the account has nothing to publish it with, so the
  // Publish button is turned off and the note says how to upgrade.
  const credit = publishCredit({ printed, paid: saved.paid, paidKind: saved.paidKind, freeDesign: !!getTheme(form.templateKey).free }, user)

  const preview = (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-bone px-4 py-3">
        <div className="flex rounded-full bg-surface-container-low p-1" role="group" aria-label="Preview size">
          {[
            { v: 'mobile', label: 'Mobile', Icon: Smartphone },
            { v: 'desktop', label: 'Desktop', Icon: Monitor },
          ].map(({ v, label, Icon }) => (
            <button
              key={v}
              type="button"
              onClick={() => setDevice(v)}
              aria-pressed={device === v}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label-md uppercase ${device === v ? 'bg-white text-espresso shadow-sheet' : 'text-on-surface-variant'}`}
            >
              <Icon size={15} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={openPreview} className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-label-md text-espresso uppercase hover:shadow-gold">
          <Eye size={14} aria-hidden="true" /> Animated preview
        </button>
        <label className="flex items-center gap-2 text-body-sm text-on-surface-variant">
          Preview as
          <input
            value={previewGuest}
            onChange={(e) => setPreviewGuest(e.target.value)}
            maxLength={60}
            className="w-36 rounded-full border border-bone bg-white px-3 py-1.5 text-body-sm outline-none focus:border-gold"
            aria-label="Guest name for preview"
          />
        </label>
      </div>
      <div className="flex justify-center px-4 py-8" style={{ background: theme.page }}>
        {device === 'mobile' ? (
          <div className="w-full max-w-[380px] rounded-[2.5rem] border-[10px] border-espresso bg-espresso shadow-float">
            {/* Fits the window: the preview stays pinned while the form scrolls, so the phone's bottom must stay on screen */}
            <div className="max-h-[max(320px,min(680px,calc(100vh-17rem)))] overflow-y-auto rounded-[1.8rem]" style={{ background: theme.page }}>
              <InvitationCard invitation={previewInvitation} templateKey={form.templateKey} guestName={previewGuest.trim()} className="rounded-none" />
            </div>
          </div>
        ) : (
          <InvitationCard invitation={previewInvitation} templateKey={form.templateKey} guestName={previewGuest.trim()} className="w-full max-w-2xl shadow-float" />
        )}
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1280px] px-margin-mobile pt-6 pb-28 md:px-margin lg:pb-12">
      {/* Top bar */}
      <div className="flex flex-col gap-4 border-b border-bone pb-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <Link to="/dashboard" onClick={leave} className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant uppercase hover:text-gold-text">
            <ArrowLeft size={15} aria-hidden="true" /> Dashboard
          </Link>
          <h1 className="mt-2 truncate font-serif text-headline-md-mobile text-espresso md:text-headline-md">{title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <span className={`rounded-full px-2.5 py-0.5 text-label-sm uppercase ${isLive ? 'bg-[#e3f4e8] text-[#1e6b3a]' : 'bg-surface-container text-on-surface-variant'}`}>
              {ended ? 'ended' : saved.status}
            </span>
            <span>{printed ? 'Printed cards with QR' : saved.templateName || form.templateKey}</span>
            <span aria-hidden="true">•</span>
            <span role="status" aria-live="polite" className={status.type === 'error' ? 'text-error' : ''}>
              {status.type === 'saving' ? 'Saving…' : dirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
          </p>
        </div>
        {/* On phones each button gets its own full-width line */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
          {!printed && (
            <button type="button" className="btn-secondary" onClick={openPreview}>
              <Eye size={16} aria-hidden="true" /> Preview
            </button>
          )}
          <button type="button" className={`${isLive ? 'btn-primary' : 'btn-secondary'} px-5 py-2.5`} onClick={save} disabled={!dirty || status.type === 'saving'}>
            <Save size={16} aria-hidden="true" /> {status.type === 'saving' ? 'Saving…' : isLive ? 'Save changes' : 'Save Draft'}
          </button>
          {!isLive && (
            <button
              type="button"
              className="btn-primary px-5 py-2.5"
              onClick={publish}
              disabled={publishing || status.type === 'saving' || credit.blocked}
              title={credit.blocked ? 'Upgrade your package to publish this invitation' : missing.length ? 'Fill in the required details first' : undefined}
            >
              <Send size={16} aria-hidden="true" /> {publishing ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* What publishing this uses: the free card (free designs) or a Premium credit (animated designs) */}
      {(() => {
        const { note, blocked, used, waiting } = credit
        if (!note) return null
        return (
          <div className={`mt-4 rounded-lg px-4 py-3 text-body-sm ${blocked ? 'border border-gold/40 bg-blush-tint text-espresso' : 'bg-surface-container-low text-on-surface-variant'}`}>
            <p>{note}</p>
            {blocked && (
              <>
                {used || waiting ? (
                  (contact?.email || contact?.phone) && <p className="mt-1.5">Contact us:</p>
                ) : (
                  <p className="mt-1.5">
                    <a href="/#pricing" className="font-semibold text-gold-text underline underline-offset-4">
                      See the packages
                    </a>
                    {(contact?.email || contact?.phone) && ' or contact us to upgrade:'}
                  </p>
                )}
                <ContactLine className="mt-1" />
              </>
            )}
          </div>
        )
      })()}

      {justPublished ? (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#b7e0c4] bg-[#e3f4e8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between" role="status">
          <p className="text-body-md text-[#1e6b3a]">
            {printed ? (
              <>
                <strong>Your QR reply page is live.</strong> Next, add your guests, then download your QR code to print on your cards.
              </>
            ) : (
              <>
                <strong>Your invitation is live.</strong> Guests can open it until {untilText(saved.onlineUntil || until)}, the day after your last event. Next, add your guests to get their personal links.
              </>
            )}
          </p>
          <Link to={`/invitations/${id}/guests`} className="btn-primary shrink-0">
            <Users size={16} aria-hidden="true" /> Add guests
          </Link>
        </div>
      ) : (
        isLive && (
          <div className="mt-4 flex flex-col gap-3 rounded-lg bg-blush-tint px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-espresso">
              {printed
                ? ended
                  ? `Your event was on ${untilText(saved.eventDate)}. The QR reply page is closed.`
                  : 'Your QR reply page is live. Changes you save show on it straight away.'
                : ended
                ? `This invitation ended on ${untilText(saved.onlineUntil)}. Guests who open their link now see a short note that it has ended.`
                : `This invitation is live until ${untilText(saved.onlineUntil || until)}, the day after your last event. Changes you save will show to every guest straight away.`}
            </p>
            <div className="flex shrink-0 gap-2">
              <Link to={`/invitations/${id}/guests`} className="btn-secondary px-4 py-2 text-body-sm">
                <Users size={15} aria-hidden="true" /> Guests
              </Link>
              <button type="button" className="btn-secondary px-4 py-2 text-body-sm" onClick={() => setConfirmUnpublish(true)}>
                <EyeOff size={15} aria-hidden="true" /> Unpublish
              </button>
            </div>
          </div>
        )
      )}

      {status.type === 'error' && (
        <div className="mt-4">
          <FormAlert>{status.message}</FormAlert>
        </div>
      )}
      {/* Arrived from "Fill in N details": what's still needed (gone once it's saved) */}
      {status.type === 'fill' && (
        <p className="mt-4 rounded-lg border border-gold/40 bg-blush-tint px-4 py-3 text-body-md text-espresso" role="status">
          {status.message}
        </p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        {/* Settings */}
        <div className="space-y-4">
          {/* Printed Cards: one short form — only what the QR reply page shows, and when replies close */}
          {printed && (
            <section className="card p-5 sm:p-6" aria-labelledby="pe-h">
              <h2 id="pe-h" className="font-serif text-headline-sm text-espresso">
                Your event
              </h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">Guests see these after scanning the QR code, so they know which event they’re replying to.</p>
              <div className="mt-5 space-y-5">
                <label className="block">
                  <span className="text-label-md text-espresso">Language of the reply page</span>
                  <select
                    value={form.language}
                    onChange={(e) => update('language', e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-bone bg-white px-4 py-3 text-body-md outline-none focus:border-gold"
                  >
                    {LANGUAGES.filter((l) => !l.comingSoon || l.code === form.language).map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
                {christmas ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Party title" name="eventTitle" value={form.eventTitle} onChange={update} error={errors.eventTitle} maxLength={100} required placeholder="e.g. Christmas Party" />
                    <Field label="Hosted by" name="companyName" value={form.companyName} onChange={update} error={errors.companyName} maxLength={80} required placeholder="e.g. The Perera family" />
                  </div>
                ) : corporate ? (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Company name" name="companyName" value={form.companyName} onChange={update} error={errors.companyName} maxLength={80} required placeholder="e.g. Lumora Holdings" />
                    <Field label="Event title" name="eventTitle" value={form.eventTitle} onChange={update} error={errors.eventTitle} maxLength={100} required placeholder="e.g. Annual Awards Night" />
                  </div>
                ) : birthday ? (
                  <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
                    <Field label="Birthday person" name="celebrant" value={form.celebrant} onChange={update} error={errors.celebrant} maxLength={60} required placeholder="e.g. Kavindi" />
                    <Field label="Turning" name="age" type="number" inputMode="numeric" min={0} max={120} value={form.age} onChange={update} error={errors.age} placeholder="Optional" />
                  </div>
                ) : (
                  <>
                    <fieldset>
                      <legend className="mb-2 text-label-md text-espresso">Occasion</legend>
                      <div className="grid grid-cols-3 gap-2">
                        {OCCASIONS.map((o) => (
                          <label
                            key={o.value}
                            className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-center text-body-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${form.eventType === o.value ? 'border-gold bg-blush-tint font-semibold text-espresso' : 'border-bone bg-white text-espresso'}`}
                          >
                            <input type="radio" name="eventType" value={o.value} checked={form.eventType === o.value} onChange={() => update('eventType', o.value)} className="sr-only" />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="First partner" name="partnerOne" value={form.partnerOne} onChange={update} error={errors.partnerOne} maxLength={60} required placeholder="e.g. Amaya" />
                      <Field label="Second partner" name="partnerTwo" value={form.partnerTwo} onChange={update} error={errors.partnerTwo} maxLength={60} required placeholder="e.g. Nuwan" />
                    </div>
                  </>
                )}
                <NamesLockNote saved={saved} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Event date" name="eventDate" type="date" value={form.eventDate} onChange={update} error={errors.eventDate} required min={today} hint={saved.datesLocked ? ENDED_DATE_NOTE : undefined} />
                  <Field label="Start time" name="eventTime" type="time" value={form.eventTime} onChange={update} error={errors.eventTime} required />
                </div>
                <Field label="Venue name" name="venueName" value={form.venueName} onChange={update} error={errors.venueName} maxLength={120} required placeholder="e.g. Mount Lavinia Hotel" />
                <Field
                  label="Reply by"
                  name="rsvpDeadline"
                  type="date"
                  value={form.rsvpDeadline}
                  onChange={update}
                  error={errors.rsvpDeadline}
                  required
                  min={today}
                  max={form.eventDate || undefined}
                  hint="Guests can reply or change their answer until the end of this day. You can still enter replies yourself after it."
                />
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button type="button" className="btn-primary" onClick={save} disabled={!dirty || status.type === 'saving'}>
                  <Save size={16} aria-hidden="true" /> {status.type === 'saving' ? 'Saving…' : 'Save'}
                </button>
                <span className="text-body-sm text-on-surface-variant">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
              </div>
            </section>
          )}

          {!printed && (
            <>
          <Section id="language" icon={Languages} number={1} title="Language" subtitle="One language per invitation" open={open === 'language'} onToggle={toggle}>
            <fieldset>
              <legend className="mb-3 text-body-sm text-on-surface-variant">
                The standard wording on the invitation will use this language. Type your own text (names, message, venue) in the same language.
              </legend>
              <div className="space-y-2">
                {LANGUAGES.map((l) => {
                  // "Coming soon" languages can't be picked for a new choice, but an invitation that
                  // already uses one keeps it (so it stays selected and still displays)
                  const unavailable = l.comingSoon && form.language !== l.code
                  return (
                    <label
                      key={l.code}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${unavailable ? 'cursor-not-allowed border-bone bg-surface-container-low opacity-60' : 'cursor-pointer'} ${form.language === l.code ? 'border-gold bg-blush-tint' : unavailable ? '' : 'border-bone bg-white'}`}
                    >
                      <input
                        type="radio"
                        name="language"
                        value={l.code}
                        checked={form.language === l.code}
                        disabled={unavailable}
                        onChange={() => update('language', l.code)}
                        className="accent-espresso"
                      />
                      <span className="text-body-md text-espresso">{l.label}</span>
                      {l.comingSoon && <span className="ml-auto rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-espresso">Coming soon</span>}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </Section>

          <Section
            id="details"
            icon={CalendarDays}
            number={2}
            title="Event Details"
            subtitle={birthday ? 'Name, age, date, time and dress code' : corporate ? 'Company, event title, logo, date and time' : christmas ? 'Party title, hosts, date and time' : 'Occasion, names, date, time and dress code'}
            open={open === 'details'}
            onToggle={toggle}
          >
            {christmas ? (
              <>
                <Field
                  label="Party title"
                  name="eventTitle"
                  value={form.eventTitle}
                  onChange={update}
                  error={errors.eventTitle}
                  maxLength={100}
                  required
                  placeholder="e.g. Christmas Party"
                  hint="The main heading of your invitation."
                />
                <Field
                  label="Hosted by"
                  name="companyName"
                  value={form.companyName}
                  onChange={update}
                  error={errors.companyName}
                  maxLength={80}
                  required
                  placeholder="e.g. The Perera family"
                  hint="A family, a group of friends, a club or a company."
                />
              </>
            ) : corporate ? (
              <>
                <Field label="Company name" name="companyName" value={form.companyName} onChange={update} error={errors.companyName} maxLength={80} required placeholder="e.g. Lumora Holdings" />
                <Field
                  label="Event title"
                  name="eventTitle"
                  value={form.eventTitle}
                  onChange={update}
                  error={errors.eventTitle}
                  maxLength={100}
                  required
                  placeholder="e.g. Annual Awards Night 2026"
                  hint="The main heading of your invitation."
                />
                {!printed && <LogoSection
                  invitationId={id}
                  logo={saved.logo}
                  onChange={(logo) => setSaved((prev) => ({ ...prev, logo }))}
                  logoStyle={form.logoStyle || 'original'}
                  onStyle={(v) => update('logoStyle', v)}
                />}
                <Field
                  label="Anniversary (years)"
                  name="milestone"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  value={form.milestone}
                  onChange={update}
                  error={errors.milestone}
                  placeholder="e.g. 25"
                  hint={form.templateKey === 'corporate-anniversary' ? 'The big number on this design, e.g. 25 for a 25th anniversary.' : 'Optional. Only for a company anniversary; the Corporate Anniversary design shows it as a big number.'}
                />
              </>
            ) : birthday ? (
              <div className="grid gap-5 sm:grid-cols-[1fr_9rem]">
                <Field
                  label="Birthday person"
                  name="celebrant"
                  value={form.celebrant}
                  onChange={update}
                  error={errors.celebrant}
                  maxLength={60}
                  required
                  placeholder="e.g. Kavindi"
                />
                <Field
                  label="Turning"
                  name="age"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={120}
                  value={form.age}
                  onChange={update}
                  error={errors.age}
                  placeholder="e.g. 5"
                  hint={/^\d{1,3}$/.test(String(form.age)) ? `Shows “${ordinalEn(Number(form.age))} Birthday”` : 'Optional'}
                />
              </div>
            ) : (
              <>
                <fieldset>
                  <legend className="mb-2 text-label-md text-espresso">Occasion</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {OCCASIONS.map((o) => (
                      <label
                        key={o.value}
                        className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-2.5 text-center text-body-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-gold ${form.eventType === o.value ? 'border-gold bg-blush-tint font-semibold text-espresso' : 'border-bone bg-white text-espresso'}`}
                      >
                        <input type="radio" name="eventType" value={o.value} checked={form.eventType === o.value} onChange={() => update('eventType', o.value)} className="sr-only" />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  <p className="mt-2 text-body-sm text-on-surface-variant">The standard wording on your invitation follows the occasion.</p>
                </fieldset>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First partner" name="partnerOne" value={form.partnerOne} onChange={update} error={errors.partnerOne} maxLength={60} required placeholder="e.g. Amaya" />
                  <Field label="Second partner" name="partnerTwo" value={form.partnerTwo} onChange={update} error={errors.partnerTwo} maxLength={60} required placeholder="e.g. Nuwan" />
                </div>
              </>
            )}
            <NamesLockNote saved={saved} />
            <Field
              label="Event date"
              name="eventDate"
              type="date"
              value={form.eventDate}
              onChange={update}
              error={errors.eventDate}
              required
              min={today}
              hint={
                saved.datesLocked
                  ? ENDED_DATE_NOTE
                  : until
                  ? `Guests can open your invitation until ${untilText(until)}, the day after your last event. After that their link shows a short note that it has ended.`
                  : 'Guests can open your invitation until the day after your last event.'
              }
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Start time" name="eventTime" type="time" value={form.eventTime} onChange={update} error={errors.eventTime} required />
              <Field label="End time" name="endTime" type="time" value={form.endTime} onChange={update} error={errors.endTime} />
            </div>
            <Field label="Dress code" name="dressCode" value={form.dressCode} onChange={update} error={errors.dressCode} maxLength={200} placeholder="e.g. Formal" />
          </Section>

          <Section id="venue" icon={MapPin} number={3} title="Venue" subtitle="Where guests should go" open={open === 'venue'} onToggle={toggle}>
            <Field label="Venue name" name="venueName" value={form.venueName} onChange={update} error={errors.venueName} maxLength={120} required placeholder="e.g. Mount Lavinia Hotel" />
            <Field
              label="Address"
              name="address"
              as="textarea"
              rows={2}
              value={form.address}
              onChange={update}
              error={errors.address}
              maxLength={250}
              required={!printed}
              placeholder="Street, city"
              hint={printed ? 'Optional: it’s on your printed card. Guests see only the venue name on the reply page.' : undefined}
            />
            {!printed && <Field
              label="Map link"
              name="mapUrl"
              type="url"
              value={form.mapUrl}
              onChange={update}
              error={errors.mapUrl}
              maxLength={500}
              placeholder="https://maps.google.com/…"
              hint="Optional. Paste a Google Maps link so guests can find the venue."
            />}
          </Section>

            </>
          )}

          {!printed && (<>
          <Section id="wording" icon={NotebookPen} number={4} title="Wording" subtitle="The words on your invitation" open={open === 'wording'} onToggle={toggle}>
            {form.language === 'si' && !birthday && !corporate && !christmas && <SinhalaWordingFill form={form} update={update} />}
            {/* The opening blessing is for weddings, engagements and homecomings only */}
            {!birthday && !corporate && !christmas && (
              <Field
                label="Opening blessing"
                name="blessing"
                value={form.blessing}
                onChange={update}
                error={errors.blessing}
                maxLength={140}
                placeholder="e.g. ॥ श्री गणेशाय नमः ॥ or a line of scripture"
                hint="Optional. Printed in small type at the very top, in any language or script."
              />
            )}
            <Field
              label="Hosts' line"
              name="hostLine"
              as="textarea"
              rows={2}
              value={form.hostLine}
              onChange={update}
              error={errors.hostLine}
              maxLength={200}
              placeholder={
                birthday
                  ? 'e.g. Mr. & Mrs. Perera invite you to celebrate their daughter’s birthday'
                  : corporate
                    ? 'e.g. The Chairman and Board of Directors of Lumora Holdings cordially invite you to'
                    : christmas
                      ? 'e.g. The Perera family warmly invite you to'
                      : 'e.g. Mr. & Mrs. Perera request the honour of your presence'
              }
              hint={`Optional. ${form.hostLine.length}/200`}
            />
            {!birthday && !corporate && !christmas && (
              <>
            <Field
              label={`Line above ${form.partnerOne.trim() || 'the first partner'}’s name`}
              name="partnerOneParents"
              as="textarea"
              rows={2}
              value={form.partnerOneParents}
              onChange={update}
              error={errors.partnerOneParents}
              maxLength={200}
              placeholder={form.language === 'si' ? 'e.g. සුනිල් පෙරේරා මහතා සහ කමලා පෙරේරා මැතිනියගේ ආදරණීය දියණිය' : 'e.g. Daughter of Mr. & Mrs. Sunil Perera'}
              hint={bracketHint(form.partnerOneParents) || 'Optional. Usually the parents’ names, shown just above the name.'}
            />
            <Field
              label={`Line above ${form.partnerTwo.trim() || 'the second partner'}’s name`}
              name="partnerTwoParents"
              as="textarea"
              rows={2}
              value={form.partnerTwoParents}
              onChange={update}
              error={errors.partnerTwoParents}
              maxLength={200}
              placeholder={form.language === 'si' ? 'e.g. රංජිත් සිල්වා මහතා සහ නිලන්ති සිල්වා මැතිනියගේ ආදරණීය පුත්' : 'e.g. Son of Mr. & Mrs. Ranjith Silva'}
              hint={bracketHint(form.partnerTwoParents) || 'Optional.'}
            />
              </>
            )}
            <Field
              label="Invitation message"
              name="message"
              as="textarea"
              rows={4}
              value={form.message}
              onChange={update}
              error={errors.message}
              maxLength={600}
              placeholder="Leave empty to use the standard wording for your language."
              hint={`${form.message.length}/600`}
            />
            <Field
              label="Closing line to the guest"
              name="inviteLine"
              value={form.inviteLine}
              onChange={update}
              error={errors.inviteLine}
              maxLength={200}
              placeholder={form.language === 'si' ? '{name} ඔබට කෙරෙන සුහද ඇරයුමයි මේ.' : 'e.g. We would be delighted to have you with us, {name}.'}
              hint={
                form.language === 'si'
                  ? 'Leave empty to use the line shown. Write {name} where each guest’s name should go; the name is then not repeated at the top.'
                  : 'Optional. Write {name} where each guest’s name should go. When you use {name}, the “Dear …” greeting is left out.'
              }
            />
            <CeremoniesEditor value={form.ceremonies} templateKey={form.templateKey} corporate={corporate} christmas={christmas} onChange={(list) => update('ceremonies', list)} error={errors.ceremonies} />
          </Section>

          <Section id="design" icon={LayoutTemplate} number={5} title="Design" subtitle="Switch to another template" open={open === 'design'} onToggle={toggle}>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Template">
              {/* Birthday, corporate and couple invitations each switch between their own designs */}
              {templates.filter((t) => kindOf(t.eventType) === kindOf(form.eventType)).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="radio"
                  aria-checked={form.templateKey === t.key}
                  onClick={() => update('templateKey', t.key)}
                  className={`overflow-hidden rounded-lg border-2 text-left transition-colors ${form.templateKey === t.key ? 'border-gold' : 'border-bone hover:border-gold/50'}`}
                >
                  <span className="relative block">
                    <TemplateThumbnail templateKey={t.key} invitation={previewInvitation} height={180} />
                    <TierBadge tier={t.tier} custom={t.custom} className="absolute top-2 left-2" />
                  </span>
                  <span className="block px-3 py-2 text-body-sm font-semibold text-espresso">{t.name}</span>
                </button>
              ))}
            </div>
            {errors.templateKey && <p className="text-body-sm text-error">{errors.templateKey}</p>}
          </Section>

          <Section id="photos" icon={ImageIcon} number={6} title="Photos" subtitle="Cover photo and gallery" open={open === 'photos'} onToggle={toggle}>
            {freeDesign ? (
              <PremiumOnly>Photos are shown on the Premium designs. Your free design is a simple card without photos.</PremiumOnly>
            ) : noPhotos ? (
              <p className="text-body-md text-on-surface-variant">{corporate ? 'Corporate' : 'Christmas'} designs don’t use photos — your {corporate ? 'logo and event title lead' : 'party title and greeting lead'} the invitation instead.</p>
            ) : (
              <PhotosSection invitationId={id} photos={saved.photos || []} limits={saved.limits} onChange={(photos) => setSaved((prev) => ({ ...prev, photos }))} />
            )}
          </Section>

          <Section id="music" icon={Music} number={7} title="Music" subtitle="Optional background music" open={open === 'music'} onToggle={toggle}>
            {freeDesign ? (
              <PremiumOnly>
                Your free design plays “{getTrack(defaultTrackFor(form.templateKey, form.eventType))?.title}” softly in the background. Choosing another song, or your own, comes with
                the Premium designs.
              </PremiumOnly>
            ) : (
              <MusicChooser
                invitationId={id}
                templateKey={form.templateKey}
                value={form.musicTrack}
                customMusic={saved.customMusic}
                ownMusic={saved.limits?.ownMusic !== false}
                planName={saved.limits?.planName}
                onChange={update}
                onInvitation={(inv) => {
                  setSaved((prev) => ({ ...prev, customMusic: inv.customMusic, musicTrack: inv.musicTrack }))
                  setForm((f) => ({ ...f, musicTrack: inv.musicTrack }))
                }}
              />
            )}
          </Section>
          </>)}

          {!printed && (
          <Section id="rsvp" icon={TicketCheck} number={printed ? 4 : 8} title="RSVP Settings" subtitle={freeDesign ? 'Guests reply on your card' : 'When guests must reply by'} open={open === 'rsvp'} onToggle={toggle}>
            {freeDesign ? (
              <>
                <p className="rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
                  Guests reply on your card (attending or not attending), and you see their answers on your guest list. Replies stay open until your event.
                  Each guest replies only for themselves.
                </p>
                <div className="mt-3">
                  <PremiumOnly>A reply-by date comes with the Premium designs.</PremiumOnly>
                </div>
              </>
            ) : (
              <>
                <Field
                  label="RSVP deadline"
                  name="rsvpDeadline"
                  type="date"
                  value={form.rsvpDeadline}
                  onChange={update}
                  error={errors.rsvpDeadline}
                  required
                  min={today}
                  max={form.eventDate || undefined}
                  hint="Guests can reply or change their answer until the end of this day."
                />
                <p className="rounded-lg bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
                  {printed
                    ? 'Guests scan the QR code on their card, find their name and reply. Each name replies only for itself; plus-ones can’t be added.'
                    : 'Each guest replies only for themselves. Plus-ones can’t be added.'}
                </p>
              </>
            )}
          </Section>
          )}

          {/* The day plan is for weddings, engagements, homecomings and corporate events (not birthdays) */}
          {printed && (
            <Section id="design" icon={Sparkles} title="Online invitations too?" subtitle="Upgrade to Premium Plus" open={open === 'design'} onToggle={toggle}>
              {/* Printed Cards are paper only: online invitations are Premium Plus */}
              <div className="rounded-lg border border-bone bg-surface-container-low px-4 py-3 text-body-sm text-on-surface-variant">
                <p>
                  <strong className="text-espresso">Printed Cards are paper cards with a QR code.</strong> To also send online invitations on WhatsApp, with an animated design, photos and music, upgrade to Premium Plus — you only pay the difference. Your guests, replies and QR code stay as they are.
                </p>
                {saved.paid && (user?.publishCredits || 0) > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Premium design">
                    {templates
                      .filter((t) => t.tier !== 'free' && kindOf(t.eventType) === kindOf(form.eventType))
                      .map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          role="radio"
                          aria-checked={form.templateKey === t.key}
                          onClick={() => update('templateKey', t.key)}
                          className={`overflow-hidden rounded-lg border-2 bg-white text-left transition-colors ${form.templateKey === t.key ? 'border-gold' : 'border-bone hover:border-gold/50'}`}
                        >
                          <span className="relative block">
                            <TemplateThumbnail templateKey={t.key} invitation={previewInvitation} height={150} />
                            <TierBadge tier={t.tier} custom={t.custom} className="absolute top-2 left-2" />
                          </span>
                          <span className="block px-3 py-2 text-body-sm font-semibold text-espresso">{t.name}</span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <ContactLine className="mt-2" />
                )}
              </div>
              {errors.templateKey && <p className="mt-2 text-body-sm text-error">{errors.templateKey}</p>}
            </Section>
          )}

          {form.eventType !== 'birthday' && !christmas && !printed && (
          <Section
            id="agenda"
            icon={CalendarClock}
            number={9}
            title={corporate ? 'Event agenda' : 'Wedding day agenda'}
            subtitle="A timed plan of the day for your guests"
            open={open === 'agenda'}
            onToggle={toggle}
          >
            <AgendaEditor
              value={form.agenda}
              visible={form.agendaVisible}
              onChange={(list) => update('agenda', list)}
              onVisible={(on) => update('agendaVisible', on)}
              error={errors.agenda || errors.agendaVisible}
              allowed={saved.limits?.agenda === true}
              planName={saved.limits?.planName}
              eventDate={form.eventDate}
              corporate={corporate}
              onPreview={openAgendaPreview}
            />
          </Section>
          )}

          {/* Publish checklist */}
          <section className="card p-5" aria-labelledby="ready-heading">
            <h2 id="ready-heading" className="text-title-md text-espresso">
              {isLive ? 'Published' : missing.length ? 'Before you can publish' : 'Ready to publish'}
            </h2>
            {missing.length ? (
              <ul className="mt-3 space-y-1.5">
                {missing.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    <Circle size={12} aria-hidden="true" /> {FIELD_LABELS[f] || f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 flex items-center gap-2 text-body-sm text-on-surface-variant">
                <CheckCircle2 size={16} className="text-gold-text" aria-hidden="true" />
                {isLive ? (printed ? 'Guests can reply with the QR code on their card.' : 'Guests can open their personal links.') : 'All required details are filled in. Press Publish when you’re happy with it.'}
              </p>
            )}
            <p className="mt-3 text-body-sm text-on-surface-variant">Based on your last saved version.</p>
          </section>
        </div>

        {/* Live preview (desktop); printed cards have no online design, so how the QR works instead */}
        {printed ? (
          <div>
            <section className="card sticky top-24 p-6" aria-labelledby="printed-h">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                <QrCode size={22} />
              </span>
              <h2 id="printed-h" className="mt-4 font-serif text-headline-sm text-espresso">
                Printed cards with a QR code
              </h2>
              <ol className="mt-4 space-y-3 text-body-md text-espresso">
                {[
                  'Fill in your event details and reply-by date, then publish.',
                  'Add your guests one by one or import them from Excel, using the names written on their cards.',
                  'Download your QR code and print it on every card.',
                  'Guests scan it, type their name, tap it and reply. You see every reply on your guest list.',
                ].map((t, i) => (
                  <li key={t} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold/20 text-label-sm text-espresso">{i + 1}</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
              {/* What a guest sees after scanning, from the details as they're typed */}
              <p className="mt-5 text-label-md text-espresso uppercase">What guests see after scanning</p>
              <div className="mt-2 rounded-xl border border-bone bg-ivory p-5 text-center">
                <p className="text-label-sm text-gold-text uppercase">You’re invited</p>
                <p className="mt-1 font-serif text-title-lg text-espresso">{form.partnerOne || form.partnerTwo || form.celebrant || form.eventTitle ? invitationTitle(form) : 'Your names'}</p>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  {[form.eventDate ? untilText(form.eventDate) : 'Date', form.eventTime, form.venueName || 'Venue'].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-4 rounded-lg border border-bone bg-white px-3 py-2 text-left text-body-sm text-on-surface-variant">Type your name as it appears on your card</div>
                <p className="mt-2 text-body-sm text-on-surface-variant">→ they tap their name, then Attending or Not attending</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link to={`/invitations/${id}/guests`} className="btn-secondary">
                  <Users size={16} aria-hidden="true" /> Guests
                </Link>
                <Link to={`/invitations/${id}/qr`} className="btn-secondary">
                  <QrCode size={16} aria-hidden="true" /> QR code
                </Link>
              </div>
            </section>
          </div>
        ) : (
          <div className="hidden lg:block">
            <div className="sticky top-24">{preview}</div>
          </div>
        )}
      </div>

      {confirmUnpublish && (
        <Modal
          title="Unpublish this invitation?"
          onClose={() => !publishing && setConfirmUnpublish(false)}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setConfirmUnpublish(false)} disabled={publishing}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={unpublish} disabled={publishing}>
                {publishing ? 'Unpublishing…' : 'Unpublish'}
              </button>
            </>
          }
        >
          <p className="px-5 py-5 text-body-md text-on-surface-variant">
            {printed
              ? 'Guests who scan the QR code will be asked to contact you until you publish again. Their replies are kept.'
              : 'Guests who open their link will see “not available” until you publish again. Their links and replies are kept.'}
          </p>
        </Modal>
      )}

      {/* Mobile: preview toggle */}
      {!printed && <div className="fixed inset-x-0 bottom-0 z-20 border-t border-bone bg-ivory/95 p-3 backdrop-blur lg:hidden">
        <button type="button" className="btn-secondary w-full" onClick={() => setShowPreviewMobile(true)}>
          <Eye size={16} aria-hidden="true" /> Show live preview
        </button>
      </div>}
      {showPreviewMobile && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-ivory p-3 lg:hidden" role="dialog" aria-modal="true" aria-label="Live preview">
          <button type="button" className="btn-secondary mb-3" onClick={() => setShowPreviewMobile(false)}>
            <ArrowLeft size={16} aria-hidden="true" /> Back to editing
          </button>
          {preview}
        </div>
      )}
    </div>
  )
}

// Which accordion section contains a field
function sectionFor(field) {
  if (['venueName', 'address', 'mapUrl'].includes(field)) return 'venue'
  if (['celebrant', 'age', 'companyName', 'eventTitle', 'milestone'].includes(field)) return 'details'
  if (['hostLine', 'partnerOneParents', 'partnerTwoParents', 'message', 'inviteLine', 'blessing', 'ceremonies'].includes(field)) return 'wording'
  if (field === 'templateKey') return 'design'
  if (field === 'language') return 'language'
  if (field === 'musicTrack') return 'music'
  if (field === 'rsvpDeadline') return 'rsvp'
  if (field === 'agenda' || field === 'agendaVisible') return 'agenda'
  return 'details'
}

// "Replace the words in [brackets]" while the filled-in Sinhala wording still has them
function bracketHint(value) {
  return /\[[^\]]+\]/.test(value || '') ? 'Replace the words in [brackets] with the parents’ names.' : ''
}

// Fills the empty wording boxes with the traditional Sinhala wording, which the couple then edits
function SinhalaWordingFill({ form, update }) {
  const [filled, setFilled] = useState(false)
  const wording = sinhalaWording(form.eventType)
  const empty = Object.keys(wording).filter((k) => !form[k]?.trim())
  const fill = () => {
    empty.forEach((k) => update(k, wording[k]))
    setFilled(true)
  }
  return (
    <div className="rounded-lg border border-gold/40 bg-blush-tint px-4 py-3">
      <p className="text-body-sm text-espresso" lang="si">
        ශ්‍රී සුබ මංගලම් · … ආදරණීය දියණිය · … ආදරණීය පුත් · {wording.message} · ඔබට කෙරෙන සුහද ඇරයුමයි මේ
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-secondary !px-4 !py-2 text-body-sm" onClick={fill} disabled={!empty.length}>
          Use traditional Sinhala wording
        </button>
        <span className="text-body-sm text-on-surface-variant" role="status">
          {filled ? 'Filled in. Edit any line below.' : empty.length ? 'Fills the empty boxes below. You can edit every line.' : 'All wording boxes already have text.'}
        </span>
      </div>
      <p className="mt-2 text-body-sm text-on-surface-variant">To show each guest’s name in Sinhala, add it as “Name on invitation” on the Guests page.</p>
    </div>
  )
}

// Shown in place of a step a free design doesn't have (photos, music, a reply-by date)
function PremiumOnly({ children }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-bone bg-surface-container-low px-4 py-3">
      <TierBadge tier="premium" className="mt-0.5 shrink-0" />
      <p className="text-body-sm text-on-surface-variant">{children} Pick a Premium design in step 5 to use it.</p>
    </div>
  )
}
