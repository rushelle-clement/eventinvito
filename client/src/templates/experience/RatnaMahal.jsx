// Ratna Mahal ("palace of gems"): a modern Indian wedding in ivory and gold, where flowers, pearls
// and gems come together: a gold Mughal arch dressed with roses and jasmine, strands of pearls,
// petals and small stones, and "Shubh Vivah" above the couple's names.
//
// Opening: on ivory satin, the arch with a curtain of pearl-and-petal strands hanging inside it,
// swaying gently. "Open Invitation" → the strands swing apart to the arch's sides, petals, pearls,
// gems and gold leaf drift down, and you pass through the arch into the invitation.
// The invitation: the arch as the card (it grows with the wording), with the names in rose script and
// a three-part date; then a gallery of small arches under a jasmine toran, the details, a pearl
// timeline, the reply and a closing flourish.
// The arch, strands, flowers and loose petals are images in /public/ratna-mahal; the rest is code.

import { useEffect, useRef, useState } from 'react'
import { MapPin, Shirt } from 'lucide-react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { ceremonyList, galleryClass, names, runTimeline, timeRange } from './shared'
import { formatDate } from '../strings'
import { Parents, InviteLine } from './Wording'
import { guestNamedInLine, hasParentsLines } from '../wording'
import './ratnaMahal.css'

const REVEAL_AT = 2300
const DONE_AT = 3100

const img = (name) => `${import.meta.env.BASE_URL}ratna-mahal/${name}.webp`

// The textures and masks, as CSS variables
const VARS = {
  '--rm-satin': `url(${img('satin')})`,
  '--rm-satin-tall': `url(${img('satin-tall')})`,
  '--rm-arch-mask': `url(${img('arch-mask')})`,
}

// The curtain inside the arch: x (% of the arch), where the strand starts and how long it is (% of
// the arch's height), which strand, mirrored or not, and its sway
const CURTAIN = [
  { x: 24, top: 36, len: 50, s: 2 },
  { x: 30, top: 27, len: 58, s: 1, f: true },
  { x: 36, top: 20, len: 64, s: 3 },
  { x: 42, top: 16, len: 54, s: 2, f: true },
  { x: 47.5, top: 14, len: 70, s: 1 },
  { x: 53, top: 13, len: 60, s: 3, f: true },
  { x: 58.5, top: 14, len: 72, s: 2 },
  { x: 64, top: 16, len: 56, s: 1 },
  { x: 70, top: 20, len: 66, s: 3, f: true },
  { x: 76, top: 27, len: 52, s: 2 },
  { x: 82, top: 36, len: 46, s: 1, f: true },
]

// What drifts down when the arch opens: item, x (vw), size (px), delay, fall time, drift, turn
const FALL = [
  ['petal-1', 6, 54, 0.35, 2.4, 8, 160],
  ['pearl-2', 14, 18, 0.5, 2.0, -4, 90],
  ['gold-2', 22, 26, 0.6, 2.6, 10, 260],
  ['petal-3', 31, 46, 0.4, 2.3, -10, -140],
  ['gem-pink-2', 39, 20, 0.7, 2.1, 6, 200],
  ['bud-1', 46, 42, 0.45, 2.5, -6, 120],
  ['petal-2', 55, 50, 0.55, 2.4, 12, -170],
  ['pearl-1', 62, 16, 0.38, 1.9, -8, 80],
  ['gold-5', 69, 24, 0.66, 2.5, 6, -240],
  ['gem-clear-2', 76, 18, 0.5, 2.2, -6, 220],
  ['petal-4', 84, 52, 0.42, 2.4, -12, 150],
  ['gem-pink-1', 92, 18, 0.62, 2.0, 4, -200],
  ['gold-7', 10, 16, 0.8, 2.3, 8, 300],
  ['pearl-4', 50, 14, 0.85, 2.0, -4, 100],
  ['bud-3', 88, 38, 0.7, 2.6, -8, -110],
  ['gold-1', 34, 20, 0.9, 2.4, 10, 240],
]

// A fine gold divider with a pearl in the middle
function Divider({ gem = 'pearl-1', className = '' }) {
  return (
    <span className={`rm-divider ${className}`} aria-hidden="true">
      <span />
      <img src={img(gem)} alt="" loading="lazy" />
      <span />
    </span>
  )
}

// "Shubh Vivah" in Devanagari between gold flourishes
function ShubhVivah({ className = '' }) {
  return (
    <p className={`rm-shubh ${className}`} lang="hi">
      <span className="rm-flourish" aria-hidden="true" />
      शुभ विवाह
      <span className="rm-flourish is-right" aria-hidden="true" />
    </p>
  )
}

