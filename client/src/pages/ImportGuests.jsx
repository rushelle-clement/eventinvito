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

const STEPS = ['Upload file', 'Match columns', 'Review', 'Confirm']
const PAGE = 100

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

const ACTION_LABELS = { add: 'Add as new guest', update: 'Update existing guest', skip: 'Skip this row', exclude: 'Leave out' }

function issueText(r) {
  if (r.errors.name) return { tone: 'error', title: r.errors.name.includes('100') ? 'Name too long' : 'Missing guest name', text: r.errors.name }
  if (r.errors.notes) return { tone: 'error', title: 'Notes too long', text: r.errors.notes }
  if (r.errors.displayName) return { tone: 'error', title: 'Name on invitation too long', text: r.errors.displayName }
  // Physical cards: guests find themselves by name, so the same name can't be added twice
  if (r.duplicate?.physical && r.duplicate.type === 'existing')
    return {
      tone: 'dup',
      title: 'Already has a physical card',
      text: `“${r.duplicate.guestName}” is already on your list with a physical card. Skip it, update that guest, or change the name in your file (e.g. add their town).`,
    }
  if (r.duplicate?.physical)
    return {
      tone: 'dup',
      title: 'Same name as another physical card',
      text: `Same name as row ${r.duplicate.row}. Guests find themselves by name on the QR page, so give one of them a different name in your file (e.g. “Amal Perera (Kandy)”) and upload it again.`,
    }
  if (r.duplicate?.type === 'existing')
    return {
      tone: 'dup',
      title: 'Already on your list?',
      text: `Same ${r.duplicate.on} as “${r.duplicate.guestName}”${r.duplicate.guestPhone ? ` (${r.duplicate.guestPhone})` : ''}.`,
    }
  if (r.duplicate?.type === 'file') return { tone: 'dup', title: 'Duplicate in this file', text: `Same ${r.duplicate.on} as row ${r.duplicate.row}.` }
  const w = Object.values(r.warnings)
  if (w.length) return { tone: 'warn', title: 'Will be imported with a change', text: w.join(' ') }
  return null
}

const rowKind = (r) => (Object.keys(r.errors).length ? 'error' : r.duplicate ? 'dup' : Object.keys(r.warnings).length ? 'warn' : 'ok')

// ---------- page ----------

