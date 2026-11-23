// The reply page for printed cards: /r/<code>, opened by scanning the QR code on the card.
// The guest types their name, taps it, and chooses attending / not attending. Only guests the
// couple marked as "physical card" can be found. Public — no sign-in, no site menu.

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarDays, CheckCircle2, ChevronRight, Clock, MapPin, QrCode, Search, UserX } from 'lucide-react'
import { api } from '../lib/api'
import { qrStringsFor } from '../lib/qrStrings'
import { formatDate, formatTime, hostsOf, invitationTitle, isBirthday, isChristmas, isCorporate, stringsFor } from '../templates/strings'
import Loader from '../components/Loader'
import { siteHost, siteUrl } from '../lib/siteUrl'

// The page frame: soft ivory, the card in the middle, and who made it at the bottom
function Shell({ lang, children }) {
  return (
    <main className="ei-reveal flex min-h-screen flex-col bg-ivory px-margin-mobile pt-10 pb-8 sm:pt-16" lang={lang}>
      <div className="mx-auto w-full max-w-md flex-1">{children}</div>
      <footer className="mx-auto mt-10 flex w-full max-w-md flex-col items-center gap-1.5 text-center" lang="en">
        <a href={siteUrl()} className="inline-flex items-center gap-2 font-serif text-body-md text-espresso">
          <img src="/brand/eventinvito-mark.png" alt="" width="28" height="28" className="h-7 w-7" />
          <span>
            EventInvito<span className="text-gold">.</span>
          </span>
        </a>
        <a href={siteUrl()} className="text-label-sm tracking-wide text-on-surface-variant hover:text-gold-text">
          {siteHost()}
        </a>
      </footer>
    </main>
  )
}

