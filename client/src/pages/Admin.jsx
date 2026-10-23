// Admin page: couples sign up themselves (with one free card); when a couple pays, find their
// account here and choose their package, which adds its Premium credits (1 for Premium, 2 for
// Premium Plus and Signature) and sets the limits (guests, photos, own song, Excel). Also: turn accounts
// off, set new passwords, and create accounts for couples who can't sign up themselves. Only admin accounts can open it (see App.jsx and the server's /api/admin).

import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, Eye, KeyRound, LayoutGrid, Minus, Plus, Power, Search, ShieldCheck, Sparkles, UserPlus, Wand2 } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import FormAlert from '../components/FormAlert'
import { formatDate } from '../templates/strings'

const input = 'w-full rounded-lg border border-bone bg-white px-4 py-3 text-body-md text-espresso outline-none focus:border-gold'
const STATUS = {
  active: { label: 'Active', cls: 'bg-[#e3f4e8] text-[#1e6b3a]' },
  ended: { label: 'Ended', cls: 'bg-surface-container-high text-on-surface-variant' },
  disabled: { label: 'Turned off', cls: 'bg-error-container text-on-error-container' },
}

// The packages (see Packages.jsx on the home page and the server's utils/packages.js)
const PLANS = [
  { value: 'free', label: 'Simple Card', credits: 0, limits: '50 guests' },
  { value: 'premium', label: 'Premium', credits: 1, limits: '150 guests · 6 photos' },
  { value: 'plus', label: 'Premium Plus', credits: 2, limits: '300 guests · 12 photos · own song · Excel' },
  { value: 'signature', label: 'Signature', credits: 2, limits: '500 guests · 12 photos · own song · Excel' },
]
const planOf = (value) => PLANS.find((p) => p.value === value) || PLANS[0]

// The sign-in details to send to a couple
function detailsText(name, email, password) {
  return `Hi ${name}, your EventInvito account is ready.\nSign in: ${window.location.origin}/signin\nEmail: ${email}\nPassword: ${password}`
}

function CopyDetails({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="mt-3 rounded-lg border border-[#b7e0c4] bg-[#e3f4e8] p-4">
      <pre className="whitespace-pre-wrap break-words font-sans text-body-sm text-[#1e4d2e]">{text}</pre>
      <button type="button" className="btn-secondary mt-3 px-4 py-2 text-body-sm" onClick={copy}>
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} {copied ? 'Copied' : 'Copy sign-in details'}
      </button>
      <p className="mt-2 text-body-sm text-[#1e4d2e]">Send these to the couple now: the password isn’t shown again.</p>
    </div>
  )
}

async function suggestPassword() {
  const d = await api('/admin/password-suggestion')
  return d.password
}

function CreateAccount({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', plan: 'premium', credits: 1 })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      const body = { name: form.name.trim(), email: form.email.trim(), password: form.password, plan: form.plan, credits: Number(form.credits) }
      const d = await api('/admin/users', { method: 'POST', body })
      setCreated(detailsText(body.name, d.user.email, body.password))
      setForm({ name: '', email: '', password: '', plan: 'premium', credits: 1 })
      onCreated(d.user)
    } catch (err) {
      setError(err.message)
      setErrors(err.fieldErrors || {})
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card p-5 sm:p-6" aria-labelledby="create-h">
      <h2 id="create-h" className="flex items-center gap-2 font-serif text-headline-sm text-espresso">
        <UserPlus size={20} className="text-gold-text" aria-hidden="true" /> Create an account
      </h2>
      <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={submit} noValidate>
        <div className="sm:col-span-2">
          <FormAlert>{error}</FormAlert>
        </div>
        <label className="block">
          <span className="text-label-md text-espresso">Name</span>
          <input className={`${input} mt-1.5`} value={form.name} onChange={set('name')} maxLength={100} placeholder="e.g. Amaya Perera" required />
          {errors.name && <span className="mt-1 block text-body-sm text-error">{errors.name}</span>}
        </label>
        <label className="block">
          <span className="text-label-md text-espresso">Email</span>
          <input className={`${input} mt-1.5`} type="email" value={form.email} onChange={set('email')} maxLength={254} placeholder="name@example.com" required />
          {errors.email && <span className="mt-1 block text-body-sm text-error">{errors.email}</span>}
        </label>
        <label className="block">
          <span className="text-label-md text-espresso">Password</span>
          <span className="mt-1.5 flex gap-2">
            <input className={input} value={form.password} onChange={set('password')} maxLength={128} placeholder="At least 8 characters" autoComplete="new-password" required />
            <button type="button" className="btn-secondary shrink-0 px-3" onClick={() => suggestPassword().then((p) => setForm((f) => ({ ...f, password: p })))} title="Suggest a password">
              <Wand2 size={16} aria-hidden="true" /> <span className="hidden sm:inline">Suggest</span>
            </button>
          </span>
          {errors.password && <span className="mt-1 block text-body-sm text-error">{errors.password}</span>}
        </label>
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <label className="block">
            <span className="text-label-md text-espresso">Package</span>
            <select
              className={`${input} mt-1.5 h-[50px]`}
              value={form.plan}
              onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value, credits: planOf(e.target.value).credits }))}
            >
              {PLANS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-label-md whitespace-nowrap text-espresso">Invitations</span>
            <input className={`${input} mt-1.5 h-[50px]`} type="number" min={0} max={50} value={form.credits} onChange={set('credits')} title="Premium invitations they can publish" />
          </label>
          <span className="col-span-2 -mt-1 block text-body-sm text-on-surface-variant">
            {planOf(form.plan).limits} per invitation, and {form.credits || 0} Premium invitation{Number(form.credits) === 1 ? '' : 's'} to publish. Every account also gets 1 free card.
          </span>
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
            <UserPlus size={17} aria-hidden="true" /> {busy ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
      {created && <CopyDetails text={created} />}
    </section>
  )
}

