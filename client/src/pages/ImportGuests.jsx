// Import guests from Excel / CSV (PRD 6.10) — based on the Stitch "Import Guests" screens.
// Steps: 1 Upload → 2 Match columns → 3 Review → 4 Confirm → Done (or failed → retry).
// Importing only creates guest records; it never sends invitations or messages.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { invitationTitle } from '../templates/strings'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  Info,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  XCircle,
  Link2,
  Printer,
  X,
} from 'lucide-react'
import { api } from '../lib/api'
import FormAlert from '../components/FormAlert'
import {
  FIELDS,
  ImportFileError,
  MAX_ROWS,
  autoMap,
  buildRows,
  downloadReport,
  downloadTemplateCsv,
  downloadTemplateXlsx,
  readGuestFile,
} from '../lib/guestImport'
import Loader from '../components/Loader'
import Pagination from '../components/Pagination'

const STEPS = ['Upload file', 'Match columns', 'Review', 'Confirm']

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function Stepper({ step }) {
  return (
    <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Import steps">
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'current' : 'todo'
        return (
          <li key={label} aria-current={state === 'current' ? 'step' : undefined} className={`rounded-lg border px-3 py-3 ${state === 'current' ? 'border-gold bg-blush-tint' : 'border-bone bg-white'}`}>
            <div className="flex items-center gap-2">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-label-sm ${state === 'done' ? 'bg-espresso text-white' : state === 'current' ? 'bg-gold text-espresso' : 'bg-surface-container text-on-surface-variant'}`}
                aria-hidden="true"
              >
                {state === 'done' ? <Check size={13} /> : n}
              </span>
              <span className="hidden text-label-md text-espresso uppercase sm:inline">{label}</span>
            </div>
            <span className="sr-only">
              Step {n}: {label} ({state === 'done' ? 'completed' : state === 'current' ? 'current' : 'not started'})
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function Stat({ label, value, note, tone = '' }) {
  return (
    <div className="card p-5">
      <p className="text-label-sm text-on-surface-variant uppercase">{label}</p>
      <p className={`mt-2 font-serif text-headline-md ${tone || 'text-espresso'}`}>{value}</p>
      {note && <p className="mt-1 text-body-sm text-on-surface-variant">{note}</p>}
    </div>
  )
}

const NoAutoSend = ({ physical = false }) => (
  <p className="flex items-start gap-2 rounded-lg bg-blush-tint px-4 py-3 text-body-sm text-espresso">
    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
    <span>
      {physical ? (
        <>
          <strong>Nothing is sent to anyone.</strong> Importing only adds guests to your list, so they can find their name when they scan your QR code.
        </>
      ) : (
        <>
          <strong>Invitations are not sent automatically.</strong> Importing only adds guests to your list. You choose when to share each personal link.
        </>
      )}
    </span>
  </p>
)

// ---------- row helpers ----------

// The boxes in "Fix here"
const EDIT_LABELS = { name: 'Guest name', displayName: 'Name on invitation', phone: 'Phone number', email: 'Email address', group: 'Group', cardType: 'Card type (Online or Physical)' }

// Each row's status comes from the server, in the couple's terms:
// new · same (already on your list) · changed (on your list, with different details)
// · repeat (repeated in this file) · shared (shares a phone/email with someone else) · error
const WHAT = { phone: 'phone number', email: 'email', displayName: 'name on the invitation', name: 'name' }

// What each choice does to this one row
function actionLabel(a, r) {
  if (a === 'exclude') return r.status === 'error' ? 'This row will be left out' : 'Leave this row out'
  if (r.status === 'changed') return a === 'update' ? 'Use the file’s details' : 'Keep my list as it is'
  if (r.status === 'shared') return a === 'add' ? 'Add as a new guest' : 'Skip this row'
  if (r.status === 'repeat') return `Skipped — same as row ${r.duplicate.row}`
  if (r.status === 'same') return 'Nothing to do'
  return 'Add this guest'
}

// A bad email or phone in the file is never copied onto a guest already on the list
const notCopied = (r) =>
  Object.values(r.warnings)
    .map((t) => t.replace(' The guest will be imported without it.', ' It won’t be copied to your list.').replace(' — the guest will be imported without it.', '. It won’t be copied to your list.'))
    .join(' ')

function issueText(r) {
  const d = r.duplicate
  if (r.status === 'error') {
    if (r.errors.name) return { tone: 'error', title: r.errors.name.includes('100') ? 'Needs fixing: name too long' : 'Needs fixing: no guest name', text: r.errors.name }
    if (r.errors.notes) return { tone: 'error', title: 'Needs fixing: notes too long', text: r.errors.notes }
    if (r.errors.displayName) return { tone: 'error', title: 'Needs fixing: name on invitation too long', text: r.errors.displayName }
    return { tone: 'error', title: 'Needs fixing', text: Object.values(r.errors).join(' ') }
  }
  if (r.status === 'shared') {
    const what = WHAT[d.on] || d.on
    const who = d.guestName ? `${d.guestName}` : `row ${d.row}`
    return {
      tone: 'shared',
      title: `Shares a ${what} with ${who}`,
      text:
        d.type === 'existing'
          ? `${who} is already on your list with this ${what}. Families often share one, so add ${r.values.name} as a new guest — or skip this row if it’s the same person. A typing mistake? Use “Fix here”.`
          : `Row ${d.row}${d.guestName ? ` (${d.guestName})` : ''} has the same ${what}. Add ${r.values.name} as a new guest, or skip this row if it’s the same person. A typing mistake? Use “Fix here”.`,
    }
  }
  if (r.status === 'repeat') {
    const sameName = d.physical && d.on === 'name' ? ' If this is a different person, give one of them a different name with “Fix here” (e.g. “Amal Perera (Kandy)”) — guests find themselves by name on the QR page.' : ''
    return { tone: 'repeat', title: 'Repeated in this file', text: `Same guest as row ${d.row}${d.guestName ? ` (${d.guestName})` : ''}, so this row is skipped.${sameName}` }
  }
  if (r.status === 'changed' || r.status === 'same') {
    const why = d.on === 'phone' ? `same phone number, ${d.guestPhone}` : d.on === 'email' ? `same email, ${d.guestEmail}` : d.on === 'displayName' ? 'same name on the invitation' : 'same name'
    const sameName = d.physical ? ' A different person with the same name? Give them a different name with “Fix here”.' : ''
    if (r.status === 'changed')
      return { tone: 'changed', title: 'On your list, with different details', text: `${d.guestName} is already on your list (${why}). The file has different details:${sameName}`, changes: d.changes, problems: notCopied(r) }
    return { tone: 'same', title: 'Already on your list', text: `${d.guestName} is already on your list (${why}). Nothing to do.${sameName}`, problems: notCopied(r) }
  }
  const w = Object.values(r.warnings)
  return {
    tone: 'new',
    title: w.length ? 'New guest — with a small fix' : 'New guest',
    text: w.join(' '),
    note: noPhone(r) ? 'No phone number. That’s fine — when you share their link, you’ll pick their WhatsApp chat yourself. Have a number? Add it with “Fix here”.' : '',
  }
}

// An online guest with no phone number: fine, just a heads-up (sharing picks the chat by hand)
const noPhone = (r) => r.values.cardType !== 'physical' && !r.values.phone && !r.warnings.phone

// Rows that need a decision or a look: errors, shared phones/emails, different details, small fixes
const needsAttention = (r) => ['error', 'shared', 'changed'].includes(r.status) || (r.status === 'new' && Object.keys(r.warnings).length > 0)
const CHANGE_SHOW = { online: 'Online card', physical: 'Physical card' }
const TONE_CLASS = { error: 'text-error', shared: 'text-gold-text', changed: 'text-gold-text', repeat: 'text-on-surface-variant', same: 'text-on-surface-variant', new: 'text-espresso' }
const TONE_ICON = {
  error: <XCircle size={15} aria-hidden="true" />,
  shared: <AlertTriangle size={15} aria-hidden="true" />,
  changed: <PencilLine size={15} aria-hidden="true" />,
  repeat: <Copy size={15} aria-hidden="true" />,
  same: <Check size={15} aria-hidden="true" />,
  new: <CheckCircle2 size={15} className="text-gold-text" aria-hidden="true" />,
}
const showValue = (c, v) => (c.field === 'cardType' ? CHANGE_SHOW[v] || v : v)

// ---------- page ----------

export default function ImportGuests() {
  const { id } = useParams()
  const [invitation, setInvitation] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [step, setStep] = useState(1)
  // Card types. "mixed": each guest is Online or Physical (a Card type column) — Premium Plus,
  // Signature. "printed": everyone has a printed card (Printed Cards).
  // "online": everyone gets a link (no QR code in the package).
  const limits = invitation?.limits || {}
  const physicalOnly = limits.onlineCards === false
  const cardMode = physicalOnly ? 'printed' : limits.qrRsvp ? 'mixed' : 'online'
  // What an empty Card type cell means: the package's usual type
  const usualCard = limits.plan === 'printed' ? 'physical' : 'online'
  // For a file without a Card type column: everyone in it is… (starts on the usual type)
  const [fileCard, setFileCard] = useState(null)
  const fields = FIELDS.filter((f) => (f.key === 'cardType' ? cardMode === 'mixed' : f.key === 'phone' ? cardMode !== 'printed' : true))
  const [file, setFile] = useState(null) // { name, size }
  const [sheet, setSheet] = useState(null) // { headers, rows }
  const [fileError, setFileError] = useState('')
  const [reading, setReading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const [mapping, setMapping] = useState({})
  const hasCardColumn = cardMode === 'mixed' && mapping.cardType >= 0
  // The card type sent with the rows: used for empty cells, or for the whole file without the column
  const cardType = cardMode === 'printed' ? 'physical' : cardMode === 'online' ? 'online' : hasCardColumn ? usualCard : fileCard || usualCard
  // The whole import is printed cards (wording for the steps and the summary)
  const physical = cardType === 'physical' && !hasCardColumn
  const [rows, setRows] = useState([]) // what we send: { row, name, phone, email, notes, action? }
  const [analysis, setAnalysis] = useState(null) // { summary, rows }
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('attention')
  // Review pages: the page belongs to one tab and page size (changing either goes back to page 1)
  const [pageSize, setPageSize] = useState(25)
  const [pageState, setPageState] = useState({ key: '', page: 1 })
  const [editing, setEditing] = useState(null) // row number being edited
  const [draft, setDraft] = useState({})

  const [acknowledged, setAcknowledged] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [failed, setFailed] = useState('')
  const [existing, setExisting] = useState(0) // guests already on the list
  // When a file may not fit, we count its new guests straight away (using the guessed columns):
  // null, 'checking', or the server's { limit, existing, adding, room, over }
  const [fitCheck, setFitCheck] = useState(null)

  // The guest list too: how many guests are already on it, for the package limit
  useEffect(() => {
    api(`/invitations/${id}/guests`)
      .then((d) => {
        setInvitation(d.invitation)
        // ?card=physical (from the guest list's physical-card filter) starts a file without the column on physical
        if (new URLSearchParams(window.location.search).get('card') === 'physical') setFileCard('physical')
        setExisting(d.summary?.total ?? d.guests?.length ?? 0)
      })
      .catch((err) => setLoadError(err.status === 404 ? 'This invitation could not be found.' : err.message))
  }, [id])

  // Warn before leaving mid-import
  useEffect(() => {
    if (!file || result) return
    const h = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [file, result])

  // ---- step 1 ----
  async function handleFile(f) {
    if (!f) return
    setFileError('')
    setReading(true)
    try {
      const data = await readGuestFile(f)
      const guessed = autoMap(data.headers)
      setFile({ name: f.name, size: f.size })
      setSheet(data)
      setMapping(guessed)
      setAnalysis(null)
      setResult(null)
      setFitCheck(null)
      // More rows than free places: rows already on the list don't count, so find out how many are new
      if (guestLimit && data.rows.length <= guestLimit && data.rows.length > placesLeft && guessed.name >= 0) {
        setFitCheck('checking')
        api(`/invitations/${id}/guests/import`, { method: 'POST', body: { rows: buildRows(data.rows, guessed), dryRun: true, showLimit: true, cardType: cardMode === 'mixed' && !(guessed.cardType >= 0) ? fileCard || usualCard : usualCard } })
          .then((d) => setFitCheck(d.fit || null))
          .catch(() => setFitCheck(null)) // the review step checks again anyway
      }
    } catch (err) {
      setFile({ name: f.name, size: f.size, bad: true })
      setSheet(null)
      setFileError(err instanceof ImportFileError ? err.message : 'We couldn’t read this file. Please try again.')
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // The package's guest limit (Simple Card 50, Premium and Printed Cards 150, Premium Plus 300,
  // Signature 500). A file with more rows than that can never fit, so it can't go further.
  // A file that only fits partly may still be fine (rows already on the list are updated, not
  // added), so that's a warning; the review step counts exactly.
  const guestLimit = invitation?.limits?.guests || 0
  const planName = invitation?.limits?.planName || 'Your package'
  const fileRows = sheet?.rows.length || 0
  const overLimit = Boolean(guestLimit) && fileRows > guestLimit
  const placesLeft = Math.max(0, guestLimit - existing)
  const overPlaces = Boolean(guestLimit) && !overLimit && fileRows > placesLeft
  const fitKnown = fitCheck && fitCheck !== 'checking'
  const newTooMany = Boolean(fitKnown && fitCheck.over)
  const blocked = overLimit || newTooMany

  // Take the chosen file away, to choose another
  function clearFile() {
    setFile(null)
    setSheet(null)
    setFileError('')
    setMapping({})
    setAnalysis(null)
    setFitCheck(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ---- step 2 → 3 ----
  async function check(nextRows) {
    setChecking(true)
    setError('')
    try {
      const data = await api(`/invitations/${id}/guests/import`, { method: 'POST', body: { rows: nextRows, dryRun: true, showLimit: true, cardType } })
      setAnalysis(data)
      // keep the server's resolved action on each row
      setRows(nextRows.map((r, i) => ({ ...r, action: data.rows[i].action })))
      return data
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setChecking(false)
    }
  }

  async function goToReview() {
    const built = buildRows(sheet.rows, mapping)
    const data = await check(built)
    if (!data) return
    setFilter(data.rows.some(needsAttention) ? 'attention' : 'all')
    setPageState({ key: '', page: 1 })
    setStep(3)
  }

  // ---- step 3 ----
  const merged = useMemo(() => (analysis ? analysis.rows.map((r, i) => ({ ...r, action: rows[i]?.action ?? r.action })) : []), [analysis, rows])

  const counts = useMemo(() => {
    const c = { total: merged.length, error: 0, shared: 0, changed: 0, same: 0, repeat: 0, new: 0, newFix: 0, attention: 0, unchanged: 0, addOnline: 0, addPhysical: 0, add: 0, update: 0, skip: 0, choose: 0 }
    for (const r of merged) {
      c[r.status] += 1
      if (needsAttention(r)) c.attention += 1
      if (r.status === 'new' && Object.keys(r.warnings).length) c.newFix += 1
      // Guests already on the list (or repeated rows) that are skipped aren't "left out": there's simply nothing to do
      if ((r.status === 'same' || r.status === 'repeat' || r.status === 'changed') && r.action === 'skip') c.unchanged += 1
      if (r.action === 'add') {
        c.add += 1
        if (r.values.cardType === 'physical') c.addPhysical += 1
        else c.addOnline += 1
      } else if (r.action === 'update') c.update += 1
      else if (r.action === 'choose') c.choose += 1 // a shared phone/email: waiting for their choice
      else c.skip += 1
    }
    c.leftOut = c.skip - c.unchanged
    c.onList = c.same + c.repeat
    return c
  }, [merged])

  // Guests on the list with different details in the file: kept as they are, all updated, or a mix
  const changedMode = useMemo(() => {
    const changed = merged.filter((r) => r.status === 'changed')
    return changed.every((r) => r.action === 'update') ? 'update' : changed.every((r) => r.action === 'skip') ? 'skip' : 'mixed'
  }, [merged])

  // With the actions chosen now, do the new guests fit the package?
  const fit = analysis?.fit
  const tooManyNew = fit ? Math.max(0, fit.existing + counts.add - fit.limit) : 0
  const placesFree = fit ? fit.limit - fit.existing - counts.add : Infinity

  const filtered = useMemo(() => {
    return merged
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => {
        if (filter === 'attention') return needsAttention(r)
        if (filter === 'new') return r.status === 'new'
        if (filter === 'onlist') return r.status === 'same' || r.status === 'repeat'
        return true
      })
  }, [merged, filter])

  const pageKey = `${filter}|${pageSize}`
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const page = Math.min(pageState.key === pageKey ? pageState.page : 1, pageCount)
  const setPage = (n) => setPageState({ key: pageKey, page: Math.max(1, Math.min(pageCount, n)) })

  function setAction(index, action) {
    setRows((list) => list.map((r, i) => (i === index ? { ...r, action } : r)))
  }

  function setAllChanged(action) {
    setRows((list) => list.map((r, i) => (merged[i].status === 'changed' ? { ...r, action } : r)))
  }

  async function saveEdit(index) {
    const next = rows.map((r, i) => (i === index ? { ...r, ...draft, action: undefined } : r))
    setEditing(null)
    await check(next)
  }

  // ---- step 4 ----
  async function runImport() {
    setImporting(true)
    setFailed('')
    try {
      const data = await api(`/invitations/${id}/guests/import`, { method: 'POST', body: { rows, dryRun: false, cardType } })
      setResult(data)
      setStep(5)
    } catch (err) {
      setFailed(err.status === 0 ? 'We couldn’t reach the server. Check your internet connection.' : err.message)
    } finally {
      setImporting(false)
    }
  }

  function startOver() {
    setStep(1)
    setFile(null)
    setSheet(null)
    setAnalysis(null)
    setRows([])
    setResult(null)
    setFailed('')
    setAcknowledged(false)
  }

  // ---------- render ----------

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
      <Loader label="Loading" />
    )
  }

  const names = invitationTitle(invitation)
  const guestsUrl = `/invitations/${id}/guests`

  // Importing from Excel or CSV is part of Premium and above (Simple Card adds guests one by one)
  if (invitation.limits && !invitation.limits.import) {
    return (
      <div className="mx-auto max-w-xl px-margin-mobile py-16 text-center">
        <h1 className="font-serif text-headline-md text-espresso">Import guests from Excel</h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          Importing a guest list from Excel or CSV is part of Premium and above. Your package is {invitation.limits.planName}, so add guests one at a time from your guest
          list.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to={guestsUrl} className="btn-secondary">
            Back to guests
          </Link>
          <a href="/#pricing" className="btn-primary">
            See the packages
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1100px] px-margin-mobile py-10 md:px-margin">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-label-sm text-on-surface-variant uppercase">
        <Link to="/dashboard" className="hover:text-gold-text">
          Invitations
        </Link>
        <span className="mx-1">/</span>
        <Link to={guestsUrl} className="hover:text-gold-text">
          {names}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-gold-text">Import guests</span>
      </nav>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Import Guests</h1>
        {step < 5 && (
          <Link to={guestsUrl} className="inline-flex items-center gap-1.5 text-label-md text-on-surface-variant uppercase hover:text-gold-text">
            <ArrowLeft size={15} aria-hidden="true" /> Back to guest list
          </Link>
        )}
      </div>

      {step < 5 && <Stepper step={step} />}

      {/* ================= STEP 1: UPLOAD ================= */}
      {step === 1 && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <section className="card p-6" aria-labelledby="tpl-h">
            <p className="eyebrow">Step 1</p>
            <h2 id="tpl-h" className="mt-2 font-serif text-headline-sm text-espresso">
              Get the template
            </h2>
            <p className="mt-2 text-body-md text-on-surface-variant">Start from our file so the columns are in the right place. You can also use your own spreadsheet — you’ll match the columns next.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className="btn-primary px-5 py-2.5" onClick={() => downloadTemplateXlsx(cardMode)}>
                <Download size={16} aria-hidden="true" /> Excel (.xlsx)
              </button>
              <button type="button" className="btn-secondary px-5 py-2.5" onClick={() => downloadTemplateCsv(cardMode)}>
                <Download size={16} aria-hidden="true" /> CSV (.csv)
              </button>
            </div>
            <h3 className="mt-6 text-label-md text-espresso uppercase">Columns</h3>
            <ul className="mt-2 divide-y divide-bone rounded-lg border border-bone">
              {fields.map((f) => (
                <li key={f.key} className="flex items-center justify-between px-4 py-2.5 text-body-sm">
                  <span className="text-espresso">{f.label}</span>
                  <span className={f.required ? 'font-semibold text-gold-text' : 'text-on-surface-variant'}>{f.required ? 'Required' : 'Optional'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-body-sm text-on-surface-variant">
              {cardMode === 'printed'
                ? 'One card per row. Use each name as written on the card: guests type it to find themselves. No phone numbers needed.'
                : 'One person per row. Plus-ones can’t be added. Add a phone number to share by WhatsApp.'}
            </p>
            {cardMode === 'mixed' && (
              <div className="mt-3 rounded-lg border border-gold/30 bg-blush-tint px-4 py-3 text-body-sm text-espresso">
                <p className="font-semibold">Card type: Online or Physical</p>
                <p className="mt-1 text-on-surface-variant">
                  Write <strong className="text-espresso">Online</strong> for guests who get a personal link on WhatsApp, and <strong className="text-espresso">Physical</strong> for guests who get a printed card and reply with the QR code. Leave it empty for{' '}
                  {usualCard === 'physical' ? 'a printed card' : 'an online card'}. Physical-card guests don’t need a phone number.
                </p>
              </div>
            )}
          </section>

          <section className="card p-6" aria-labelledby="up-h">
            <p className="eyebrow">Step 2</p>
            <h2 id="up-h" className="mt-2 font-serif text-headline-sm text-espresso">
              Upload your guest list
            </h2>



            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                handleFile(e.dataTransfer.files?.[0])
              }}
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${dragOver ? 'border-gold bg-blush-tint' : 'border-outline-variant bg-ivory hover:border-gold'}`}
            >
              <Upload size={28} className="text-gold-text" aria-hidden="true" />
              <span className="mt-3 text-title-md text-espresso">{reading ? 'Reading file…' : 'Drag & drop your file here'}</span>
              <span className="mt-1 text-body-sm text-on-surface-variant">or click to choose a file</span>
              <span className="mt-3 text-label-sm text-on-surface-variant uppercase">
                .xlsx or .csv · up to 5 MB · up to {(guestLimit ? Math.min(guestLimit, MAX_ROWS) : MAX_ROWS).toLocaleString()} guests
                {guestLimit > 0 && existing > 0 && ` · ${placesLeft.toLocaleString()} places left`}
              </span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0])}
                disabled={reading}
              />
            </label>

            {file && (
              <div className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${file.bad || blocked ? 'border-error bg-error-container' : 'border-bone bg-white'}`} role={file.bad || blocked ? 'alert' : 'status'}>
                {file.bad || blocked ? <XCircle className="mt-0.5 shrink-0 text-error" size={20} aria-hidden="true" /> : <FileSpreadsheet className="mt-0.5 shrink-0 text-gold-text" size={20} aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title-md text-espresso">{file.name}</p>
                  <p className="text-body-sm text-on-surface-variant">{formatSize(file.size)}</p>
                  {file.bad ? (
                    <p className="mt-1 text-body-sm text-on-error-container">{fileError}</p>
                  ) : overLimit ? (
                    <>
                      <p className="mt-1 text-body-sm text-on-error-container">
                        This file has {fileRows.toLocaleString()} guests, but {planName} includes up to {guestLimit.toLocaleString()} guests per invitation.
                      </p>
                      <p className="mt-1 text-body-sm text-on-error-container">
                        Remove some rows and upload it again, or{' '}
                        <a href="/#pricing" className="font-semibold underline underline-offset-2">
                          see the packages
                        </a>
                        .
                      </p>
                    </>
                  ) : newTooMany ? (
                    <>
                      <p className="mt-1 text-body-sm text-on-error-container">
                        {fileRows - fitCheck.adding > 0 && `${(fileRows - fitCheck.adding).toLocaleString()} of the ${fileRows.toLocaleString()} guests in this file are already on your list. `}
                        {fitCheck.adding.toLocaleString()} {fitCheck.adding === 1 ? 'is' : 'are'} new, but{' '}
                        {fitCheck.room > 0 ? `there’s only room for ${fitCheck.room.toLocaleString()} more` : 'your list is full'} ({fitCheck.existing.toLocaleString()} of {fitCheck.limit.toLocaleString()} guests on {planName}).
                      </p>
                      <p className="mt-1 text-body-sm text-on-error-container">
                        {fitCheck.room > 0 ? `Keep at most ${fitCheck.room.toLocaleString()} new guests in the file` : 'Take the new guests out of the file'}, remove guests from your list, or{' '}
                        <a href="/#pricing" className="font-semibold underline underline-offset-2">
                          see the packages
                        </a>
                        .
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-body-sm text-espresso">
                        <CheckCircle2 size={14} className="mr-1 inline text-gold-text" aria-hidden="true" />
                        {sheet.rows.length} guest row{sheet.rows.length === 1 ? '' : 's'} found · {sheet.headers.length} columns
                      </p>
                      {fitCheck === 'checking' && <p className="mt-2 text-body-sm text-on-surface-variant">Checking how many of them are new…</p>}
                      {fitKnown && (
                        <p className="mt-2 flex items-start gap-1.5 text-body-sm text-espresso">
                          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                          <span>
                            {fitCheck.adding === 0
                              ? `All ${fileRows.toLocaleString()} guests are already on your list, so nobody new will be added. The review step shows any new details for them.`
                              : `${fitCheck.adding.toLocaleString()} new guest${fitCheck.adding === 1 ? '' : 's'} and ${(fileRows - fitCheck.adding).toLocaleString()} already on your list — it fits your ${planName} package.`}
                          </span>
                        </p>
                      )}
                      {overPlaces && !fitCheck && (
                        <p className="mt-2 flex items-start gap-1.5 text-body-sm text-espresso">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                          <span>
                            {placesLeft > 0
                              ? `You already have ${existing.toLocaleString()} guests, so there’s room for ${placesLeft.toLocaleString()} more on ${planName}.`
                              : `You already have ${existing.toLocaleString()} guests, so your ${planName} list is full and no new guests can be added.`}{' '}
                            Guests already on your list can still be updated; the review step shows exactly how many are new.
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label={`Remove ${file.name}`}
                  title="Remove this file"
                  className="-mt-1 -mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container hover:text-espresso"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="mt-5">
              <NoAutoSend physical={physical} />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Link to={guestsUrl} className="btn-secondary">
                Cancel
              </Link>
              <button type="button" className="btn-primary" disabled={!sheet || blocked || fitCheck === 'checking'} onClick={() => setStep(2)} title={blocked ? 'This file has more new guests than your package allows' : undefined}>
                Continue <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ================= STEP 2: MAP ================= */}
      {step === 2 && sheet && (
        <section className="mt-8" aria-labelledby="map-h">
          <h2 id="map-h" className="font-serif text-headline-sm text-espresso">
            Match your columns
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Tell us which column in <strong>{file.name}</strong> holds each detail. We’ve made a guess — check it and change anything that’s wrong.
          </p>

          {mapping.name < 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-error bg-error-container px-4 py-3 text-body-sm text-on-error-container" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              Choose the column that has your guests’ names. It’s needed to greet each guest by name.
            </div>
          )}
          <div className="mt-4">
            <FormAlert>{error}</FormAlert>
          </div>

          <div className="card mt-4 divide-y divide-bone">
            {fields.map((f) => {
              const col = mapping[f.key]
              const samples = col >= 0 ? sheet.rows.map((r) => r.cells[col]).filter(Boolean).slice(0, 3) : []
              const takenBy = (i) => fields.find((o) => o.key !== f.key && mapping[o.key] === i)
              return (
                <div key={f.key} className="grid gap-3 px-5 py-4 md:grid-cols-[200px_260px_1fr] md:items-center">
                  <label htmlFor={`map-${f.key}`} className="text-title-md text-espresso">
                    {f.label} {f.required && <span className="text-label-sm text-gold-text uppercase">Required</span>}
                  </label>
                  <select
                    id={`map-${f.key}`}
                    value={col}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: Number(e.target.value) }))}
                    className={`rounded-lg border bg-white px-3 py-2.5 text-body-md outline-none focus:border-gold ${f.required && col < 0 ? 'border-error' : 'border-bone'}`}
                  >
                    <option value={-1}>{f.required ? '— Choose a column —' : 'Don’t import'}</option>
                    {sheet.headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h}
                        {takenBy(i) ? ` (also used for ${takenBy(i).label})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="truncate text-body-sm text-on-surface-variant">{samples.length ? `e.g. ${samples.join(', ')}` : col >= 0 ? 'This column is empty' : ''}</p>
                </div>
              )
            })}
          </div>
          {/* No Card type column: one answer for the whole file (it starts on the package's usual type) */}
          {cardMode === 'mixed' && !hasCardColumn && (
            <fieldset className="card mt-4 p-5">
              <legend className="sr-only">Card type for everyone in this file</legend>
              <p className="text-title-md text-espresso">Your file has no Card type column. Everyone in this file is:</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  { value: 'online', label: 'Online card', note: 'Each gets a personal link', Icon: Link2 },
                  { value: 'physical', label: 'Physical card', note: 'They reply by the QR code', Icon: Printer },
                ].map((o) => (
                  <label
                    key={o.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${cardType === o.value ? 'border-gold bg-gold/10' : 'border-bone bg-white hover:border-gold'}`}
                  >
                    <input type="radio" name="fileCard" value={o.value} checked={cardType === o.value} onChange={() => setFileCard(o.value)} className="sr-only" />
                    <o.Icon size={17} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                    <span>
                      <span className="block text-title-md text-espresso">{o.label}</span>
                      <span className="block text-body-sm text-on-surface-variant">{o.note}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-body-sm text-on-surface-variant">To mix both in one file, add a Card type column with Online or Physical for each guest.</p>
            </fieldset>
          )}
          {mapping.group >= 0 && (
            <p className="mt-3 flex items-center gap-2 text-body-sm text-on-surface-variant">
              <Info size={15} aria-hidden="true" /> Guests are put in the group from that column (e.g. “Bride’s family”), so you can filter and count them by group.
            </p>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={16} aria-hidden="true" /> Change file
            </button>
            <button type="button" className="btn-primary" disabled={mapping.name < 0 || checking} onClick={goToReview}>
              {checking ? 'Checking your guests…' : 'Check my guests'} {!checking && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </div>
        </section>
      )}

      {/* ================= STEP 3: REVIEW ================= */}
      {step === 3 && analysis && (
        <section className="mt-8" aria-labelledby="rev-h">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="rev-h" className="font-serif text-headline-sm text-espresso">
                Review your guests
              </h2>
              <p className="mt-1 text-body-md text-on-surface-variant">Nothing is saved yet. Fix or decide on any flagged rows, then continue.</p>
            </div>
            {counts.total !== counts.new - counts.newFix && (
              <button type="button" className="btn-secondary shrink-0" onClick={() => downloadReport(merged, rows, `guest-import-issues.csv`)}>
                <Download size={16} aria-hidden="true" /> Download issues (.csv)
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Rows in file" value={counts.total} />
            <Stat label="New guests" value={counts.new} note={counts.newFix ? `${counts.newFix} with a small fix` : counts.new ? 'Ready to add' : 'None'} />
            <Stat label="Needs your attention" value={counts.attention} note={counts.choose ? `${counts.choose} waiting for your choice` : counts.attention ? 'Have a look before you continue' : 'Nothing'} tone={counts.choose || counts.error ? 'text-error' : ''} />
            <Stat label="Already on your list" value={counts.onList} note={counts.onList ? (counts.repeat ? `Incl. ${counts.repeat} repeated in this file` : 'Nothing to do') : 'None'} />
          </div>

          <div className="mt-4">
            <FormAlert>{error}</FormAlert>
          </div>

          {tooManyNew > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-error bg-error-container p-4 text-on-error-container" role="alert">
              <XCircle size={20} className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
              <p className="text-body-md">
                This would add {counts.add.toLocaleString()} new guests, but {fit.room > 0 ? `there’s only room for ${fit.room.toLocaleString()} more` : 'your list is full'} ({fit.existing.toLocaleString()} of {fit.limit.toLocaleString()} on {fit.planName}). Set {tooManyNew.toLocaleString()} more {tooManyNew === 1 ? 'row' : 'rows'} to “Skip this row” or “Leave this row out”, or{' '}
                <a href="/#pricing" className="font-semibold underline underline-offset-2">
                  see the packages
                </a>
                .
              </p>
            </div>
          )}

          {/* Guests on the list with different details in the file: one choice for all of them */}
          {counts.changed > 1 && (
            <section className="card mt-6 p-5" aria-labelledby="chg-h">
              <h2 id="chg-h" className="text-title-md text-espresso">
                {counts.changed} guests on your list have different details in this file
              </h2>
              <p className="mt-1 text-body-sm text-on-surface-variant">Choose for all of them here, or one by one below.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Guests with different details">
                {[
                  ['skip', 'Keep my list as it is', 'Nothing changes on your list.'],
                  ['update', 'Use the file’s details', 'Blank cells don’t clear anything, and their link and reply stay the same.'],
                ].map(([v, title, note]) => {
                  const on = changedMode === v
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setAllChanged(v)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${on ? 'border-gold bg-blush-tint' : 'border-bone bg-white hover:border-gold'}`}
                    >
                      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? 'border-espresso' : 'border-bone'}`} aria-hidden="true">
                        {on && <span className="h-2.5 w-2.5 rounded-full bg-espresso" />}
                      </span>
                      <span>
                        <span className="block text-body-md font-semibold text-espresso">{title}</span>
                        <span className="mt-0.5 block text-body-sm text-on-surface-variant">{note}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {changedMode === 'mixed' && <p className="mt-3 text-body-sm text-on-surface-variant">You’ve chosen differently for some of them.</p>}
            </section>
          )}

          {/* Which rows to show */}
          <div className="mt-6 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-bone [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Show rows">
            {[
              ['attention', 'Needs your attention', counts.attention],
              ['new', 'New guests', counts.new],
              ['onlist', 'Already on your list', counts.onList],
              ['all', 'All rows', counts.total],
            ]
              .filter(([v, , n]) => n > 0 || v === 'all' || v === filter)
              .map(([v, label, n]) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={filter === v}
                  onClick={() => {
                    setFilter(v)
                  }}
                  className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-body-sm whitespace-nowrap ${filter === v ? 'border-espresso font-semibold text-espresso' : 'border-transparent text-on-surface-variant hover:text-espresso'}`}
                >
                  {label}
                  <span className={`rounded-full px-2 py-0.5 text-label-sm tabular-nums ${filter === v ? 'bg-espresso text-white' : 'bg-surface-container text-on-surface-variant'}`}>{n}</span>
                </button>
              ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card mt-4 px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto text-gold-text" aria-hidden="true" />
              <p className="mt-3 text-body-md text-espresso">{filter === 'attention' ? 'Nothing needs your attention — every row is ready.' : 'No rows in this view.'}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {filtered.slice((page - 1) * pageSize, page * pageSize).map((r) => {
                const issue = issueText(r)
                const raw = rows[r.index]
                const isEditing = editing === r.index
                return (
                  <li key={r.row} className={`card grid gap-4 p-4 md:grid-cols-[70px_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)] ${r.action === 'skip' || r.action === 'exclude' ? 'opacity-75' : ''}`}>
                    <p className="text-label-md text-on-surface-variant">Row {r.row}</p>

                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          {[...(r.values.cardType === 'physical' ? ['name', 'displayName'] : ['name', 'displayName', 'phone']), ...(r.warnings.group ? ['group'] : []), ...(r.warnings.cardType ? ['cardType'] : [])].map((k) => (
                            <label key={k} className="block">
                              <span className="text-label-sm text-on-surface-variant uppercase">{EDIT_LABELS[k] || k}</span>
                              <input
                                value={draft[k] ?? ''}
                                onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                                className="mt-0.5 w-full rounded-lg border border-bone bg-white px-3 py-2 text-body-sm outline-none focus:border-gold"
                              />
                            </label>
                          ))}
                          <div className="flex gap-2">
                            <button type="button" className="btn-primary px-4 py-1.5 text-body-sm" onClick={() => saveEdit(r.index)} disabled={checking}>
                              {checking ? 'Checking…' : 'Save & recheck'}
                            </button>
                            <button type="button" className="btn-secondary px-4 py-1.5 text-body-sm" onClick={() => setEditing(null)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className={`truncate text-title-md ${r.values.name ? 'text-espresso' : 'text-error italic'}`}>{r.values.name || raw.name || '[No name]'}</p>
                          {raw.displayName && <p className="truncate text-body-sm text-espresso">{raw.displayName}</p>}
                          {cardMode === 'mixed' && (
                            <p className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm ${r.values.cardType === 'physical' ? 'bg-[#f1ebf8] text-[#5b3d86]' : 'bg-surface-container text-on-surface-variant'}`}>
                              {r.values.cardType === 'physical' ? <Printer size={12} aria-hidden="true" /> : <Link2 size={12} aria-hidden="true" />}
                              {r.values.cardType === 'physical' ? 'Physical card' : 'Online card'}
                            </p>
                          )}
                          {r.values.cardType !== 'physical' && <p className={`truncate text-body-sm ${r.warnings.phone ? 'text-error line-through' : 'text-on-surface-variant'}`}>{raw.phone || '—'}</p>}
                          <p className={`truncate text-body-sm ${r.warnings.email ? 'text-error line-through' : 'text-on-surface-variant'}`}>{raw.email || ''}</p>
                          {r.values.group && <p className="truncate text-body-sm text-gold-text">Group: {r.values.group}</p>}
                          {raw.notes && <p className="truncate text-body-sm text-on-surface-variant italic">{raw.notes}</p>}
                        </>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className={`flex items-center gap-1.5 text-body-sm font-semibold ${TONE_CLASS[issue.tone]}`}>
                        {TONE_ICON[issue.tone]}
                        {issue.title}
                      </p>
                      {issue.text && <p className="mt-0.5 text-body-sm text-on-surface-variant">{issue.text}</p>}
                      {issue.note && <p className="mt-0.5 text-body-sm text-on-surface-variant italic">{issue.note}</p>}
                      {issue.problems && (
                        <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">
                          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                          {issue.problems}
                        </p>
                      )}
                      {issue.changes && (
                        <ul className="mt-2 space-y-1.5 rounded-lg bg-blush-tint px-3 py-2 text-body-sm">
                          {issue.changes.map((c) => (
                            <li key={c.field}>
                              <span className="block text-label-sm text-on-surface-variant uppercase">{c.label}</span>
                              <span className="text-on-surface-variant">On your list: </span>
                              <span className="text-espresso">{c.from ? showValue(c, c.from) : '(empty)'}</span>
                              <span className="text-on-surface-variant"> · In this file: </span>
                              <span className="font-semibold text-espresso">{showValue(c, c.to)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {/* Errors, small fixes, and duplicates (a repeated name, phone or email is often a typing mistake) */}
                      {!isEditing && (r.status !== 'new' || Object.keys(r.warnings).length > 0 || noPhone(r)) && r.status !== 'same' && (
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-gold-text underline underline-offset-4"
                          onClick={() => {
                            setEditing(r.index)
                            setDraft({ name: raw.name, displayName: raw.displayName ?? '', phone: raw.phone, email: raw.email, ...(r.warnings.group && { group: raw.group }), ...(r.warnings.cardType && { cardType: raw.cardType }) })
                          }}
                        >
                          <PencilLine size={14} aria-hidden="true" /> Fix here
                        </button>
                      )}
                    </div>

                    <fieldset className={`min-w-0 self-start ${r.action === 'choose' ? 'rounded-lg ring-2 ring-gold/60 ring-offset-2' : ''}`}>
                      <legend className="sr-only">What to do with row {r.row}</legend>
                      {r.action === 'choose' && <p className="mb-1.5 text-label-sm font-semibold text-gold-text uppercase">Choose one</p>}
                      {r.allowedActions.length === 1 ? (
                        <p className="text-body-sm text-on-surface-variant">{r.action === 'exclude' ? 'This row will be left out' : actionLabel(r.action, r)}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {r.allowedActions.map((a) => {
                            // Adding another guest needs a free place on the list
                            const full = a === 'add' && r.action !== 'add' && placesFree <= 0
                            return (
                              <label
                                key={a}
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-body-sm ${r.action === a ? 'border-gold bg-blush-tint' : 'border-bone bg-white'} ${full ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                              >
                                <input type="radio" name={`act-${r.row}`} checked={r.action === a} onChange={() => setAction(r.index, a)} disabled={full} className="accent-espresso" />
                                <span>
                                  {actionLabel(a, r)}
                                  {full && <span className="block text-label-sm text-on-surface-variant">Your list is full</span>}
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </fieldset>
                  </li>
                )
              })}
            </ul>
          )}
          <Pagination
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPage={(n) => {
              setPage(n)
              document.getElementById('rev-h')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            onPageSize={setPageSize}
            label="Review pages"
            className="mt-4"
          />

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} aria-hidden="true" /> Back to columns
            </button>
            <button type="button" className="btn-primary" onClick={() => setStep(4)} disabled={counts.choose > 0 || counts.add + counts.update === 0 || tooManyNew > 0 || checking || editing !== null}>
              Continue <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          {counts.choose > 0 ? (
            <p className="mt-2 text-right text-body-sm text-gold-text">
              {counts.choose} row{counts.choose === 1 ? ' shares' : 's share'} a phone number with another guest — choose “Add as a new guest” or “Skip this row” for {counts.choose === 1 ? 'it' : 'each'} (in Needs your attention).
            </p>
          ) : (
            counts.add + counts.update === 0 && (
              <p className="mt-2 text-right text-body-sm text-on-surface-variant">
                {counts.leftOut === 0 ? 'Everyone in this file is already on your list — nothing to import.' : 'Every row is skipped — nothing to import.'}
              </p>
            )
          )}
        </section>
      )}

      {/* ================= STEP 4: CONFIRM ================= */}
      {step === 4 && analysis && (
        <section className="mx-auto mt-8 max-w-3xl" aria-labelledby="conf-h">
          <h2 id="conf-h" className="font-serif text-headline-sm text-espresso">
            Ready to import?
          </h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            From <strong>{file.name}</strong> into {names}’s guest list{physical && !physicalOnly ? ', as physical-card guests' : ''}.
          </p>

          <div className={`mt-6 grid gap-4 sm:grid-cols-2 ${counts.unchanged ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            <Stat
              label="New guests to add"
              value={counts.add}
              note={cardMode === 'mixed' && counts.addOnline && counts.addPhysical ? `${counts.addOnline} online · ${counts.addPhysical} physical` : physical || (counts.add && !counts.addOnline) ? 'They reply by the QR code' : 'Each gets a personal link'}
            />
            <Stat label="Guests to update" value={counts.update} note={physical ? 'Moved to physical card; new details filled in' : 'New details from the file filled in'} />
            {counts.unchanged > 0 && <Stat label="Already on your list" value={counts.unchanged} note="Nothing new — no change" />}
            <Stat label="Rows left out" value={counts.leftOut} note={counts.leftOut ? 'Rows you skipped, and rows with errors' : 'None'} />
          </div>
          <p
            className="mt-4 text-center text-body-md text-espresso"
            aria-label={`${counts.add} add plus ${counts.update} update${counts.unchanged ? ` plus ${counts.unchanged} no change` : ''} plus ${counts.leftOut} left out equals ${counts.total} rows`}
          >
            {counts.add} add + {counts.update} update{counts.unchanged ? ` + ${counts.unchanged} no change` : ''} + {counts.leftOut} left out = <strong>{counts.total} rows</strong>
          </p>

          <div className="mt-6">
            <NoAutoSend physical={physical} />
          </div>

          {counts.leftOut > 0 && (
            <label className="mt-4 flex items-start gap-3 rounded-lg border border-bone bg-white px-4 py-3 text-body-md text-espresso">
              <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-1 accent-espresso" />
              <span>
                I understand {counts.leftOut === 1 ? '1 row' : `${counts.leftOut} rows`} from the file won’t be added or used to update anyone. I can download {counts.leftOut === 1 ? 'it' : 'them'} after the import.
              </span>
            </label>
          )}

          {failed && (
            <div className="mt-6 rounded-lg border border-error bg-error-container p-5" role="alert">
              <p className="flex items-center gap-2 text-title-md text-on-error-container">
                <XCircle size={18} aria-hidden="true" /> The import didn’t finish
              </p>
              <p className="mt-1 text-body-md text-on-error-container">{failed}</p>
              <p className="mt-1 text-body-sm text-on-error-container">Your guest list wasn’t changed. Your file and choices are still here, so you can try again.</p>
              <button type="button" className="btn-primary mt-4" onClick={runImport} disabled={importing}>
                <RefreshCw size={16} aria-hidden="true" /> {importing ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(3)} disabled={importing}>
              <ArrowLeft size={16} aria-hidden="true" /> Back to review
            </button>
            {!failed && (
              <button type="button" className="btn-primary" onClick={runImport} disabled={importing || (counts.leftOut > 0 && !acknowledged)}>
                <UserPlus size={16} aria-hidden="true" /> {importing ? 'Importing…' : `Import ${counts.add + counts.update} guest${counts.add + counts.update === 1 ? '' : 's'}`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ================= DONE ================= */}
      {step === 5 && result && (
        <section className="mx-auto mt-8 max-w-3xl text-center" aria-labelledby="done-h">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e3f4e8] text-[#1e6b3a]" aria-hidden="true">
            <CheckCircle2 size={30} />
          </span>
          <h2 id="done-h" className="mt-5 font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">
            Import complete
          </h2>
          <p className="mt-2 text-body-md text-on-surface-variant">
            {file.name} · {result.summary.total} rows
          </p>
          <div className={`mt-8 grid gap-4 text-left sm:grid-cols-2 ${counts.unchanged ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            <Stat
              label="Guests added"
              value={result.summary.added}
              note={result.summary.addOnline && result.summary.addPhysical ? `${result.summary.addOnline} online · ${result.summary.addPhysical} physical` : result.summary.addPhysical ? 'With physical cards' : 'With their own personal links'}
            />
            <Stat label="Guests updated" value={result.summary.updated} />
            {counts.unchanged > 0 && <Stat label="Already on your list" value={counts.unchanged} note="No change" />}
            <Stat label="Rows left out" value={Math.max(0, result.summary.skip - counts.unchanged)} />
          </div>
          <p className="mt-6 text-body-md text-on-surface-variant">{result.summary.addPhysical && result.summary.addOnline
              ? 'No invitations have been sent. Share the online guests’ links from your guest list, and download your QR code to print on the cards.'
              : result.summary.addPhysical || physical
              ? 'They can reply by scanning the QR code on their card. Download the code from the QR code page.'
              : 'No invitations have been sent. Share each guest’s link from your guest list when you’re ready.'}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to={guestsUrl} className="btn-primary">
              <Users size={16} aria-hidden="true" /> Go to guest list
            </Link>
            {result.summary.skip > 0 && (
              <button type="button" className="btn-secondary" onClick={() => downloadReport(result.rows, rows, 'guest-import-left-out.csv', { onlyLeftOut: true })}>
                <Download size={16} aria-hidden="true" /> Download left-out rows
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={startOver}>
              <Upload size={16} aria-hidden="true" /> Import another file
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