export default function ImportGuests() {
  const { id } = useParams()
  const [invitation, setInvitation] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [step, setStep] = useState(1)
  // Online-card and physical-card guests are imported from separate files
  const [cardType, setCardType] = useState(() => (new URLSearchParams(window.location.search).get('card') === 'physical' ? 'physical' : 'online'))
  // Printed Cards package: every guest has a physical card
  const physicalOnly = invitation?.limits?.onlineCards === false
  const physical = physicalOnly || cardType === 'physical'
  const fields = physical ? FIELDS.filter((f) => f.key !== 'phone') : FIELDS
  const [file, setFile] = useState(null) // { name, size }
  const [sheet, setSheet] = useState(null) // { headers, rows }
  const [fileError, setFileError] = useState('')
  const [reading, setReading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const [mapping, setMapping] = useState({})
  const [rows, setRows] = useState([]) // what we send: { row, name, phone, email, notes, action? }
  const [analysis, setAnalysis] = useState(null) // { summary, rows }
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('issues')
  const [shown, setShown] = useState(PAGE)
  const [editing, setEditing] = useState(null) // row number being edited
  const [draft, setDraft] = useState({})

  const [acknowledged, setAcknowledged] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [failed, setFailed] = useState('')

  useEffect(() => {
    api(`/invitations/${id}`)
      .then((d) => setInvitation(d.invitation))
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
      setFile({ name: f.name, size: f.size })
      setSheet(data)
      setMapping(autoMap(data.headers))
      setAnalysis(null)
      setResult(null)
    } catch (err) {
      setFile({ name: f.name, size: f.size, bad: true })
      setSheet(null)
      setFileError(err instanceof ImportFileError ? err.message : 'We couldn’t read this file. Please try again.')
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // ---- step 2 → 3 ----
  async function check(nextRows) {
    setChecking(true)
    setError('')
    try {
      const data = await api(`/invitations/${id}/guests/import`, { method: 'POST', body: { rows: nextRows, dryRun: true, cardType: physical ? 'physical' : 'online' } })
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
    const hasIssues = data.rows.some((r) => rowKind(r) !== 'ok')
    setFilter(hasIssues ? 'issues' : 'all')
    setShown(PAGE)
    setStep(3)
  }

  // ---- step 3 ----
  const merged = useMemo(() => (analysis ? analysis.rows.map((r, i) => ({ ...r, action: rows[i]?.action ?? r.action })) : []), [analysis, rows])

  const counts = useMemo(() => {
    const c = { total: merged.length, ok: 0, error: 0, dup: 0, warn: 0, add: 0, update: 0, skip: 0 }
    for (const r of merged) {
      c[rowKind(r)] += 1
      if (r.action === 'add') c.add += 1
      else if (r.action === 'update') c.update += 1
      else c.skip += 1
    }
    return c
  }, [merged])

  const filtered = useMemo(() => {
    return merged
      .map((r, i) => ({ ...r, index: i }))
      .filter((r) => {
        const k = rowKind(r)
        if (filter === 'issues') return k !== 'ok'
        if (filter === 'error') return k === 'error'
        if (filter === 'dup') return k === 'dup'
        if (filter === 'warn') return k === 'warn'
        return true
      })
  }, [merged, filter])

  function setAction(index, action) {
    setRows((list) => list.map((r, i) => (i === index ? { ...r, action } : r)))
  }

  function setAllDuplicates(action) {
    setRows((list) =>
      list.map((r, i) => {
        const a = merged[i]
        return a.duplicate && a.allowedActions.includes(action) ? { ...r, action } : r
      }),
    )
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
      const data = await api(`/invitations/${id}/guests/import`, { method: 'POST', body: { rows, dryRun: false, cardType: physical ? 'physical' : 'online' } })
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
      <p className="py-20 text-center text-body-md text-on-surface-variant" role="status">
        Loading…
      </p>
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
              <button type="button" className="btn-primary px-5 py-2.5" onClick={() => downloadTemplateXlsx()}>
                <Download size={16} aria-hidden="true" /> Excel (.xlsx)
              </button>
              <button type="button" className="btn-secondary px-5 py-2.5" onClick={downloadTemplateCsv}>
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
              {physical
                ? 'One card per row. Use each name as written on the card: guests type it to find themselves. No phone numbers needed.'
                : 'One person per row. Plus-ones can’t be added. Add a phone number to share by WhatsApp.'}
            </p>
          </section>

          <section className="card p-6" aria-labelledby="up-h">
            <p className="eyebrow">Step 2</p>
            <h2 id="up-h" className="mt-2 font-serif text-headline-sm text-espresso">
              Upload your guest list
            </h2>

            {!physicalOnly && (invitation?.limits?.qrRsvp || physical) && (
              <fieldset className="mt-5">
                <legend className="text-label-md text-espresso uppercase">Who is in this file?</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {[
                    { value: 'online', label: 'Online-card guests', note: 'Each gets a personal link', Icon: Link2 },
                    { value: 'physical', label: 'Physical-card guests', note: 'They reply by the QR code', Icon: Printer },
                  ].map((o) => (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3.5 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold ${cardType === o.value ? 'border-gold bg-gold/10' : 'border-bone bg-white hover:border-gold'}`}
                    >
                      <input type="radio" name="cardType" value={o.value} checked={cardType === o.value} onChange={() => setCardType(o.value)} className="sr-only" />
                      <o.Icon size={17} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                      <span>
                        <span className="block text-title-md text-espresso">{o.label}</span>
                        <span className="block text-body-sm text-on-surface-variant">{o.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-body-sm text-on-surface-variant">Import online and physical-card guests from separate files.</p>
              </fieldset>
            )}

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
              <span className="mt-3 text-label-sm text-on-surface-variant uppercase">.xlsx or .csv · up to 5 MB · up to {MAX_ROWS.toLocaleString()} guests</span>
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
              <div className={`mt-4 flex items-start gap-3 rounded-lg border p-4 ${file.bad ? 'border-error bg-error-container' : 'border-bone bg-white'}`} role={file.bad ? 'alert' : 'status'}>
                {file.bad ? <XCircle className="mt-0.5 shrink-0 text-error" size={20} aria-hidden="true" /> : <FileSpreadsheet className="mt-0.5 shrink-0 text-gold-text" size={20} aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-title-md text-espresso">{file.name}</p>
                  <p className="text-body-sm text-on-surface-variant">{formatSize(file.size)}</p>
                  {file.bad ? (
                    <p className="mt-1 text-body-sm text-on-error-container">{fileError}</p>
                  ) : (
                    <p className="mt-1 text-body-sm text-espresso">
                      <CheckCircle2 size={14} className="mr-1 inline text-gold-text" aria-hidden="true" />
                      {sheet.rows.length} guest row{sheet.rows.length === 1 ? '' : 's'} found · {sheet.headers.length} columns
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5">
              <NoAutoSend physical={physical} />
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Link to={guestsUrl} className="btn-secondary">
                Cancel
              </Link>
              <button type="button" className="btn-primary" disabled={!sheet} onClick={() => setStep(2)}>
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
            {counts.total !== counts.ok && (
              <button type="button" className="btn-secondary shrink-0" onClick={() => downloadReport(merged, rows, `guest-import-issues.csv`)}>
                <Download size={16} aria-hidden="true" /> Download issues (.csv)
              </button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Rows in file" value={counts.total} />
            <Stat label="Ready to add" value={counts.ok + counts.warn} note={counts.warn ? `${counts.warn} with a small fix` : 'No problems'} />
            <Stat label="Need attention" value={counts.error} note="Missing or invalid name" tone={counts.error ? 'text-error' : ''} />
            <Stat label="Possible duplicates" value={counts.dup} note="Already listed or repeated" />
          </div>

          <div className="mt-4">
            <FormAlert>{error}</FormAlert>
          </div>

          <div className="card mt-6 flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Show rows">
              {[
                ['issues', 'Needs review', counts.error + counts.dup + counts.warn],
                ['error', 'Errors', counts.error],
                ['dup', 'Duplicates', counts.dup],
                ['warn', 'Small fixes', counts.warn],
                ['all', 'All rows', counts.total],
              ].map(([v, label, n]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={filter === v}
                  onClick={() => {
                    setFilter(v)
                    setShown(PAGE)
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-label-md uppercase ${filter === v ? 'bg-gold text-espresso' : 'border border-bone bg-white text-on-surface-variant hover:border-gold'}`}
                >
                  {label} ({n})
                </button>
              ))}
            </div>
            {counts.dup > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
                All duplicates:
                <button type="button" className="rounded-full border border-bone bg-white px-3 py-1 hover:border-gold" onClick={() => setAllDuplicates('skip')}>
                  Skip
                </button>
                <button type="button" className="rounded-full border border-bone bg-white px-3 py-1 hover:border-gold" onClick={() => setAllDuplicates('update')}>
                  Update existing
                </button>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="card mt-4 px-6 py-12 text-center">
              <CheckCircle2 className="mx-auto text-gold-text" aria-hidden="true" />
              <p className="mt-3 text-body-md text-espresso">{filter === 'issues' ? 'No problems found — every row is ready.' : 'No rows in this view.'}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {filtered.slice(0, shown).map((r) => {
                const issue = issueText(r)
                const raw = rows[r.index]
                const isEditing = editing === r.index
                return (
                  <li key={r.row} className={`card grid gap-4 p-4 md:grid-cols-[70px_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)] ${r.action === 'skip' || r.action === 'exclude' ? 'opacity-75' : ''}`}>
                    <p className="text-label-md text-on-surface-variant">Row {r.row}</p>

                    <div className="min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          {(physical ? ['name', 'email'] : ['name', 'phone', 'email']).map((k) => (
                            <label key={k} className="block">
                              <span className="text-label-sm text-on-surface-variant uppercase">{k === 'name' ? 'Guest name' : k}</span>
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
                          {!physical && <p className={`truncate text-body-sm ${r.warnings.phone ? 'text-error line-through' : 'text-on-surface-variant'}`}>{raw.phone || '—'}</p>}
                          <p className={`truncate text-body-sm ${r.warnings.email ? 'text-error line-through' : 'text-on-surface-variant'}`}>{raw.email || ''}</p>
                          {r.values.group && <p className="truncate text-body-sm text-gold-text">Group: {r.values.group}</p>}
                          {raw.notes && <p className="truncate text-body-sm text-on-surface-variant italic">{raw.notes}</p>}
                        </>
                      )}
                    </div>

                    <div className="min-w-0">
                      {issue ? (
                        <>
                          <p className={`flex items-center gap-1.5 text-body-sm font-semibold ${issue.tone === 'error' ? 'text-error' : issue.tone === 'dup' ? 'text-gold-text' : 'text-espresso'}`}>
                            {issue.tone === 'error' ? <XCircle size={15} aria-hidden="true" /> : issue.tone === 'dup' ? <Copy size={15} aria-hidden="true" /> : <AlertTriangle size={15} aria-hidden="true" />}
                            {issue.title}
                          </p>
                          <p className="mt-0.5 text-body-sm text-on-surface-variant">{issue.text}</p>
                        </>
                      ) : (
                        <p className="flex items-center gap-1.5 text-body-sm text-on-surface-variant">
                          <CheckCircle2 size={15} className="text-gold-text" aria-hidden="true" /> Ready
                        </p>
                      )}
                      {!isEditing && (issue?.tone === 'error' || issue?.tone === 'warn') && (
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-gold-text underline underline-offset-4"
                          onClick={() => {
                            setEditing(r.index)
                            setDraft({ name: raw.name, phone: raw.phone, email: raw.email })
                          }}
                        >
                          <PencilLine size={14} aria-hidden="true" /> Fix here
                        </button>
                      )}
                    </div>

                    <fieldset className="min-w-0">
                      <legend className="sr-only">What to do with row {r.row}</legend>
                      {r.allowedActions.length === 1 ? (
                        <p className="text-body-sm text-on-surface-variant">{r.action === 'exclude' ? 'Will be left out' : ACTION_LABELS[r.action]}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {r.allowedActions.map((a) => (
                            <label key={a} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-body-sm ${r.action === a ? 'border-gold bg-blush-tint' : 'border-bone bg-white'}`}>
                              <input type="radio" name={`act-${r.row}`} checked={r.action === a} onChange={() => setAction(r.index, a)} className="accent-espresso" />
                              {a === 'add' && r.duplicate ? 'Add as a separate guest' : ACTION_LABELS[a]}
                            </label>
                          ))}
                        </div>
                      )}
                    </fieldset>
                  </li>
                )
              })}
            </ul>
          )}
          {filtered.length > shown && (
            <div className="mt-4 text-center">
              <button type="button" className="btn-secondary" onClick={() => setShown((n) => n + PAGE)}>
                Show more ({filtered.length - shown} left)
              </button>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-between gap-3">
            <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
              <ArrowLeft size={16} aria-hidden="true" /> Back to columns
            </button>
            <button type="button" className="btn-primary" onClick={() => setStep(4)} disabled={counts.add + counts.update === 0 || checking || editing !== null}>
              Continue <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
          {counts.add + counts.update === 0 && <p className="mt-2 text-right text-body-sm text-on-surface-variant">Every row is skipped — nothing to import.</p>}
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

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat label="New guests to add" value={counts.add} note={physical ? 'They reply by the QR code' : 'Each gets a personal link'} />
            <Stat label="Existing guests to update" value={counts.update} note={physical ? 'Moved to physical card; email, group or notes filled in' : 'Phone, email, group or notes filled in'} />
            <Stat label="Rows left out" value={counts.skip} note="Skipped duplicates and errors" />
          </div>
          <p className="mt-4 text-center text-body-md text-espresso" aria-label={`${counts.add} add plus ${counts.update} update plus ${counts.skip} left out equals ${counts.total} rows`}>
            {counts.add} add + {counts.update} update + {counts.skip} left out = <strong>{counts.total} rows</strong>
          </p>

          <div className="mt-6">
            <NoAutoSend physical={physical} />
          </div>

          {counts.skip > 0 && (
            <label className="mt-4 flex items-start gap-3 rounded-lg border border-bone bg-white px-4 py-3 text-body-md text-espresso">
              <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} className="mt-1 accent-espresso" />
              I understand {counts.skip} row{counts.skip === 1 ? '' : 's'} will be left out. I can download them after the import.
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
              <button type="button" className="btn-primary" onClick={runImport} disabled={importing || (counts.skip > 0 && !acknowledged)}>
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
          <div className="mt-8 grid gap-4 text-left sm:grid-cols-3">
            <Stat label="Guests added" value={result.summary.added} note={physical ? 'With physical cards' : 'With their own personal links'} />
            <Stat label="Guests updated" value={result.summary.updated} />
            <Stat label="Rows left out" value={result.summary.skip} />
          </div>
          <p className="mt-6 text-body-md text-on-surface-variant">{physical
              ? 'They can reply by scanning the QR code on their card. Download the code from your guest list.'
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