// The date in three parts: day | month & year | time (English); other languages show their own written date
function DateTriptych({ iso, lang, time }) {
  if (!iso) return null
  if (lang !== 'en') {
    return (
      <div className="rm-date is-local">
        <p className="rm-date-full">{formatDate(iso, lang)}</p>
        {time && <p className="rm-date-time">{time}</p>}
      </div>
    )
  }
  return (
    <div className="rm-date">
      <div className="rm-date-col">
        <span className="rm-date-label">{formatDate(iso, 'en', { weekday: 'long' })}</span>
        <span className="rm-date-big">{formatDate(iso, 'en', { day: 'numeric' })}</span>
      </div>
      <span className="rm-date-sep" aria-hidden="true" />
      <div className="rm-date-col">
        <span className="rm-date-month">{formatDate(iso, 'en', { month: 'long' })}</span>
        <span className="rm-date-label">{formatDate(iso, 'en', { year: 'numeric' })}</span>
      </div>
      {time && (
        <>
          <span className="rm-date-sep" aria-hidden="true" />
          <div className="rm-date-col">
            <span className="rm-date-label">Time</span>
            <span className="rm-date-time-big">{time.split(/\s*[–-]\s*/)[0]}</span>
          </div>
        </>
      )}
    </div>
  )
}

// A photo in a small flowered arch (two designs, alternated)
function ArchPhoto({ url, i }) {
  const k = i % 2 ? 2 : 1
  return (
    <span className={`rm-arch-photo is-${k}`} style={{ '--mask': `url(${img(`arch-${k}-mask`)})` }}>
      <img className="rm-arch-photo-img" src={url} alt="" loading="lazy" />
      <img className="rm-arch-photo-frame" src={img(`arch-${k}`)} alt="" aria-hidden="true" loading="lazy" />
    </span>
  )
}

