// The five free designs: a single, beautifully typeset invitation card.
// Guests reply on the card (no deadline: replies stay open until the event).
// No opening animation and no photos — those come with the Premium designs. Its default music
// (templates/music.js defaultTrackFor) is played by InvitationExperience.
// Each design is a variant (its template key) with its own colours, type and ornament
// (watercolour / line-art images in /public/free; borders and rules are drawn in code).

import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import { ceremonyList, names, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './staticCard.css'

const ART = `${import.meta.env.BASE_URL}free/`
const img = (name) => `${ART}${name}.webp`

// What each design draws around its card
const VARIANTS = {
  'ivory-classic': { corners: 'ivory-corner', at: ['tl', 'tr', 'bl', 'br'] },
  'modern-monochrome': { sprig: 'mono-sprig' },
  'pastel-blossom': { top: 'blossom-garland' },
  'sinhala-swarna': { corners: 'sinhala-corner', at: ['tl', 'tr', 'bl', 'br'] },
  'simple-lotus': { top: 'lotus' },
  'midnight-rose': { corners: 'noir-rose-corner', at: ['tl', 'br'] },
  'rathu-liyawela': { corners: 'liyawel-corner', at: ['tl', 'tr', 'bl', 'br'], top: 'gold-lotus' },
}

function Rule({ className = '' }) {
  return (
    <span className={`sc-rule ${className}`} aria-hidden="true">
      <span />
    </span>
  )
}

export default function StaticCard({ invitation, guestName, rsvp, t, lang, embedded = false }) {
  const variant = VARIANTS[invitation.templateKey] ? invitation.templateKey : 'ivory-classic'
  const art = VARIANTS[variant]
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
  const { one, two } = names(invitation)
  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)

  return (
    <main className={`sc-page sc-${variant} ${embedded ? 'is-embedded' : ''}`} lang={lang}>
      <article className="sc-card">
        <span className="sc-frame" aria-hidden="true" />
        {art.corners &&
          art.at.map((at) => <img key={at} className={`sc-corner ${at}`} src={img(art.corners)} alt="" aria-hidden="true" decoding="async" />)}
        {art.top && <img className="sc-top" src={img(art.top)} alt="" aria-hidden="true" decoding="async" />}
        {art.sprig && <img className="sc-sprig" src={img(art.sprig)} alt="" aria-hidden="true" decoding="async" />}

        <div className="sc-body">
          {invitation.blessing && <p className="sc-blessing">{invitation.blessing}</p>}
          {!guestNamedInLine(invitation) && <p className={`sc-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>}
          {!hasParentsLines(invitation) && <p className={`sc-eyebrow ${local}`}>{t.together}</p>}
          {invitation.hostLine && <p className="sc-hostline">{invitation.hostLine}</p>}

          <h1 className="sc-names">
            <span className="sc-name">
              <Parents text={invitation.partnerOneParents} />
              {one}
            </span>
            <span className="sc-amp">{t.and}</span>
            <span className="sc-name">
              <Parents text={invitation.partnerTwoParents} />
              {two}
            </span>
          </h1>

          <Rule />
          <p className="sc-message">{invitation.message || t.defaultInvite}</p>
          <InviteLine invitation={invitation} guestName={guestName} />

          <div className="sc-details">
            <div className="sc-detail">
              <CalendarDays className="sc-icon" size={18} aria-hidden="true" />
              <p className={`sc-label ${local}`}>{t.when}</p>
              <p className="sc-value">{date || '—'}</p>
              {time && (
                <p className="sc-sub">
                  <Clock size={14} aria-hidden="true" /> {time}
                </p>
              )}
            </div>
            <div className="sc-detail">
              <MapPin className="sc-icon" size={18} aria-hidden="true" />
              <p className={`sc-label ${local}`}>{t.where}</p>
              <p className="sc-value">{invitation.venueName || '—'}</p>
              {invitation.address && <p className="sc-sub">{invitation.address}</p>}
              {invitation.mapUrl && (
                <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="sc-link">
                  {t.viewMap}
                </a>
              )}
            </div>
          </div>

          {invitation.dressCode && (
            <p className="sc-dress">
              <Shirt size={14} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
            </p>
          )}

          {ceremonies.length > 0 && (
            <section className="sc-programme" aria-labelledby="sc-cer-h">
              <h2 id="sc-cer-h" className={`sc-label ${local}`}>
                {t.programme}
              </h2>
              <ol>
                {ceremonies.map((c, i) => (
                  <li key={`${c.name}-${i}`}>
                    <p className="sc-cer-name">{c.name}</p>
                    {(c.dateText || c.timeText) && (
                      <p className="sc-sub">
                        {c.dateText}
                        {c.dateText && c.timeText && ' · '}
                        {c.timeText}
                      </p>
                    )}
                    {c.venue && <p className="sc-sub">{c.venue}</p>}
                    {c.note && <p className="sc-sub italic">{c.note}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {rsvp && !embedded && (
            <section className="sc-rsvp" aria-labelledby="sc-rsvp-h">
              <h2 id="sc-rsvp-h" className={`sc-label ${local}`}>
                {t.rsvpPrompt}
              </h2>
              {/* Free cards have no reply-by date, except the free online card of a Printed Cards event */}
              {invitation.rsvpDeadline && <p className="sc-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>}
              {rsvp}
            </section>
          )}

          <Rule className="end" />
          <p className="sc-sign">
            {one} <span className="sc-amp">{t.and}</span> {two}
          </p>
        </div>
      </article>
      {guestName && !embedded && <p className="sc-note">{t.personalNote(guestName)}</p>}
    </main>
  )
}
