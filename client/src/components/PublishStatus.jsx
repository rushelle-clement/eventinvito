// Whether an invitation is live, and a Publish button right where the couple is (QR code page,
// Dashboard card), so they don't have to go back to the editor. Publishing does the same as the
// editor's button: the server checks the details and uses the package's credit.

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Send } from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { publishCredit } from '../lib/publishCredit'
import { formatDate } from '../templates/strings'
import ContactLine from './ContactLine'

// compact: one line for the Dashboard card; otherwise a banner. note: an extra line when live
export default function PublishStatus({ invitation, onPublished, compact = false, note = '' }) {
  const { user, updateUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const live = invitation.status === 'published' && !invitation.ended
  const missing = invitation.missingForPublish?.length || 0
  const credit = publishCredit({ printed: invitation.printed, paid: invitation.paid, paidKind: invitation.paidKind, freeDesign: invitation.tier === 'free' }, user)
  const replyBy = invitation.rsvpDeadline ? formatDate(invitation.rsvpDeadline, 'en', { day: 'numeric', month: 'long', year: 'numeric' }) : ''

  async function publish() {
    setBusy(true)
    setError('')
    try {
      const d = await api(`/invitations/${invitation.id}/publish`, { method: 'POST' })
      updateUser(d.user)
      onPublished?.(d.invitation)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const action = missing ? (
    <Link to={`/invitations/${invitation.id}/edit`} className="btn-secondary shrink-0 px-4 py-2 text-body-sm">
      Fill in {missing} detail{missing === 1 ? '' : 's'}
    </Link>
  ) : credit.waiting ? (
    // Chose this package at sign-up: publishing opens once the payment is in
    <span className="shrink-0 rounded-full bg-blush-tint px-3 py-1.5 text-body-sm text-gold-text">Waiting for payment</span>
  ) : credit.used ? (
    // Package already used on another event: how to reach us for another one
    <ContactLine className="shrink-0 text-body-sm" />
  ) : credit.blocked ? (
    <a href="/#pricing" className="btn-secondary shrink-0 px-4 py-2 text-body-sm">
      See the packages
    </a>
  ) : (
    <button type="button" className="btn-primary shrink-0 px-4 py-2 text-body-sm" onClick={publish} disabled={busy}>
      <Send size={15} aria-hidden="true" /> {busy ? 'Publishing…' : invitation.status === 'unpublished' ? 'Publish again' : 'Publish'}
    </button>
  )

  if (compact) {
    if (live) return null
    return (
      <div className="flex flex-wrap items-center gap-2">
        {action}
        {error && <p className="w-full text-body-sm text-error">{error}</p>}
      </div>
    )
  }

  if (live) {
    return (
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#b7e0c4] bg-[#e3f4e8] px-5 py-4 text-[#1e6b3a]" role="status">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p className="text-body-md">
          <strong>Published — guests can reply.</strong>{' '}
          {invitation.printed
            ? 'They scan the QR code, find their name and reply'
            : invitation.qr?.enabled
              ? 'Guests can open their links, and paper-card guests can scan the QR code, to reply'
              : 'Guests can open their links and reply'}
          {replyBy ? ` until ${replyBy}.` : '.'}
          {note && <span className="mt-1 block text-body-sm">{note}</span>}
        </p>
      </div>
    )
  }
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-lg border border-gold/40 bg-blush-tint px-5 py-4 sm:flex-row sm:items-center sm:justify-between" role="status">
      <div className="text-body-md text-espresso">
        <p>
          <strong>{invitation.status === 'unpublished' ? 'Unpublished' : 'Not published yet'} — guests can’t reply.</strong>{' '}
          {invitation.printed
            ? 'The QR reply page opens when you publish. You can print the code now: it won’t change.'
            : invitation.qr?.enabled
              ? 'Guest links and the QR reply page open when you publish. You can add guests now.'
              : 'Guest links open when you publish. You can add guests now.'}
        </p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          {missing ? `First fill in ${missing} more detail${missing === 1 ? '' : 's'} in Event details.` : credit.blocked ? `${credit.short}.` : credit.note || 'Everything is ready.'}
        </p>
        {error && <p className="mt-1 text-body-sm text-error">{error}</p>}
      </div>
      {action}
    </div>
  )
}
