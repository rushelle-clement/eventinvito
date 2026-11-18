// The reply page for printed cards: /r/<code>, opened by scanning the QR code on the card.
// The guest types their name, taps it, and chooses attending / not attending. Only guests the
// couple marked as "physical card" can be found. Public — no sign-in, no site menu.

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2, ChevronRight, Clock, MapPin, QrCode, Search, UserX } from 'lucide-react'
import { api } from '../lib/api'
import { qrStringsFor } from '../lib/qrStrings'
import { formatDate, formatTime, hostsOf, invitationTitle, isBirthday, isChristmas, isCorporate, stringsFor } from '../templates/strings'

function Shell({ lang, children }) {
  return (
    <main className="min-h-screen bg-ivory px-margin-mobile py-10 sm:py-16" lang={lang}>
      <div className="mx-auto max-w-md">
        {children}
        <p className="mt-8 text-center font-serif text-body-md text-espresso">
          EventInvito<span className="text-gold">.</span>
        </p>
      </div>
    </main>
  )
}

function Header({ invitation }) {
  const lang = invitation.language
  const t = stringsFor(lang, invitation.eventType)
  const title = isBirthday(invitation) || isCorporate(invitation) || isChristmas(invitation) ? invitationTitle(invitation, lang) : hostsOf(invitation, lang)
  const time = formatTime(invitation.eventTime, lang)
  return (
    <header className="text-center">
      <p className="eyebrow">{t.youAreInvited}</p>
      <h1 className="mt-2 font-serif text-headline-lg-mobile text-espresso">{title}</h1>
      <ul className="mx-auto mt-4 flex max-w-xs flex-col items-center gap-1.5 text-body-md text-on-surface-variant">
        {invitation.eventDate && (
          <li className="flex items-center gap-2">
            <CalendarDays size={16} className="shrink-0 text-gold-text" aria-hidden="true" />
            {formatDate(invitation.eventDate, lang)}
          </li>
        )}
        {time && (
          <li className="flex items-center gap-2">
            <Clock size={16} className="shrink-0 text-gold-text" aria-hidden="true" />
            {time}
          </li>
        )}
        {invitation.venueName && (
          <li className="flex items-center gap-2">
            <MapPin size={16} className="shrink-0 text-gold-text" aria-hidden="true" />
            {invitation.venueName}
          </li>
        )}
      </ul>
    </header>
  )
}