// The event, like the top of a printed card: who, then when and where
function Header({ invitation }) {
  const lang = invitation.language
  const t = stringsFor(lang, invitation.eventType)
  const title = isBirthday(invitation) || isCorporate(invitation) || isChristmas(invitation) ? invitationTitle(invitation, lang) : hostsOf(invitation, lang)
  const time = formatTime(invitation.eventTime, lang)
  const details = [
    invitation.eventDate && { Icon: CalendarDays, text: formatDate(invitation.eventDate, lang) },
    time && { Icon: Clock, text: time },
    invitation.venueName && { Icon: MapPin, text: invitation.venueName },
  ].filter(Boolean)
  return (
    <header className="relative overflow-hidden rounded-t-2xl border border-b-0 border-bone bg-white px-6 pt-8 pb-6 text-center">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold/40 via-gold to-gold/40" aria-hidden="true" />
      <p className="text-label-sm tracking-[0.25em] text-gold-text uppercase">{t.youAreInvited}</p>
      <h1 className="mt-3 font-serif text-headline-lg-mobile leading-tight text-espresso">{title}</h1>
      <div className="mx-auto mt-4 flex items-center justify-center gap-2" aria-hidden="true">
        <span className="h-px w-10 bg-gold/60" />
        <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
        <span className="h-px w-10 bg-gold/60" />
      </div>
      <ul className="mt-4 space-y-1.5 text-body-md text-espresso">
        {details.map(({ Icon, text }) => (
          <li key={text} className="flex items-center justify-center gap-2">
            <Icon size={16} className="shrink-0 text-gold-text" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>
    </header>
  )
}

export default function QrReply() {
  const { code } = useParams()
  const [state, setState] = useState({ status: 'loading' })
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState(null) // { q, matches, tooMany } for the last search
  const [searching, setSearching] = useState(false)
  const [message, setMessage] = useState('')
  const [open, setOpen] = useState(false) // the list of names under the box
  const [active, setActive] = useState(-1) // the name picked with the arrow keys
  const [guest, setGuest] = useState(null) // the guest they chose
  const [sending, setSending] = useState('')
  const [sent, setSent] = useState(false)
  const inputRef = useRef(null)
  const lastAsked = useRef('')

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    // The envelope shows for at least a moment, so a fast answer doesn't just flash
    const started = Date.now()
    const settle = (next) => setTimeout(() => setState(next), Math.max(0, 700 - (Date.now() - started)))
    api(`/qr/${encodeURIComponent(code)}`, { auth: false })
      .then((data) => {
        settle({ status: 'ready', invitation: data.invitation })
        document.title = `${invitationTitle(data.invitation, data.invitation.language)} — Reply`
      })
      .catch((err) => settle({ status: 'error', code: err.code, message: err.message }))
    return () => {
      document.title = 'EventInvito'
    }
  }, [code])

  // Search as they type: from 3 letters, a moment after they stop typing
  const lettersTyped = query.replace(/[^\p{L}\p{N}]/gu, '').length
  useEffect(() => {
    if (state.status !== 'ready' || guest) return undefined
    const q = query.trim()
    if (lettersTyped < 3) return undefined // too short: the list stays hidden (see showList)
    const timer = setTimeout(async () => {
      lastAsked.current = q
      setSearching(true)
      try {
        const data = await api(`/qr/${encodeURIComponent(code)}/find`, { method: 'POST', body: { name: q }, auth: false })
        if (lastAsked.current !== q) return // they kept typing: a newer search is on its way
        setSearch({ q, ...data })
        setActive(data.matches.length ? 0 : -1)
        setOpen(true)
        setMessage('')
      } catch (err) {
        if (lastAsked.current !== q) return
        setSearch(null)
        const qs = qrStringsFor(state.invitation.language, state.invitation.eventType)
        setMessage(err.status === 404 ? qs.unavailable(qs.who) : err.message)
      } finally {
        if (lastAsked.current === q) setSearching(false)
      }
    }, 350)
    return () => clearTimeout(timer)
  }, [query, lettersTyped, code, state, guest])

  if (state.status === 'loading') {
    return <Loader label="Opening your reply page" full />
  }

  if (state.status === 'error') {
    // We can't tell whose event it is from a closed code, so the wording doesn't say "the couple"
    const q = qrStringsFor('en', 'other')
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
  const answerLabel = (st) => (st === 'attending' ? t.accept : t.decline)
  const matches = search?.matches || []
  const showList = open && lettersTyped >= 3 && search && !searching

  function choose(m) {
    setGuest(m)
    setOpen(false)
    setMessage('')
  }

  function onKeyDown(e) {
    if (!showList || !matches.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      choose(matches[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
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

      <section className="rounded-b-2xl border border-bone bg-surface-container-low px-6 pt-6 pb-7 shadow-[0_24px_48px_-32px_rgba(43,38,37,0.35)]" aria-labelledby="qr-h">
        <h2 id="qr-h" className="text-center font-serif text-headline-sm text-espresso">
          {q.heading}
        </h2>
        {invitation.rsvpOpen && deadline && <p className="mt-1 text-center text-body-sm text-on-surface-variant">{q.replyBy(deadline)}</p>}

        {!invitation.rsvpOpen ? (
          <p className="mt-5 rounded-lg bg-blush-tint px-4 py-3 text-body-md text-espresso" role="status">
            {t.closed}
          </p>
        ) : !guest ? (
          /* ---- 1. Find your name: names appear as they type ---- */
          <div className="mt-6">
            <label htmlFor="qr-name" className="text-label-md text-espresso">
              {q.findLabel}
            </label>
            <div className="relative mt-2">
              <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
              <input
                id="qr-name"
                ref={inputRef}
                role="combobox"
                aria-expanded={Boolean(showList && matches.length)}
                aria-controls="qr-names"
                aria-autocomplete="list"
                aria-activedescendant={showList && active >= 0 ? `qr-name-${active}` : undefined}
                className="w-full rounded-xl border border-bone bg-white py-3.5 pr-11 pl-11 text-body-md outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,160,89,0.15)]"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setOpen(true)
                  setMessage('')
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder={q.findPlaceholder}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                maxLength={100}
                autoFocus
              />
              {searching && (
                <span className="absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-gold/30 border-t-gold" role="status" aria-label={q.searchingNames} />
              )}

              {/* The names that match */}
              {showList && matches.length > 0 && (
                <ul id="qr-names" role="listbox" className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-xl border border-bone bg-white shadow-float">
                  <li className="px-4 pt-2.5 pb-1 text-label-sm text-on-surface-variant uppercase" role="presentation">
                    {q.pick}
                  </li>
                  {matches.map((m, i) => (
                    <li key={m.id} id={`qr-name-${i}`} role="option" aria-selected={i === active}>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choose(m)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-title-md text-espresso ${i === active ? 'bg-blush-tint' : ''}`}
                      >
                        <span className="min-w-0 truncate">{m.name}</span>
                        <ChevronRight size={18} className="shrink-0 text-gold-text" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Under the box: a hint, or what the search found */}
            {lettersTyped < 3 ? (
              <p className="mt-2 text-body-sm text-on-surface-variant">{q.hint}</p>
            ) : showList && search.tooMany ? (
              <p className="mt-3 rounded-lg bg-blush-tint px-4 py-3 text-body-sm text-espresso" role="status">
                {q.tooMany}
              </p>
            ) : showList && !matches.length ? (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-blush-tint px-4 py-3 text-body-sm text-espresso" role="status">
                <UserX size={18} className="mt-0.5 shrink-0 text-gold-text" aria-hidden="true" />
                {q.notFound(q.who)}
              </p>
            ) : null}
            {message && (
              <p className="mt-3 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container" role="alert">
                {message}
              </p>
            )}
            {/* Leaves room for the list of names on short phones */}
            {showList && matches.length > 0 && <div style={{ height: `${matches.length * 52 + 40}px` }} aria-hidden="true" />}
          </div>
        ) : sent ? (
          /* ---- 3. Thank you ---- */
          <div className="mt-6 text-center" role="status">
            <CheckCircle2 size={40} className="mx-auto text-gold-text" aria-hidden="true" />
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
