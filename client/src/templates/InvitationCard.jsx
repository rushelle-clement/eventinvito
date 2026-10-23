// Draws an invitation in one of the template designs.
// Used by the gallery thumbnails, the editor's live preview, the preview page,
// and (in Phase 3) the guest's personal invitation page.
//
// Props:
//   invitation  – the invitation fields (names, date, venue, language…)
//   templateKey – which design to use
//   guestName   – shows "Dear <name>"; leave empty for a generic greeting
//   rsvp        – optional element to render in the RSVP area (Phase 4); otherwise
//                 a non-clickable sample of the buttons is shown

import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react'
import { getTheme } from './themes'
import { STRINGS, formatDate, formatTime, stringsFor } from './strings'
import { ceremonyList } from './experience/shared'
import { guestNamedInLine, hasParentsLines, inviteLineText } from './wording'
import StaticCard from './experience/StaticCard'
import BirthdayCard from './experience/BirthdayCard'

function Ornament({ color, variant }) {
  if (variant === 'minimal') {
    return <div aria-hidden="true" className="mx-auto my-6 h-px w-24" style={{ background: color }} />
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 160 16" className="mx-auto my-6 h-4 w-40" fill="none">
      <path d="M0 8h62M98 8h62" stroke={color} strokeWidth="1" />
      <path d="M80 1l7 7-7 7-7-7 7-7z" stroke={color} strokeWidth="1" />
      <circle cx="68" cy="8" r="1.5" fill={color} />
      <circle cx="92" cy="8" r="1.5" fill={color} />
    </svg>
  )
}

// The parents' line above a name (in the body font, not the names font)
function ParentsLine({ text, theme }) {
  if (!text?.trim()) return null
  return (
    <span className="mb-1 block text-[15px] leading-6 font-medium not-italic" style={{ fontFamily: theme.headingFont, color: theme.muted }}>
      {text.trim()}
    </span>
  )
}

