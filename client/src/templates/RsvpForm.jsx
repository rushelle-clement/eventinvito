// The guest's reply form, shown inside their personal invitation (FR-051, FR-052).
// Only two choices: attending / not attending. No plus-ones (FR-047).
// The server makes the final decision about deadlines and valid links; this form just shows the result.

import { useState } from 'react'
import { CheckCircle2, HeartCrack, PartyPopper } from 'lucide-react'
import { api } from '../lib/api'
import { getTheme } from './themes'
import { STRINGS, formatDate } from './strings'

export default function RsvpForm({ token, invitation, rsvp, onChange }) {
  const theme = getTheme(invitation.templateKey)
  const lang = STRINGS[invitation.language] ? invitation.language : 'en'
  const t = STRINGS[lang]
  const regal = theme.layout === 'regal'

  const answered = rsvp.status !== 'pending'
  const [editing, setEditing] = useState(!answered)
  const [choice, setChoice] = useState(answered ? rsvp.status : '')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [justSent, setJustSent] = useState(false)

  const deadline = formatDate(rsvp.deadline, lang, { day: 'numeric', month: 'long', year: 'numeric' })
  const answerLabel = rsvp.status === 'attending' ? t.accept : t.decline

  async function submit(e) {
    e.preventDefault()
    if (!choice) return
    setSending(true)
    setError('')
    try {
      const data = await api(`/invite/${encodeURIComponent(token)}/rsvp`, { method: 'POST', body: { response: choice }, auth: false })
      onChange(data.rsvp)
      setEditing(false)
      setJustSent(true)
    } catch (err) {
      // Closed / invalid link messages come from the server; anything else gets a friendly retry message
      setError(err.status === 403 || err.status === 404 ? err.message : t.tryAgain)
      if (err.status === 403) onChange({ ...rsvp, open: false })
    } finally {
      setSending(false)
    }
  }

  const box = 'mt-4 rounded-lg px-5 py-4 text-left text-[15px] leading-6'

  // Replies closed
  if (!rsvp.open) {
    return (
      <div className={box} style={{ background: theme.soft, color: theme.text }} role="status">
        {answered && <p className="font-semibold">{t.yourAnswer(answerLabel)}</p>}
        <p className={answered ? 'mt-1' : ''} style={{ color: theme.muted }}>
          {answered ? t.closed : t.noReplyClosed}
        </p>
      </div>
    )
  }

  // Already answered → show it, with a way to change
  if (answered && !editing) {
    const Icon = rsvp.status === 'attending' ? PartyPopper : HeartCrack
    return (
      <div className={box} style={{ background: theme.soft, color: theme.text }} role="status" aria-live="polite">
        <p className="flex items-center gap-2 font-semibold">
          {justSent ? <CheckCircle2 size={18} aria-hidden="true" style={{ color: theme.accentText }} /> : <Icon size={18} aria-hidden="true" style={{ color: theme.accentText }} />}
          {justSent ? (rsvp.status === 'attending' ? t.thanksYes : t.thanksNo) : t.yourAnswer(answerLabel)}
        </p>
        {justSent && <p className="mt-1">{t.yourAnswer(answerLabel)}</p>}
        <p className="mt-1" style={{ color: theme.muted }}>
          {t.canChangeUntil(deadline)}
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(true)
            setJustSent(false)
            setChoice(rsvp.status)
          }}
          className="mt-3 text-[14px] font-semibold underline underline-offset-4"
          style={{ color: theme.accentText }}
        >
          {t.changeAnswer}
        </button>
      </div>
    )
  }

  // The form
  const option = (value, label) => {
    const selected = choice === value
    return (
      <label
        className="flex cursor-pointer items-center justify-center rounded-full border-2 px-4 py-3 text-center text-[15px] font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
        style={{
          borderColor: theme.accent,
          background: selected ? theme.accent : 'transparent',
          color: selected ? theme.onAccent || (regal ? theme.page : '#ffffff') : theme.accentText,
          outlineColor: theme.accent,
        }}
      >
        <input type="radio" name="rsvp" value={value} checked={selected} onChange={() => setChoice(value)} className="sr-only" />
        {label}
      </label>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4">
      <fieldset>
        <legend className="sr-only">{t.rsvpPrompt}</legend>
        {/* Sinhala/Tamil answers are long, so they get a full-width row each instead of wrapping */}
        <div className={`grid gap-3 ${lang === 'en' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {option('attending', t.accept)}
          {option('not_attending', t.decline)}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-3 rounded-lg px-4 py-2 text-[14px]" style={{ background: '#ffdad6', color: '#93000a' }}>
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          type="submit"
          disabled={!choice || sending}
          className="w-full rounded-full px-6 py-3 text-[15px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: regal ? theme.accent : theme.text, color: theme.onAccent || (regal ? theme.page : '#ffffff') }}
        >
          {sending ? t.sending : answered ? t.update : t.send}
        </button>
        {answered && (
          <button type="button" onClick={() => setEditing(false)} className="text-[14px] underline underline-offset-4" style={{ color: theme.muted }}>
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  )
}
