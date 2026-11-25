// The day plan page guests open from their invitation ("Day plan"): the timed list of the day in
// the invitation's own colours and fonts. On the day it shows what's happening now and what's
// next, and keeps itself up to date; before the day it counts down, afterwards it says thank you.
// Also used by the couple's preview.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock, MapPin } from 'lucide-react'
import { getTheme } from '../templates/themes'
import { formatDate, formatTime, invitationTitle } from '../templates/strings'
import { agendaState, agendaStrings, daysUntil, scheduleOf } from '../lib/agenda'
import './agendaView.css'

const TICK = 30000 // re-check the time every 30 seconds

// `demoNow`: show the plan as at this moment, without ticking (the gallery's sample)
// onBack: a button instead of the back link (the day plan opened over the invitation)
export default function AgendaView({ invitation, backTo, onBack, topOffset = 0, demoNow }) {
  const theme = getTheme(invitation.templateKey)
  const lang = invitation.language || 'en'
  const s = agendaStrings(lang)
  const [clock, setNow] = useState(() => new Date())
  const now = demoNow || clock
  const currentRef = useRef(null)

  useEffect(() => {
    if (demoNow) return undefined
    const id = setInterval(() => setNow(new Date()), TICK)
    return () => clearInterval(id)
  }, [demoNow])

  const schedule = useMemo(() => scheduleOf(invitation.agenda, invitation.eventDate), [invitation.agenda, invitation.eventDate])
  const state = agendaState(schedule, now)
  const multiDay = new Set(schedule.map((a) => a.day)).size > 1
  const focus = state.current || state.next

  // On the day, bring what's on now (or next) into view once
  const focusKey = focus ? `${focus.day} ${focus.time} ${focus.title}` : ''
  const scrolled = useRef(false)
  useEffect(() => {
    if (scrolled.current || state.phase !== 'during' || !currentRef.current) return
    scrolled.current = true
    currentRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [focusKey, state.phase])

  const title = invitationTitle(invitation, lang)
  const t = (time) => formatTime(time, lang)

  // The line under the heading
  let status = ''
  if (state.phase === 'before') {
    const days = daysUntil(state.first.day, now)
    status = days <= 0 ? s.startsToday(t(state.first.time)) : s.daysToGo(days)
  } else if (state.phase === 'after') status = s.over

  const vars = {
    '--ag-page': theme.page,
    '--ag-card': theme.card,
    '--ag-text': theme.text,
    '--ag-muted': theme.muted,
    '--ag-accent': theme.accent,
    '--ag-accent-text': theme.accentText,
    '--ag-on-accent': theme.onAccent || '#fff',
    '--ag-soft': theme.soft,
    '--ag-border': theme.border,
    '--ag-heading': theme.headingFont,
    '--ag-body': theme.bodyFont,
  }

  return (
    <main className="ag-page" style={{ ...vars, paddingTop: topOffset }} lang={lang}>
      <div className="ag-wrap">
        {onBack ? (
          <button type="button" onClick={onBack} className="ag-back">
            <ArrowLeft size={15} aria-hidden="true" /> {s.back}
          </button>
        ) : (
          backTo && (
            <Link to={backTo} className="ag-back">
              <ArrowLeft size={15} aria-hidden="true" /> {s.back}
            </Link>
          )
        )}

        <header className="ag-head">
          <p className="ag-eyebrow">{s.title}</p>
          <h1 className="ag-title">{title}</h1>
          {invitation.eventDate && <p className="ag-date">{formatDate(invitation.eventDate, lang)}</p>}
          {status && (
            <p className="ag-status" role="status">
              {status}
            </p>
          )}
        </header>

        {state.phase === 'empty' ? (
          <p className="ag-empty">{s.empty}</p>
        ) : (
          <ol className="ag-list">
            {schedule.map((a, i) => {
              const isNow = state.current === a
              const isNext = !state.current && state.next === a && state.phase === 'during'
              const past = a.end <= now
              const showDay = multiDay && (i === 0 || a.day !== schedule[i - 1].day)
              const minutes = Math.max(1, Math.round((a.start - now) / 60000))
              return (
                <li key={i} className={`ag-item ${isNow ? 'is-now' : ''} ${isNext ? 'is-next' : ''} ${past ? 'is-past' : ''}`} ref={isNow || isNext ? currentRef : undefined}>
                  {showDay && <p className="ag-day">{formatDate(a.day, lang)}</p>}
                  <div className="ag-row">
                    <div className="ag-time">
                      <span>{t(a.time)}</span>
                      {a.endTime && <span className="ag-until">{s.until(t(a.endTime))}</span>}
                    </div>
                    <span className="ag-dot" aria-hidden="true">
                      {past && <Check size={11} />}
                    </span>
                    <div className="ag-body">
                      {isNow && <p className="ag-badge is-now">{s.now}</p>}
                      {isNext && <p className="ag-badge">{s.next} · {s.inMinutes(minutes)}</p>}
                      {!isNow && !isNext && state.phase === 'during' && state.next === a && (
                        <p className="ag-badge is-soft">
                          <Clock size={12} aria-hidden="true" /> {s.inMinutes(minutes)}
                        </p>
                      )}
                      <p className="ag-item-title">{a.title}</p>
                      {a.place && (
                        <p className="ag-place">
                          <MapPin size={13} aria-hidden="true" /> {a.place}
                        </p>
                      )}
                      {a.note && <p className="ag-note">{a.note}</p>}
                      {past && <span className="sr-only">{s.done}</span>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        )}

        <p className="ag-sign">EventInvito</p>
      </div>
    </main>
  )
}