function Detail({ icon: Icon, label, children, theme, latin }) {
  if (!children) return null
  return (
    <div className="flex items-start gap-3 text-left">
      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: theme.accentText }} />
      <div>
        <p className={latin ? 'text-[11px] tracking-[0.12em] uppercase' : 'text-[13px]'} style={{ color: theme.muted }}>
          {label}
        </p>
        <div className="mt-0.5 text-[15px] leading-6" style={{ color: theme.text }}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default function InvitationCard({ invitation, templateKey, guestName, rsvp, className = '' }) {
  const theme = getTheme(templateKey)
  const lang = STRINGS[invitation.language] ? invitation.language : 'en'
  const t = stringsFor(lang, invitation.eventType)

  const one = invitation.partnerOne || (lang === 'en' ? 'Partner one' : '…')
  const two = invitation.partnerTwo || (lang === 'en' ? 'Partner two' : '…')
  const hasParents = Boolean(invitation.partnerOneParents?.trim() || invitation.partnerTwoParents?.trim())
  const inviteLine = inviteLineText(invitation, guestName)
  const date = formatDate(invitation.eventDate, lang)
  const start = formatTime(invitation.eventTime, lang)
  const end = formatTime(invitation.endTime, lang)
  const time = start && end ? `${start} – ${end}` : start
  const deadline = formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' })

  // Wide letter-spacing and capitals only suit Latin script; they pull Sinhala/Tamil letters apart
  const latin = lang === 'en'

  const ceremonies = ceremonyList(invitation, lang)

  // Free designs preview as their own static card
  if (theme.free) {
    return (
      <div className={`overflow-hidden rounded-xl ${className}`}>
        {theme.birthday ? (
          <BirthdayCard invitation={{ ...invitation, templateKey }} guestName={guestName} t={t} lang={lang} embedded />
        ) : (
          <StaticCard invitation={{ ...invitation, templateKey }} guestName={guestName} t={t} lang={lang} embedded />
        )}
      </div>
    )
  }

  const regal = theme.layout === 'regal'
  const minimal = theme.layout === 'minimal'
  const romantic = theme.layout === 'romantic'

  return (
    <article
      lang={lang}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ background: theme.card, color: theme.text, fontFamily: theme.bodyFont }}
    >
      {/* Decorative frames per design */}
      {regal && (
        <>
          <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-lg border" style={{ borderColor: theme.accent }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-5 rounded-md border" style={{ borderColor: `${theme.accent}80` }} />
        </>
      )}
      {theme.layout === 'classic' && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-lg border" style={{ borderColor: `${theme.accent}66` }} />
      )}
      {romantic && <div aria-hidden="true" className="h-3" style={{ background: theme.accent }} />}

      <div className={`relative px-8 pb-10 sm:px-12 ${romantic ? 'pt-10' : 'pt-12'} ${minimal ? 'text-left' : 'text-center'}`}>
        {/* Personal greeting (left out when the closing line already names the guest) */}
        {!guestNamedInLine(invitation) && (
          <p
            className={`inline-block rounded-full px-4 py-1.5 font-semibold ${latin ? 'text-[12px] tracking-[0.08em] uppercase' : 'text-[14px]'}`}
            style={{ background: theme.soft, color: theme.accentText }}
          >
            {guestName ? t.dear(guestName) : t.dearGuest}
          </p>
        )}

        {!hasParentsLines(invitation) && (
          <p className={`mt-8 ${latin ? 'text-[12px] tracking-[0.18em] uppercase' : 'text-[15px]'}`} style={{ color: theme.muted }}>
            {t.together}
          </p>
        )}

        {invitation.hostLine && (
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-6 italic" style={{ color: theme.muted, fontFamily: theme.headingFont }}>
            {invitation.hostLine}
          </p>
        )}

        <h2
          className={`mt-6 leading-[1.1] break-words ${minimal ? 'text-[44px] font-light' : 'text-[46px]'}`}
          style={{ fontFamily: theme.namesFont, fontStyle: theme.namesStyle, color: regal ? theme.accentText : theme.text }}
        >
          {hasParents ? (
            <>
              <span className="block">
                <ParentsLine text={invitation.partnerOneParents} theme={theme} />
                {one}
              </span>
              <span className="my-1 block text-[0.6em]" style={{ color: theme.accentText }}>
                {t.and}
              </span>
              <span className="block">
                <ParentsLine text={invitation.partnerTwoParents} theme={theme} />
                {two}
              </span>
            </>
          ) : (
            <>
              {one}
              <span className="mx-3 inline-block align-middle text-[0.6em]" style={{ color: theme.accentText }}>
                {t.and}
              </span>
              {two}
            </>
          )}
        </h2>

        <p className="mx-auto mt-5 max-w-md text-[15px] leading-7" style={{ color: theme.muted }}>
          {invitation.message || t.defaultInvite}
        </p>
        {inviteLine && (
          <p className="mx-auto mt-3 max-w-md text-[16px] leading-7 font-semibold" style={{ color: theme.text }}>
            {inviteLine}
          </p>
        )}

        <Ornament color={theme.accent} variant={theme.layout} />

        <div
          className="mx-auto grid max-w-md gap-5 rounded-lg p-6"
          style={{ background: regal ? theme.soft : minimal ? 'transparent' : `${theme.soft}99`, border: minimal ? `1px solid ${theme.border}` : 'none' }}
        >
          <Detail icon={CalendarDays} label={t.date} theme={theme} latin={latin}>
            {date || '—'}
          </Detail>
          <Detail icon={Clock} label={t.time} theme={theme} latin={latin}>
            {time || '—'}
          </Detail>
          <Detail icon={MapPin} label={t.venue} theme={theme} latin={latin}>
            <span className="font-semibold">{invitation.venueName || '—'}</span>
            {invitation.address && <span className="block text-[14px]" style={{ color: theme.muted }}>{invitation.address}</span>}
            {invitation.mapUrl && (
              <a
                href={invitation.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-[13px] font-semibold underline underline-offset-4"
                style={{ color: theme.accentText }}
              >
                {t.viewMap}
              </a>
            )}
          </Detail>
          <Detail icon={Shirt} label={t.dressCode} theme={theme} latin={latin}>
            {invitation.dressCode}
          </Detail>
        </div>

        {ceremonies.length > 0 && (
          <div className="mx-auto mt-6 max-w-md text-left">
            <p className={latin ? 'text-center text-[11px] tracking-[0.18em] uppercase' : 'text-center text-[14px]'} style={{ color: theme.muted }}>
              {t.programme}
            </p>
            <ol className="mt-3 space-y-3">
              {ceremonies.map((c, i) => (
                <li key={`${c.name}-${i}`} className="rounded-lg px-4 py-3" style={{ border: `1px solid ${theme.border}` }}>
                  <p className="text-[16px]" style={{ fontFamily: theme.headingFont, color: regal ? theme.accentText : theme.text }}>
                    {c.name}
                  </p>
                  {(c.dateText || c.timeText) && (
                    <p className="text-[13px] font-semibold" style={{ color: theme.accentText }}>
                      {[c.dateText, c.timeText].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {c.venue && (
                    <p className="text-[13px]" style={{ color: theme.muted }}>
                      {c.venue}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* RSVP area */}
        <div className="mx-auto mt-8 max-w-md">
          <p className="text-[18px]" style={{ fontFamily: theme.headingFont, color: regal ? theme.accentText : theme.text }}>
            {t.rsvpPrompt}
          </p>
          {deadline && (
            <p className="mt-1 text-[13px]" style={{ color: theme.muted }}>
              {t.rsvpBy(deadline)}
            </p>
          )}
          {rsvp || (
            <div className={`mt-4 grid grid-cols-1 gap-3 ${lang === 'en' ? 'sm:grid-cols-2' : ''}`} aria-hidden="true">
              <span
                className="rounded-full px-4 py-3 text-center text-[14px] font-semibold"
                style={{ background: theme.accent, color: theme.onAccent || (regal ? theme.page : '#ffffff') }}
              >
                {t.accept}
              </span>
              <span
                className="rounded-full border px-4 py-3 text-center text-[14px] font-semibold"
                style={{ borderColor: theme.accent, color: theme.accentText }}
              >
                {t.decline}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
