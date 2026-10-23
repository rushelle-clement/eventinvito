// The five free birthday designs: one static card for one person, with their age as the
// centrepiece. No opening animation, music, photos or RSVP (those come with Premium).
// Each design is a variant (its template key) with its own colours, type and drawn artwork.

import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import { ceremonyList, timeRange } from './shared'
import { formatDate } from '../strings'
import { InviteLine } from './Wording'
import { guestNamedInLine } from '../wording'
import { BIRTHDAY_ART } from './BirthdayArt'
import './birthdayCard.css'

// "5th Birthday": a big number with the caption under it (or just "Birthday" without an age)
export function AgeMark({ age, t, latin, className = '' }) {
  if (age == null || age === '') {
    return <p className={`bc-age-only ${className}`}>{t.bdayAge(null)}</p>
  }
  const suffix = latin ? t.bdaySuffix(Number(age)) : ''
  return (
    <p className={`bc-age ${className}`}>
      <span className="bc-age-num">
        {age}
        {suffix && <sup className="bc-age-sfx">{suffix}</sup>}
      </span>
      <span className="bc-age-cap">{t.bdayNumCaption}</span>
    </p>
  )
}

export default function BirthdayCard({ invitation, guestName, t, lang, embedded = false }) {
  const variant = BIRTHDAY_ART[invitation.templateKey] ? invitation.templateKey : 'confetti-pop'
  const Art = BIRTHDAY_ART[variant]
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)

  return (
    <main className={`bc-page bc-${variant} ${embedded ? 'is-embedded' : ''}`} lang={lang}>
      <article className="bc-card">
        <Art />
        <div className="bc-body">
          {invitation.blessing && <p className="bc-blessing">{invitation.blessing}</p>}
          {!guestNamedInLine(invitation) && <p className={`bc-greeting ${local}`}>{guestName ? t.dear(guestName) : t.together}</p>}
          {invitation.hostLine && <p className="bc-hostline">{invitation.hostLine}</p>}
          <p className={`bc-eyebrow ${local}`}>{t.bdayJoin}</p>

          <h1 className="bc-name">{invitation.celebrant || '…'}</h1>
          <AgeMark age={invitation.age} t={t} latin={latin} />

          <p className="bc-message">{invitation.message || t.defaultInvite}</p>
          <InviteLine invitation={invitation} guestName={guestName} />

          <div className="bc-details">
            <div className="bc-detail">
              <CalendarDays className="bc-icon" size={20} aria-hidden="true" />
              <p className={`bc-label ${local}`}>{t.when}</p>
              <p className="bc-value">{date || '—'}</p>
              {time && (
                <p className="bc-sub">
                  <Clock size={14} aria-hidden="true" /> {time}
                </p>
              )}
            </div>
            <div className="bc-detail">
              <MapPin className="bc-icon" size={20} aria-hidden="true" />
              <p className={`bc-label ${local}`}>{t.where}</p>
              <p className="bc-value">{invitation.venueName || '—'}</p>
              {invitation.address && <p className="bc-sub">{invitation.address}</p>}
              {invitation.mapUrl && (
                <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="bc-link">
                  {t.viewMap}
                </a>
              )}
            </div>
          </div>

          {invitation.dressCode && (
            <p className="bc-dress">
              <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
            </p>
          )}

          {ceremonies.length > 0 && (
            <section className="bc-programme" aria-labelledby="bc-cer-h">
              <h2 id="bc-cer-h" className={`bc-label ${local}`}>
                {t.programme}
              </h2>
              <ol>
                {ceremonies.map((c, i) => (
                  <li key={`${c.name}-${i}`}>
                    <p className="bc-cer-name">{c.name}</p>
                    {(c.dateText || c.timeText) && <p className="bc-sub">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>}
                    {c.venue && <p className="bc-sub">{c.venue}</p>}
                    {c.note && <p className="bc-sub italic">{c.note}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </article>
      {guestName && !embedded && <p className="bc-note">{t.personalNote(guestName)}</p>}
    </main>
  )
}
