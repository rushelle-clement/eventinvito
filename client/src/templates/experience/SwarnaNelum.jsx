// Template 11 — Swarna Nelum (Golden Lotus): a traditional Sinhala design in gold and ivory, with
// fine gold line art — a sandakada pahana (moonstone), Liyawel scroll borders and a white lotus.
//
// Opening ("The Golden Moonstone"): on ivory paper, a moonstone reveals itself from its lotus
// outwards, ring by ring — beads, Liyawel scrolls, hamsa swans, the flame band — and a gold sheen
// passes over it. Carved Liyawel bands sweep in along the top and bottom of the screen. The
// moonstone then settles at the foot of the screen like a temple doorstep, and the invitation card
// appears above it, crowned with the white lotus; the names, date, venue and "Open Invitation"
// button follow. Tapping it starts the music (if chosen) and opens the full invitation.
//
// The artwork is gold line art in /public/swarna-nelum (see swarnaArt.jsx).

import { useEffect, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, names, prefersReducedMotion, timeRange, galleryClass } from './shared'
import { formatDate } from '../strings'
import { CarvedBand, Corner, Lotus, LotusDivider, Moonstone } from './swarnaArt'
import './swarnaNelum.css'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'

const DONE_AT = 1300

export default function SwarnaNelum({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed') // closed → revealing → open
  const [skipped, setSkipped] = useState(false)
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const { one, two } = names(invitation)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Keyboard users land on the button once it appears; after opening, on the invitation
  useEffect(() => {
    if (poster) return undefined
    if (phase === 'open') {
      headingRef.current?.focus({ preventScroll: true })
      return undefined
    }
    if (phase !== 'closed') return undefined
    const delay = skipped || prefersReducedMotion() ? 0 : 6500
    const id = setTimeout(() => openBtnRef.current?.focus({ preventScroll: true }), delay)
    return () => clearTimeout(id)
  }, [phase, poster, skipped])

  function open() {
    music.play() // inside the tap, so browsers allow sound
    timers.current.forEach(clearTimeout)
    if (prefersReducedMotion()) {
      setPhase('open')
      return
    }
    setPhase('revealing')
    timers.current = [setTimeout(() => setPhase('open'), DONE_AT)]
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)
  const photos = invitation.photos || []
  const local = latin ? '' : 'is-local'

  return (
    <>
      {/* ---------- Opening: the golden lotus mandala ---------- */}
      {phase !== 'open' && (
        <div
          className={`sn-opening ${skipped ? 'is-skipped' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          {/* background layers, clipped so the widening rosette never makes the screen scroll */}
          <div className="sn-scene" aria-hidden="true">
            <span className="sn-glow" />
            <div className="sn-open-stone">
              <Moonstone />
              <span className="sn-sheen" />
            </div>
            <CarvedBand className="sn-open-band top" />
            <CarvedBand className="sn-open-band bottom" />
          </div>

          <div className="sn-open-card">
            <Lotus className="sn-card-lotus" />
            <div className="sn-open-text" lang={lang}>
              <p className={`sn-eyebrow ${local} sn-step s1`}>{guestName ? t.forGuest(guestName) : t.youAreInvited}</p>
              <p className="sn-open-names sn-step s2">
                <span>{one}</span>
                <span className="sn-amp">{t.and}</span>
                <span>{two}</span>
              </p>
              <span className="sn-open-rule sn-step s3" aria-hidden="true" />
              <p className={`sn-open-date ${local} sn-step s3`}>{date}</p>
              {invitation.venueName && <p className={`sn-open-venue ${local} sn-step s4`}>{invitation.venueName}</p>}
              <button ref={openBtnRef} type="button" className="sn-open-btn sn-step s5" onClick={open} disabled={phase !== 'closed'}>
                {t.openInvitation}
              </button>
            </div>
          </div>

          {!skipped && phase === 'closed' && (
            <button type="button" className="ei-skip sn-skip" onClick={() => setSkipped(true)} lang={lang}>
              {t.skip}
            </button>
          )}
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {phase !== 'closed' && (
        <main className={`sn-invite ${phase === 'revealing' ? 'is-entering' : ''}`} lang={lang}>
          <section className="sn-section sn-hero">
            <div className="sn-card">
              <CarvedBand className="sn-card-band top" />
              <Corner className="bl" />
              <Corner className="br" />
              <div className="sn-card-body">
                <Lotus className="sn-watermark" />
                <Lotus className="sn-hero-lotus" />
                <Reveal variant="fade">
                  {!guestNamedInLine(invitation) && <p className="sn-greeting">{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                </Reveal>
                {invitation.blessing && (
                  <Reveal variant="fade" delay={80}>
                    <p className="sn-blessing">{invitation.blessing}</p>
                  </Reveal>
                )}
                <Reveal delay={150}>
                  {!hasParentsLines(invitation) && <p className={`sn-eyebrow ${local} mt-5`}>{t.together}</p>}
                  {invitation.hostLine && <p className="sn-hostline">{invitation.hostLine}</p>}
                </Reveal>
                <h1 ref={headingRef} tabIndex={-1} className="sn-names outline-none">
                  <span className="sn-name" style={{ animationDelay: '0.3s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="sn-amp" style={{ animationDelay: '0.6s' }}>
                    {t.and}
                  </span>
                  <span className="sn-name" style={{ animationDelay: '0.8s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>
                <Reveal delay={900}>
                  <LotusDivider />
                  <p className="sn-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                </Reveal>
                <Reveal delay={1100}>
                  <p className="sn-date">{date || '—'}</p>
                  {time && <p className={`sn-when ${local}`}>{time}</p>}
                  {invitation.venueName && <p className={`sn-venue ${local}`}>{invitation.venueName}</p>}
                </Reveal>
              </div>
              <CarvedBand className="sn-card-band bottom" />
            </div>
          </section>

          <section className="sn-section">
            <div className="sn-details">
              <Reveal className="sn-panel">
                <Lotus className="sn-panel-lotus" loading="lazy" />
                <p className={`sn-eyebrow ${local}`}>{t.when}</p>
                <p className="sn-panel-title">{date || '—'}</p>
                {time && (
                  <p className="sn-sub inline-flex items-center gap-2">
                    <Clock size={15} aria-hidden="true" /> {time}
                  </p>
                )}
              </Reveal>
              <Reveal className="sn-panel" delay={120}>
                <Lotus className="sn-panel-lotus" loading="lazy" />
                <p className={`sn-eyebrow ${local}`}>{t.where}</p>
                <p className="sn-panel-title">{invitation.venueName || '—'}</p>
                {invitation.address && <p className="sn-sub">{invitation.address}</p>}
                {invitation.mapUrl && (
                  <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="sn-link">
                    {t.viewMap}
                  </a>
                )}
              </Reveal>
            </div>
            {invitation.dressCode && (
              <Reveal className="mt-6 text-center">
                <p className="sn-sub">
                  {t.dressCode}: {invitation.dressCode}
                </p>
              </Reveal>
            )}
          </section>

          {/* Optional: Poruwa ceremony, church ceremony, homecoming… */}
          {ceremonies.length > 0 && (
            <section className="sn-section" aria-labelledby="sn-cer-h">
              <Reveal className="sn-panel">
                <Lotus className="sn-panel-lotus" loading="lazy" />
                <h2 id="sn-cer-h" className={`sn-eyebrow ${local}`}>
                  {t.programme}
                </h2>
                <ol className="sn-ceremonies">
                  {ceremonies.map((c, i) => (
                    <li key={`${c.name}-${i}`}>
                      <p className="sn-cer-name">{c.name}</p>
                      {(c.dateText || c.timeText) && (
                        <p className="sn-cer-when">
                          {c.dateText && <span className="whitespace-nowrap">{c.dateText}</span>}
                          {c.dateText && c.timeText && ' · '}
                          {c.timeText && <span className="whitespace-nowrap">{c.timeText}</span>}
                        </p>
                      )}
                      {c.venue && <p className="sn-sub">{c.venue}</p>}
                      {c.note && <p className="sn-sub italic">{c.note}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            </section>
          )}

          {photos.length > 0 && (
            <section className="sn-section" aria-label={t.ourMoments}>
              <Reveal>
                <h2 className={`sn-eyebrow ${local} text-center`}>{t.ourMoments}</h2>
                <LotusDivider />
              </Reveal>
              <div className={`sn-photos ${galleryClass(photos.length, 6)}`}>
                {photos.map((p, i) => (
                  <Reveal key={p.id} variant="scale" delay={i * 100} className="sn-photo">
                    <img src={p.url} alt="" loading="lazy" />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <section className="sn-section sn-last" aria-labelledby="sn-rsvp-h">
            <Reveal className="sn-panel">
              <p className={`sn-eyebrow ${local}`}>{t.kindlyReply}</p>
              <h2 id="sn-rsvp-h" className="sn-panel-title big">
                {t.rsvpPrompt}
              </h2>
              {invitation.rsvpDeadline && (
                <p className="sn-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
              )}
              <div className="mx-auto max-w-md">{rsvp}</div>
            </Reveal>
            <Reveal className="mt-12 text-center">
              <Moonstone className="sn-sign-stone" loading="lazy" />
              <p className="sn-sign">
                {one} {t.and} {two}
              </p>
              {guestName && (
                <p className="mx-auto mt-4 max-w-sm text-[12px]" style={{ color: 'var(--ei-muted)' }}>
                  {t.personalNote(guestName)}
                </p>
              )}
            </Reveal>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