const short = (iso) => formatDate(iso, 'en', { day: 'numeric', month: 'short', year: 'numeric' })

// One account as a table row; "New password" opens a second row underneath
function AccountRow({ account, me, onChange, lockAfterEvent }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [newPassword, setNewPassword] = useState(null) // null = closed
  const [sent, setSent] = useState(null)
  const isMe = account.id === me?.id
  const isAdmin = account.role === 'admin'
  const st = STATUS[account.status] || STATUS.active

  async function patch(body) {
    setBusy(true)
    setError('')
    try {
      const d = await api(`/admin/users/${account.id}`, { method: 'PATCH', body })
      onChange(d.user)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function savePassword() {
    if (await patch({ password: newPassword })) {
      setSent(detailsText(account.name, account.email, newPassword))
      setNewPassword(null)
    }
  }

  const expanded = newPassword !== null || sent || error
  const cell = 'px-4 py-3 align-top'

  return (
    <>
      <tr className={`border-t border-bone ${expanded ? '' : 'hover:bg-surface-container-low/60'}`}>
        <td className={cell}>
          <p className="flex flex-wrap items-center gap-1.5 font-semibold text-espresso">
            {account.name}
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-espresso px-2 py-0.5 text-label-sm font-normal text-white uppercase">
                <ShieldCheck size={11} aria-hidden="true" /> Admin
              </span>
            )}
          </p>
          <p className="max-w-[16rem] truncate text-body-sm text-on-surface-variant">{account.email}</p>
        </td>
        <td className={cell}>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-label-sm whitespace-nowrap uppercase ${st.cls}`}>{st.label}</span>
        </td>
        <td className={cell}>
          {isAdmin ? (
            <span className="text-body-sm text-on-surface-variant">—</span>
          ) : (
            <>
              <select
                className="w-full max-w-[11rem] rounded-lg border border-bone bg-white px-2.5 py-1.5 text-body-sm text-espresso outline-none focus:border-gold"
                value={account.plan || 'free'}
                onChange={(e) => {
                  const plan = e.target.value
                  // From a free account to a paid package: add the package's Premium invitations too
                  const credits = (account.plan || 'free') === 'free' && !(account.publishCredits > 0) ? planOf(plan).credits : undefined
                  patch({ plan, ...(credits && { credits }) })
                }}
                disabled={busy}
                aria-label={`Package for ${account.name}`}
              >
                {PLANS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block max-w-[11rem] text-[12px] leading-snug text-on-surface-variant">{planOf(account.plan).limits}</span>
              {account.customDesigns?.map((d) => (
                <span key={d.key} className="mt-1.5 flex max-w-[11rem] items-center gap-1 text-[12px] leading-snug font-semibold text-gold-text">
                  <Sparkles size={12} className="shrink-0" aria-hidden="true" /> {d.name}
                </span>
              ))}
            </>
          )}
        </td>
        <td className={cell}>
          {isAdmin ? (
            <span className="text-body-sm text-on-surface-variant">—</span>
          ) : (
            <div className="space-y-1.5">
              {[
                ['credits', 'publishCredits', 'Premium'],
                ['freeCredits', 'freeCredits', 'Free card'],
              ].map(([field, key, label]) => (
                <div key={field} className="flex items-center gap-1.5" aria-label={`${label}: ${account[key] || 0} left for ${account.name}`}>
                  <button type="button" className="btn-secondary h-7 w-7 !p-0" onClick={() => patch({ [field]: (account[key] || 0) - 1 })} disabled={busy || !(account[key] > 0)} aria-label={`One fewer ${label}`}>
                    <Minus size={13} aria-hidden="true" />
                  </button>
                  <strong className="w-5 text-center text-title-md text-espresso">{account[key] || 0}</strong>
                  <button type="button" className="btn-secondary h-7 w-7 !p-0" onClick={() => patch({ [field]: (account[key] || 0) + 1 })} disabled={busy || (account[key] || 0) >= 50} aria-label={`One more ${label}`}>
                    <Plus size={13} aria-hidden="true" />
                  </button>
                  <span className="text-body-sm whitespace-nowrap text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
          )}
        </td>
        <td className={`${cell} text-body-sm`}>
          {isAdmin ? (
            <span className="text-on-surface-variant">—</span>
          ) : account.invitations.length === 0 ? (
            <span className="text-on-surface-variant">None published</span>
          ) : (
            <ul className="space-y-1">
              {account.invitations.map((i) => (
                <li key={i.id}>
                  <span className="font-semibold text-espresso">{i.names}</span>
                  <span className={`ml-1.5 rounded-full px-1.5 py-px text-[11px] uppercase ${i.paidKind === 'free' ? 'bg-surface-container-high text-on-surface-variant' : 'bg-gold/20 text-gold-text'}`}>
                    {i.paidKind === 'free' ? 'Free' : 'Premium'}
                  </span>
                  <span className="block text-on-surface-variant">
                    {i.eventDate ? short(i.eventDate) : 'no date'} ·{' '}
                    {i.ended ? 'ended' : i.status === 'published' ? `online until ${formatDate(i.onlineUntil, 'en', { day: 'numeric', month: 'short' })}` : i.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!isAdmin && account.drafts > 0 && (
            <span className="mt-1 block text-on-surface-variant">
              + {account.drafts} draft{account.drafts === 1 ? '' : 's'}
            </span>
          )}
        </td>
        <td className={`${cell} text-body-sm whitespace-nowrap text-on-surface-variant`}>{short(account.createdAt.slice(0, 10))}</td>
        <td className={cell}>
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex gap-1.5">
              {!isMe && (
                <button type="button" className="btn-secondary px-3 py-1.5 text-body-sm" onClick={() => patch({ disabled: !account.disabled })} disabled={busy}>
                  <Power size={14} aria-hidden="true" /> {account.disabled ? 'Turn on' : 'Turn off'}
                </button>
              )}
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-body-sm"
                onClick={() => setNewPassword(newPassword === null ? '' : null)}
                disabled={busy}
                aria-expanded={newPassword !== null}
              >
                <KeyRound size={14} aria-hidden="true" /> Password
              </button>
            </div>
            {/* Only when accounts are set to close after their event (LOCK_AFTER_EVENT=true) */}
            {!isAdmin && lockAfterEvent && (
              <label className="inline-flex cursor-pointer items-center gap-2 text-body-sm whitespace-nowrap text-espresso">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-espresso"
                  checked={account.keepAccess}
                  onChange={(e) => {
                    const keepAccess = e.target.checked
                    onChange({ ...account, keepAccess }) // tick straight away; the server's answer follows
                    patch({ keepAccess })
                  }}
                  disabled={busy}
                />
                Keep open after event
              </label>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-surface-container-low/60">
          <td colSpan={7} className="px-4 pb-4">
            {newPassword !== null && (
              <div className="flex max-w-2xl flex-col gap-2 pt-1 sm:flex-row">
                <input
                  className={input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={`New password for ${account.name} (8+ characters)`}
                  maxLength={128}
                  autoComplete="new-password"
                />
                <button type="button" className="btn-secondary shrink-0" onClick={() => suggestPassword().then(setNewPassword)}>
                  <Wand2 size={15} aria-hidden="true" /> Suggest
                </button>
                <button type="button" className="btn-primary shrink-0" onClick={savePassword} disabled={busy || newPassword.length < 8}>
                  Save password
                </button>
              </div>
            )}
            {sent && <CopyDetails text={sent} />}
            {error && (
              <div className="mt-3">
                <FormAlert>{error}</FormAlert>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// "‹ 1 2 3 … 9 ›": the first and last page, and two either side of the current one
function pageList(page, pages) {
  const out = []
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) out.push(n)
    else if (out[out.length - 1] !== '…') out.push('…')
  }
  return out
}

function Pagination({ page, pages, total, limit, onPage, onLimit }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(total, page * limit)
  const btn = 'grid h-9 min-w-9 place-items-center rounded-full border px-2.5 text-body-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <nav className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Account pages">
      <p className="text-body-sm text-on-surface-variant">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className={`${btn} border-bone bg-white text-espresso hover:border-gold`} onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {pageList(page, pages).map((n, i) =>
          n === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-on-surface-variant" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              className={`${btn} ${n === page ? 'border-espresso bg-espresso font-semibold text-white' : 'border-bone bg-white text-espresso hover:border-gold'}`}
              onClick={() => onPage(n)}
              aria-current={n === page ? 'page' : undefined}
              aria-label={`Page ${n}`}
            >
              {n}
            </button>
          ),
        )}
        <button type="button" className={`${btn} border-bone bg-white text-espresso hover:border-gold`} onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <label className="ml-2 inline-flex items-center gap-2 text-body-sm text-on-surface-variant">
          Per page
          <select className="rounded-full border border-bone bg-white py-1.5 pr-7 pl-3 text-body-sm text-espresso outline-none focus:border-gold" value={limit} onChange={(e) => onLimit(Number(e.target.value))}>
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
    </nav>
  )
}

// ---- Signature custom designs ----
// A custom design is built in code (custom: true in server/src/data/templates.js and in the
// client's themes.js). It stays hidden until it's given to a couple's account here; then only
// they see it, marked "Made for you". It joins the collection by itself once their event is over,
// or straight away with "Add to collection".

const DESIGN_STATUS = {
  unassigned: { label: 'Not given yet', cls: 'bg-surface-container-high text-on-surface-variant' },
  private: { label: 'Private', cls: 'bg-gold/20 text-gold-text' },
  collection: { label: 'In collection', cls: 'bg-[#e3f4e8] text-[#1e6b3a]' },
}

function designUse(d) {
  if (d.status === 'collection') return `Added ${short(d.releasedAt)}`
  if (!d.invitation) return d.status === 'private' ? 'Not used yet' : ''
  if (d.invitation.ended) return 'Their event is over'
  if (d.invitation.status === 'published') return `Live until ${formatDate(d.invitation.onlineUntil, 'en', { day: 'numeric', month: 'short' })}`
  return `In a ${d.invitation.status === 'draft' ? 'draft' : d.invitation.status} invitation`
}

function CustomDesignRow({ design, onSaved }) {
  const [email, setEmail] = useState(design.reservedFor)
  const [editing, setEditing] = useState(design.status === 'unassigned')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const st = DESIGN_STATUS[design.status]

  async function save(body) {
    setBusy(true)
    setError('')
    try {
      const d = await api(`/admin/custom-designs/${design.key}`, { method: 'PATCH', body })
      onSaved(d.design)
      setEditing(d.design.status === 'unassigned')
      setEmail(d.design.reservedFor)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-3 border-t border-bone px-4 py-4 first:border-t-0 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold text-espresso">
          {design.name}
          <span className={`rounded-full px-2.5 py-0.5 text-label-sm font-normal uppercase ${st.cls}`}>{st.label}</span>
        </p>
        <p className="text-body-sm text-on-surface-variant">
          {design.status !== 'unassigned' && design.reservedFor ? (
            <>
              For <span className="text-espresso">{design.ownerName || design.reservedFor}</span>
              {design.ownerName && ` (${design.reservedFor})`}
            </>
          ) : (
            'Hidden from everyone until you give it to a couple'
          )}
          {designUse(design) && ` · ${designUse(design)}`}
        </p>
        {error && (
          <div className="mt-2">
            <FormAlert>{error}</FormAlert>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <a href={`/templates/${design.key}/preview`} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-1.5 text-body-sm">
          <Eye size={14} aria-hidden="true" /> Preview
        </a>
        {design.status !== 'collection' &&
          (editing ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                save({ reservedFor: email.trim() })
              }}
            >
              <input
                className="w-full min-w-0 rounded-lg border border-bone bg-white px-3 py-1.5 text-body-sm text-espresso outline-none focus:border-gold sm:w-64"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Couple’s account email"
                aria-label={`Account email for ${design.name}`}
                required
              />
              <button type="submit" className="btn-primary shrink-0 px-3 py-1.5 text-body-sm" disabled={busy || !email.trim()}>
                {busy ? 'Saving…' : 'Give to couple'}
              </button>
            </form>
          ) : (
            <button type="button" className="btn-secondary px-3 py-1.5 text-body-sm" onClick={() => setEditing(true)} disabled={busy}>
              Change couple
            </button>
          ))}
        {design.status === 'private' && (
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 text-body-sm"
            onClick={() => window.confirm(`Add ${design.name} to the collection? Every couple will be able to use it.`) && save({ release: true })}
            disabled={busy}
          >
            <LayoutGrid size={14} aria-hidden="true" /> Add to collection
          </button>
        )}
      </div>
    </li>
  )
}

function CustomDesigns({ onChanged }) {
  const [designs, setDesigns] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/admin/custom-designs')
      .then((d) => setDesigns(d.designs))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section className="mt-12" aria-labelledby="custom-h">
      <h2 id="custom-h" className="flex items-center gap-2 font-serif text-headline-sm text-espresso">
        <Sparkles size={20} className="text-gold-text" aria-hidden="true" /> Custom designs
      </h2>
      <p className="mt-1 max-w-2xl text-body-sm text-on-surface-variant">
        Designs made for one Signature couple. Give each one to the couple’s account: only they see it, marked “Made for you”, next to all the other
        designs. It joins the collection for everyone once their event is over, or when you choose.
      </p>
      <FormAlert>{error}</FormAlert>
      {designs && designs.length === 0 && (
        <p className="card mt-4 px-5 py-6 text-body-md text-on-surface-variant">
          No custom designs yet. When one is built for a Signature couple, it appears here, ready to give to their account.
        </p>
      )}
      {designs && designs.length > 0 && (
        <ul className="card mt-4">
          {designs.map((d) => (
            <CustomDesignRow
              key={d.key}
              design={d}
              onSaved={(next) => {
                setDesigns((list) => list.map((x) => (x.key === next.key ? next : x)))
                onChanged()
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const [data, setData] = useState(null) // { users, page, pages, total, limit }
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [error, setError] = useState('')

  const load = useCallback(async ({ q, page: p, limit: l }) => {
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(l) })
      if (q) params.set('q', q)
      const d = await api(`/admin/users?${params}`)
      setData(d)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }, [])

  // Typing waits a moment before searching; changing page or size loads straight away
  useEffect(() => {
    const t = setTimeout(() => load({ q: query.trim(), page, limit }), query ? 300 : 0)
    return () => clearTimeout(t)
  }, [query, page, limit, load])

  const replace = (next) => setData((d) => d && { ...d, users: d.users.map((a) => (a.id === next.id ? next : a)) })
  const accounts = data?.users

  return (
    <div className="mx-auto max-w-[1200px] px-margin-mobile py-10 md:px-margin">
      <p className="text-label-sm text-on-surface-variant uppercase">Admin</p>
      <h1 className="mt-2 font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Accounts</h1>
      <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
        Couples sign up themselves and get one free card. When a couple pays, search for their email and choose their package: it sets their limits and
        adds the Premium invitations (1 for Premium, 2 for Premium Plus and Signature). Drafts are always free.
      </p>

      <div className="mt-8 max-w-[960px]">
        <CreateAccount
          onCreated={() => {
            // Newest accounts are listed first: show page 1 again
            setQuery('')
            if (page === 1) load({ q: '', page: 1, limit })
            else setPage(1)
          }}
        />
      </div>

      <section className="mt-10" aria-labelledby="list-h">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="list-h" className="font-serif text-headline-sm text-espresso">
              All accounts
            </h2>
            {data && <p className="mt-1 text-body-sm text-on-surface-variant">{data.total} {query.trim() ? 'found' : 'in total'}</p>}
          </div>
          <label className="relative block sm:w-72">
            <span className="sr-only">Search accounts</span>
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
            <input
              className={`${input} pl-10`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Search name or email"
            />
          </label>
        </div>

        <div className="mt-4">
          <FormAlert>{error}</FormAlert>
        </div>
        {!data && !error && (
          <p className="mt-6 text-body-md text-on-surface-variant" role="status">
            Loading accounts…
          </p>
        )}
        {accounts && accounts.length === 0 && <p className="mt-6 text-body-md text-on-surface-variant">No accounts found.</p>}
        {accounts && accounts.length > 0 && (
          <>
            {/* On small screens the table scrolls sideways inside its own box */}
            <div className="card mt-4 overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-surface-container-low text-label-sm text-on-surface-variant uppercase">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Account</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Package</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Left to publish</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Published invitation</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Created</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <AccountRow key={a.id} account={a} me={user} onChange={replace} lockAfterEvent={data.lockAfterEvent} />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              pages={data.pages}
              total={data.total}
              limit={data.limit}
              onPage={(p) => setPage(Math.max(1, Math.min(data.pages, p)))}
              onLimit={(l) => {
                setLimit(l)
                setPage(1)
              }}
            />
          </>
        )}
      </section>

      <CustomDesigns onChanged={() => load({ q: query.trim(), page, limit })} />
    </div>
  )
}