export default function QrReply() {
  const { code } = useParams()
  const [state, setState] = useState({ status: 'loading' })
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState(null) // { matches, tooMany } after a search
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [guest, setGuest] = useState(null) // the guest they tapped
  const [sending, setSending] = useState('')
  const [sent, setSent] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    api(`/qr/${encodeURIComponent(code)}`, { auth: false })
      .then((data) => {
        setState({ status: 'ready', invitation: data.invitation })
        document.title = `${invitationTitle(data.invitation, data.invitation.language)} — Reply`
      })
      .catch((err) => setState({ status: 'error', code: err.code, message: err.message }))
    return () => {
      document.title = 'EventInvito'
    }
  }, [code])

  if (state.status === 'loading') {
    return (
      <p className="grid min-h-screen place-items-center bg-ivory text-body-md text-on-surface-variant" role="status">
        Loading…
      </p>
    )
  }

  if (state.status === 'error') {
    const q = qrStringsFor('en')
    return (
      <Shell lang="en">
        <div className="card px-8 py-12 text-center" role="alert">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
            <QrCode size={24} />
          </span>
          <p className="mt-5 text-body-md text-espresso">{state.code === 'ended' ? state.message : state.code === 'qr_unavailable' ? q.unavailable(q.who) : state.message}</p>
        </div>
      </Shell>
    )
  }

  const { invitation } = state
  const lang = invitation.language
  const t = stringsFor(lang, invitation.eventType)
  const q = qrStringsFor(lang, invitation.eventType)
  const deadline = formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' })
  const answerLabel = (s) => (s === 'attending' ? t.accept : t.decline)

  async function find(e) {
    e.preventDefault()
    setMessage('')
    setSearch(null)
    if (query.replace(/[^\p{L}\p{N}]/gu, '').length < 3) {
      setMessage(q.tooShort)
      return
    }
    setSearching(true)
    try {
      const data = await api(`/qr/${encodeURIComponent(code)}/find`, { method: 'POST', body: { name: query }, auth: false })
      setSearch(data)
      if (data.tooMany) setMessage(q.tooMany)
      else if (!data.matches.length) setMessage(q.notFound(q.who))
    } catch (err) {
      setMessage(err.code === 'name_too_short' ? q.tooShort : err.status === 404 ? q.unavailable(q.who) : err.message || t.tryAgain)
    } finally {
      setSearching(false)
    }
  }

  async function reply(response) {
    setSending(response)
    setMessage('')
    try {
      const data = await api(`/qr/${encodeURIComponent(code)}/rsvp`, { method: 'POST', body: { guestId: guest.id, response }, auth: false })
      setGuest(data.guest)
      setSent(true)
    } catch (err) {
      if (err.code === 'rsvp_closed') setState({ ...state, invitation: { ...invitation, rsvpOpen: false } })
      setMessage(err.status === 403 || err.status === 404 ? err.message : t.tryAgain)
    } finally {
      setSending('')
    }
  }

  function startOver() {
    setGuest(null)
    setSent(false)
    setSearch(null)
    setMessage('')
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <Shell lang={lang}>
      <Header invitation={invitation} />

      <section className="card mt-8 p-6" aria-labelledby="qr-h">
        <h2 id="qr-h" className="text-center font-serif text-headline-sm text-espresso">
          {q.heading}
        </h2>
        {invitation.rsvpOpen && deadline && <p className="mt-1 text-center text-body-sm text-on-surface-variant">{q.replyBy(deadline)}</p>}

        {!invitation.rsvpOpen ? (
          <p className="mt-5 rounded-lg bg-blush-tint px-4 py-3 text-body-md text-espresso" role="status">
            {t.closed}
          </p>
        ) : !guest ? (
          /* ---- 1. Find your name ---- */
          <>
            <form onSubmit={find} className="mt-5" noValidate>
              <label htmlFor="qr-name" className="text-label-md text-espresso">
                {q.findLabel}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="qr-name"
                  ref={inputRef}
                  className="min-w-0 flex-1 rounded-lg border border-bone bg-white px-4 py-3 text-body-md outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,160,89,0.15)]"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={q.findPlaceholder}
                  autoComplete="name"
                  maxLength={100}
                  autoFocus
                />
                <button type="submit" className="btn-primary shrink-0 px-4" disabled={searching} aria-label={q.find}>
                  <Search size={18} aria-hidden="true" />
                  <span className="hidden sm:inline">{searching ? q.finding : q.find}</span>
                </button>
              </div>
            </form>

            {message && (
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-blush-tint px-4 py-3 text-body-md text-espresso" role="status">
                {search && !search.tooMany && !search.matches.length && <UserX size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />}
                {message}
              </p>
            )}

            {search?.matches?.length > 0 && (
              <div className="mt-5">
                <p className="text-label-md text-on-surface-variant uppercase">{q.pick}</p>
                <ul className="mt-2 divide-y divide-bone overflow-hidden rounded-lg border border-bone bg-white">
                  {search.matches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setGuest(m)
                          setMessage('')
                        }}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-title-md text-espresso hover:bg-blush-tint focus-visible:bg-blush-tint"
                      >
                        <span className="min-w-0 truncate">{m.name}</span>
                        <ChevronRight size={18} className="shrink-0 text-gold-text" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : sent ? (
          /* ---- 3. Thank you ---- */
          <div className="mt-6 text-center" role="status">
            <CheckCircle2 size={36} className="mx-auto text-gold-text" aria-hidden="true" />
            <p className="mt-3 font-serif text-title-lg text-espresso">{t.dear(guest.name)}</p>
            <p className="mt-2 text-body-md text-espresso">{guest.status === 'attending' ? t.thanksYes : t.thanksNo}</p>
            <p className="mt-3 text-body-sm text-on-surface-variant">{deadline ? t.canChangeUntil(deadline) : t.canChangeAnytime}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" className="btn-secondary" onClick={() => setSent(false)}>
                {q.change}
              </button>
              <button type="button" className="btn-secondary" onClick={startOver}>
                {q.notYou}
              </button>
            </div>
          </div>
        ) : (
          /* ---- 2. Reply ---- */
          <div className="mt-6 text-center">
            <p className="font-serif text-title-lg text-espresso">{t.dear(guest.name)}</p>
            {guest.status !== 'pending' && <p className="mt-1 text-body-sm text-on-surface-variant">{q.replied(answerLabel(guest.status))}</p>}
            <p className="mt-4 text-body-md text-espresso">{t.rsvpPrompt}</p>
            <div className="mt-4 grid gap-3">
              <button type="button" className="btn-primary w-full justify-center py-3" onClick={() => reply('attending')} disabled={Boolean(sending)} aria-pressed={guest.status === 'attending'}>
                {sending === 'attending' ? t.sending : t.accept}
              </button>
              <button type="button" className="btn-secondary w-full justify-center py-3" onClick={() => reply('not_attending')} disabled={Boolean(sending)} aria-pressed={guest.status === 'not_attending'}>
                {sending === 'not_attending' ? t.sending : t.decline}
              </button>
            </div>
            {message && (
              <p className="mt-4 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container" role="alert">
                {message}
              </p>
            )}
            <button type="button" className="mt-5 text-label-md text-on-surface-variant underline underline-offset-4 hover:text-gold-text" onClick={startOver}>
              {q.notYou}
            </button>
          </div>
        )}
      </section>
    </Shell>
  )
}