export default function RatnaMahal({ invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const latin = lang === 'en'
  const local = latin ? '' : 'is-local'
  const { one, two } = names(invitation)
  const photos = invitation.photos || []
  // the gallery shows every photo (the cover included)
  const gallery = photos

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => {
    if (poster) return // thumbnails never take keyboard focus
    if (phase === 'closed') openBtnRef.current?.focus({ preventScroll: true })
    if (phase === 'open') headingRef.current?.focus({ preventScroll: true })
  }, [phase, poster])

  function open() {
    music.play() // inside the tap, so browsers allow sound
    timers.current = runTimeline(setPhase, REVEAL_AT, DONE_AT)
  }

  const date = formatDate(invitation.eventDate, lang)
  const time = timeRange(invitation.eventTime, invitation.endTime, lang)
  const ceremonies = ceremonyList(invitation, lang)

  return (
    <>
      {/* ---------- Opening ---------- */}
      {phase !== 'open' && (
        <div
          className={`rm-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`}
          style={VARS}
          role="dialog"
          aria-modal="true"
          aria-label={t.openInvitation}
        >
          <span className="rm-jaali" aria-hidden="true" />
          <img className="rm-corner is-tl rm-fade-soft" src={img('corner')} alt="" aria-hidden="true" decoding="async" />
          <img className="rm-corner is-br rm-fade-soft" src={img('corner')} alt="" aria-hidden="true" decoding="async" />

          <div className="rm-stage" lang={lang}>
            <p className={`rm-eyebrow ${local} rm-fade rm-in-1`}>{guestName ? t.forGuest(guestName) : t.theWeddingOf}</p>
            <div className="rm-portal">
              <span className="rm-portal-glow" aria-hidden="true" />
              <span className="rm-curtain" aria-hidden="true">
                {CURTAIN.map((c, i) => (
                  <span
                    key={i}
                    className={`rm-strand ${c.x < 53 ? 'is-left' : c.x > 53 ? 'is-right' : 'is-mid'}`}
                    style={{
                      left: `${c.x}%`,
                      top: `${c.top}%`,
                      height: `${c.len}%`,
                      '--sway': `${3.6 + (i % 4) * 0.5}s`,
                      '--delay': `${-(i * 0.7)}s`,
                      // when the curtain parts, each strand swings to the arch's side it is on
                      '--to': `${c.x < 53 ? 18 + (c.x - 24) * 0.18 : c.x > 53 ? 88 - (82 - c.x) * 0.18 : 53}%`,
                      '--tilt': `${c.x < 53 ? -5 : c.x > 53 ? 5 : 0}deg`,
                      '--order': `${(Math.abs(c.x - 53) / 30).toFixed(2)}`,
                    }}
                  >
                    <img src={img(`strand-${c.s}`)} alt="" decoding="async" className={c.f ? 'is-flipped' : ''} />
                  </span>
                ))}
              </span>
              <img className="rm-portal-frame" src={img('arch')} alt="" aria-hidden="true" decoding="async" />
            </div>
            <ShubhVivah className="rm-fade rm-in-2" />
            <p className="rm-open-names rm-fade rm-in-2">
              <span>{one}</span>
              <span className="rm-amp">{t.and}</span>
              <span>{two}</span>
            </p>
            {invitation.eventDate && (
              <p className="rm-open-date rm-fade rm-in-3">
                <span className="rm-hair" aria-hidden="true" />
                {latin ? formatDate(invitation.eventDate, 'en', { day: 'numeric', month: 'long', year: 'numeric' }) : date}
                <span className="rm-hair" aria-hidden="true" />
              </p>
            )}
            <button ref={openBtnRef} type="button" className="rm-open-btn" onClick={open} disabled={phase !== 'closed'}>
              {t.openInvitation}
            </button>
          </div>

          <span className="rm-fall" aria-hidden="true">
            {FALL.map(([name, x, size, delay, dur, drift, turn], i) => (
              <img
                key={i}
                src={img(name)}
                alt=""
                decoding="async"
                style={{ left: `${x}vw`, width: size, animationDelay: `${delay}s`, animationDuration: `${dur}s`, '--drift': `${drift}vw`, '--turn': `${turn}deg` }}
              />
            ))}
          </span>
          <span className="rm-light" aria-hidden="true" />
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`rm-invite ${phase === 'revealing' ? 'is-entering' : ''}`} style={VARS} lang={lang}>
          <section className="rm-hero">
            <span className="rm-jaali" aria-hidden="true" />

            {/* the arch as the card: roses, jasmine and pearls dress all four corners of the gold frame.
                Its top and bottom keep their shape and the pillars grow with the wording */}
            <div className="rm-card-arch">
              <img className="rm-arch-top" src={img('arch-four-top')} alt="" aria-hidden="true" decoding="async" />
              <img className="rm-arch-mid" src={img('arch-four-mid')} alt="" aria-hidden="true" decoding="async" />
              <img className="rm-arch-bottom" src={img('arch-four-bottom')} alt="" aria-hidden="true" decoding="async" />

              <div className="rm-card-text">
                <Reveal variant="fade" className="rm-top-lines">
                  {invitation.blessing && <p className="rm-blessing">{invitation.blessing}</p>}
                  {!guestNamedInLine(invitation) && <p className={`rm-greeting ${local}`}>{guestName ? t.dear(guestName) : t.dearGuest}</p>}
                  {/* the hosts' own line replaces "together with their families" */}{!hasParentsLines(invitation) && !invitation.hostLine && <p className={`rm-together ${local}`}>{t.together}</p>}
                  {invitation.hostLine && <p className="rm-hostline">{invitation.hostLine}</p>}
                  <Divider gem="gem-pink-2" className="is-small" />
                </Reveal>
                <Reveal variant="fade">
                  <ShubhVivah />
                </Reveal>

                <h1 ref={headingRef} tabIndex={-1} className="rm-names outline-none">
                  <span className="rm-name" style={{ animationDelay: '0.2s' }}>
                    <Parents text={invitation.partnerOneParents} />
                    {one}
                  </span>
                  <span className="rm-amp-row" style={{ animationDelay: '0.45s' }}>
                    <span className="rm-amp-line" aria-hidden="true" />
                    <span className="rm-amp">{t.and}</span>
                    <span className="rm-amp-line" aria-hidden="true" />
                  </span>
                  <span className="rm-name" style={{ animationDelay: '0.65s' }}>
                    <Parents text={invitation.partnerTwoParents} />
                    {two}
                  </span>
                </h1>

                <Reveal delay={700}>
                  <p className="rm-message">{invitation.message || t.defaultInvite}</p>
                  <InviteLine invitation={invitation} guestName={guestName} />
                  <Divider gem="pearl-2" />
                  <DateTriptych iso={invitation.eventDate} lang={lang} time={time} />
                  <Divider gem="gem-pink-1" />
                  {invitation.venueName && <p className={`rm-venue ${local}`}>{invitation.venueName}</p>}
                  {invitation.address && <p className="rm-address">{invitation.address}</p>}
                </Reveal>
              </div>
            </div>
          </section>

          {gallery.length > 0 && (
            <section className="rm-band rm-gallery" aria-labelledby="rm-moments-h">
              <img className="rm-toran" src={img('toran')} alt="" aria-hidden="true" loading="lazy" />
              <div className="rm-section">
                <Reveal className="rm-heading">
                  <h2 id="rm-moments-h" className={`rm-eyebrow ${local}`}>
                    {t.ourMoments}
                  </h2>
                  <Divider gem="pearl-3" />
                </Reveal>
                <div className={`rm-photos ${galleryClass(gallery.length, 6)}`}>
                  {gallery.map((p, i) => (
                    <Reveal key={p.id} variant="up" delay={(i % 3) * 120} className="rm-photo">
                      <ArchPhoto url={p.url} i={i} />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="rm-band" aria-label={`${t.when} · ${t.where}`}>
            <span className="rm-jaali" aria-hidden="true" />
            <div className="rm-section">
              <div className="rm-details">
                <Reveal className="rm-card">
                  <img className="rm-card-gem" src={img('gem-pink-3')} alt="" aria-hidden="true" loading="lazy" />
                  <p className={`rm-eyebrow ${local}`}>{t.when}</p>
                  <p className="rm-card-title">{date || '—'}</p>
                  {time && <p className="rm-sub">{time}</p>}
                </Reveal>
                <Reveal className="rm-card" delay={120}>
                  <img className="rm-card-gem" src={img('gem-pink-2')} alt="" aria-hidden="true" loading="lazy" />
                  <p className={`rm-eyebrow ${local}`}>{t.where}</p>
                  <p className="rm-card-title">{invitation.venueName || '—'}</p>
                  {invitation.address && <p className="rm-sub">{invitation.address}</p>}
                  {invitation.mapUrl && (
                    <a href={invitation.mapUrl} target="_blank" rel="noopener noreferrer" className="rm-link">
                      <MapPin size={14} aria-hidden="true" /> {t.viewMap}
                    </a>
                  )}
                </Reveal>
              </div>
              {invitation.dressCode && (
                <Reveal className="rm-dress">
                  <Shirt size={15} aria-hidden="true" /> {t.dressCode}: {invitation.dressCode}
                </Reveal>
              )}
            </div>
          </section>

          {ceremonies.length > 0 && (
            <section className="rm-band rm-champagne" aria-labelledby="rm-cer-h">
              <div className="rm-section">
                <Reveal className="rm-heading">
                  <h2 id="rm-cer-h" className={`rm-eyebrow ${local}`}>
                    {t.programme}
                  </h2>
                  <Divider gem="gem-pink-1" />
                </Reveal>
                <ol className="rm-timeline" style={{ '--rm-bullet': `url(${img('pearl-1')})` }}>
                  {ceremonies.map((c, i) => (
                    <Reveal as="li" key={`${c.name}-${i}`} delay={i * 100}>
                      <p className="rm-cer-when">{[c.dateText, c.timeText].filter(Boolean).join(' · ')}</p>
                      <p className="rm-cer-name">{c.name}</p>
                      {c.venue && <p className="rm-sub">{c.venue}</p>}
                      {c.note && <p className="rm-sub italic">{c.note}</p>}
                    </Reveal>
                  ))}
                </ol>
              </div>
            </section>
          )}

          <section className="rm-band rm-end" aria-labelledby="rm-rsvp-h">
            <span className="rm-jaali" aria-hidden="true" />
            <img className="rm-corner is-br is-small" src={img('corner')} alt="" aria-hidden="true" loading="lazy" />
            <div className="rm-section">
              <Reveal className="rm-card rm-rsvp">
                <img className="rm-card-gem" src={img('pearl-4')} alt="" aria-hidden="true" loading="lazy" />
                <p className={`rm-eyebrow ${local}`}>{t.kindlyReply}</p>
                <h2 id="rm-rsvp-h" className="rm-card-title big">
                  {t.rsvpPrompt}
                </h2>
                {invitation.rsvpDeadline && (
                  <p className="rm-sub">{t.rsvpBy(formatDate(invitation.rsvpDeadline, lang, { day: 'numeric', month: 'long', year: 'numeric' }))}</p>
                )}
                <div className="mx-auto max-w-md">{rsvp}</div>
              </Reveal>
              <Reveal className="rm-sign-off">
                <ShubhVivah />
                <p className="rm-sign">
                  {one} <span className="rm-amp">{t.and}</span> {two}
                </p>
                <Divider gem="gem-pink-3" />
                {guestName && <p className="rm-note">{t.personalNote(guestName)}</p>}
              </Reveal>
            </div>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </>
  )
}
