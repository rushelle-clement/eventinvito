// Pieces shared by the ten corporate designs (free cards and Premium): the company logo, the
// invitation's heading, the date, the details, the programme and the sign-off. Each design styles
// them through its own CSS variables (see corporate.css), so they look like part of that design.

import { MapPin, Shirt } from 'lucide-react'
import { ceremonyList, timeRange } from './shared'
import { formatDate } from '../strings'
import { InviteLine } from './Wording'
import { guestNamedInLine } from '../wording'

// The logo in one colour that matches each design (logoStyle "mono")
const MONO = {
  'corporate-elegance': '#b5964f',
  'modern-business': '#dfe5ee',
  'blue-gradient': '#ffffff',
  'minimal-editorial': '#111111',
  'emerald-prestige': '#d9bc76',
  'black-tie-gala': '#d8b86e',
  'tech-innovation': '#b7c9ff',
  'corporate-anniversary': '#7a1f2b',
  'corporate-anniversary-front': '#e9d3a8', // on the burgundy front
  'product-launch': '#d9dce1',
  'networking-cocktail': '#e8cfa3',
}

// An uploaded logo, recoloured by Cloudinary (no cross-site mask needed): one colour, shapes kept
function recoloured(url, hex) {
  return url.replace('/image/upload/', `/image/upload/e_colorize:100,co_rgb:${hex.slice(1)}/`)
}

// The company logo, in its own colours or in one colour of the design (`style` "mono").
// `plate`: on dark designs a logo in its own colours sits on a plate tinted to the design.
export function CorpLogo({ logo, style = 'original', variant, plate = false, className = '' }) {
  if (!logo?.url) return null
  const mono = style === 'mono' && MONO[variant]
  if (mono) {
    // Cloudinary logos are recoloured as images; others (the gallery's sample) through a mask
    if (logo.url.includes('res.cloudinary.com')) {
      return (
        <span className={`cx-logo is-mono ${className}`}>
          <img src={recoloured(logo.url, mono)} alt="" decoding="async" />
        </span>
      )
    }
    const ratio = logo.width && logo.height ? `${logo.width} / ${logo.height}` : '4 / 1'
    return (
      <span className={`cx-logo is-mono ${className}`}>
        <span className="cx-logo-mask" style={{ aspectRatio: ratio, backgroundColor: mono, WebkitMaskImage: `url(${logo.url})`, maskImage: `url(${logo.url})` }} />
      </span>
    )
  }
  return (
    <span className={`cx-logo ${plate ? 'is-plate' : ''} ${className}`}>
      <img src={logo.url} alt="" decoding="async" />
    </span>
  )
}

// "Lumora Holdings cordially invites you to" (or the host's own line)
export function InvitesLine({ invitation, t, className = '' }) {
  const text = invitation.hostLine || (invitation.companyName ? t.corpInvites?.(invitation.companyName) : t.together)
  return text ? <p className={`cx-invites ${className}`}>{text}</p> : null
}

export function Greeting({ invitation, guestName, t, className = '' }) {
  if (guestNamedInLine(invitation)) return null
  return <p className={`cx-greeting ${className}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>
}

// When / Where (and the dress code)
export function Details({ invitation, t, lang, className = '' }) {
  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  return (
    <div className={`cx-details ${className}`}>
      <div className="cx-detail">
        <p className="cx-label">{t.when}</p>
        <p className="cx-value">{date || '—'}</p>
        {time && <p className="cx-sub">{time}</p>}
      </div>
      <div className="cx-detail">
        <p className="cx-label">{t.where}</p>
        <p className="cx-value">{invitation.venueName || '—'}</p>
        {invitation.address && <p className="cx-sub">{invitation.address}</p>}
        {invitation.mapUrl && (
          <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="cx-link">
            <MapPin size={14} aria-hidden="true" /> {t.viewMap}
          </a>
        )}
      </div>
      {invitation.dressCode && (
        <p className="cx-dress">
          <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
        </p>
      )}
    </div>
  )
}

// The programme (the invitation's "ceremonies": registration, keynote, awards, dinner…)
export function Programme({ invitation, t, lang, className = '' }) {
  const items = ceremonyList(invitation, lang)
  if (!items.length) return null
  return (
    <section className={`cx-programme ${className}`} aria-label={t.programme}>
      <p className="cx-label">{t.programme}</p>
      <ol>
        {items.map((c, i) => (
          <li key={`${c.name}-${i}`}>
            <span className="cx-prog-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</span>
            <span className="cx-prog-name">{c.name}</span>
            {c.venue && <span className="cx-sub">{c.venue}</span>}
            {c.note && <span className="cx-sub italic">{c.note}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Message({ invitation, guestName, t, className = '' }) {
  return (
    <div className={`cx-message-wrap ${className}`}>
      <p className="cx-message">{invitation.message || t.defaultInvite}</p>
      <InviteLine invitation={invitation} guestName={guestName} />
    </div>
  )
}

export function Reply({ invitation, rsvp, t, lang, className = '' }) {
  if (!rsvp) return null
  return (
    <section className={`cx-reply ${className}`} aria-label={t.rsvpPrompt}>
      <p className="cx-label">{t.kindlyReply}</p>
      <h2 className="cx-reply-title">{t.rsvpPrompt}</h2>
      {invitation.rsvpDeadline && <p className="cx-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>}
      <div className="cx-reply-form">{rsvp}</div>
    </section>
  )
}
