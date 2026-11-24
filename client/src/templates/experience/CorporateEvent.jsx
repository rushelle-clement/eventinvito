// The five Premium corporate designs: the invitation's front (CorporatePoster) on the design's stage,
// which the guest taps open; then the front again at the top, the When and Where cards, the
// programme, photos and the reply. One component, with each
// design's own opening and decoration:
//
//  black-tie-gala         a spotlight sweeps the dark stage; on the tap a gold shimmer opens it
//  tech-innovation        light trails race over a digital grid; on the tap they converge in a flash
//  corporate-anniversary  the anniversary number rises in with sparkles; on the tap they burst
//  product-launch         a line of light; on the tap it opens into a curtain of light and the product
//  networking-cocktail    soft evening lights drift; on the tap they glow and wash the screen
//
// Everything is drawn in code; the company's logo and photos are the only pictures.

import { useEffect, useRef, useState } from 'react'
import Reveal from './Reveal'
import MusicButton from './MusicButton'
import { galleryClass, runTimeline } from './shared'
import CorporatePoster from './CorporatePoster'
import { CorpLogo, Details, Programme, Reply } from './corporateShared'
import './corporate.css'
import './corporateEvent.css'
import './corporatePoster.css'

const REVEAL_AT = 2300
const DONE_AT = 3100

// Light designs show the logo as it is; the dark ones on a light plate
const LIGHT = ['corporate-anniversary']

// Fixed positions (so thumbnails and every visit look the same): [left %, top %, size, delay s]
const SPARKS = [
  [12, 22, 14, 0.2], [84, 18, 10, 0.9], [22, 70, 9, 1.4], [76, 64, 16, 0.5], [50, 10, 8, 1.8],
  [6, 48, 11, 2.3], [93, 44, 9, 1.1], [35, 86, 12, 2.6], [66, 88, 8, 0.7], [58, 30, 7, 2],
]
const BOKEH = [
  [10, 20, 160, 0], [70, 12, 120, 3], [85, 60, 200, 1.5], [20, 75, 140, 4.5], [45, 45, 90, 2.2],
  [60, 85, 110, 6], [30, 35, 70, 5.2], [90, 30, 80, 7.4], [5, 55, 100, 8.6],
]
const TRAILS = [
  [8, 0, 1.6], [22, 1.1, 2.2], [38, 0.4, 1.8], [55, 1.7, 2.4], [70, 0.8, 1.7], [86, 2.1, 2.1], [64, 2.9, 1.9], [30, 3.3, 2.3],
]
const DOTS = [
  [12, 30], [24, 62], [33, 18], [47, 74], [58, 26], [69, 58], [78, 14], [88, 70], [16, 84], [52, 46], [92, 38], [6, 52],
]

// The decoration behind each design's opening and hero
function Scene({ variant }) {
  if (variant === 'black-tie-gala') {
    return (
      <span className="ce-scene" aria-hidden="true">
        <span className="ce-spot" />
        <span className="ce-deco-lines" />
        <span className="ce-shimmer" />
      </span>
    )
  }
  if (variant === 'tech-innovation') {
    return (
      <span className="ce-scene" aria-hidden="true">
        <span className="ce-grid" />
        {TRAILS.map(([top, delay, dur], i) => (
          <span key={i} className="ce-trail" style={{ top: `${top}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s` }} />
        ))}
        {DOTS.map(([x, y], i) => (
          <span key={`d${i}`} className="ce-dot" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 6) * 0.5}s` }} />
        ))}
        <span className="ce-flash" />
      </span>
    )
  }
  if (variant === 'corporate-anniversary') {
    return (
      <span className="ce-scene" aria-hidden="true">
        <span className="ce-glow" />
        {SPARKS.map(([x, y, s, d], i) => (
          <span key={i} className="ce-spark" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${d}s` }} />
        ))}
      </span>
    )
  }
  if (variant === 'product-launch') {
    return (
      <span className="ce-scene" aria-hidden="true">
        <span className="ce-beam" />
        <span className="ce-floor" />
      </span>
    )
  }
  // networking-cocktail
  return (
    <span className="ce-scene" aria-hidden="true">
      {BOKEH.map(([x, y, s, d], i) => (
        <span key={i} className="ce-bokeh" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${-d}s` }} />
      ))}
      <span className="ce-wash" />
    </span>
  )
}

export default function CorporateEvent({ variant, invitation, guestName, rsvp, music, t, lang, startOpen = false, poster = false }) {
  const [phase, setPhase] = useState(startOpen ? 'open' : 'closed')
  const timers = useRef([])
  const openBtnRef = useRef(null)
  const headingRef = useRef(null)
  const plate = !LIGHT.includes(variant)
  const launch = variant === 'product-launch'
  const photos = invitation.photos || []
  // Product Launch: the first photo is the product, shown on the front in the light
  const product = launch && photos[0]?.url
  const gallery = product ? photos.slice(1) : photos

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

  const productEl = product ? (
    <span className="ce-product">
      <img src={product} alt="" decoding="async" />
    </span>
  ) : null

  return (
    <div className={`ce-root ce-${variant}`} lang={lang}>
      {/* ---------- Opening: the invitation's front on the design's stage ---------- */}
      {phase !== 'open' && (
        <div className={`ce-opening ${phase !== 'closed' ? 'is-opening' : ''} ${phase === 'revealing' ? 'is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label={t.openInvitation}>
          <Scene variant={variant} />
          <div className="ce-stage">
            {guestName && <p className="ce-o ce-o1 ce-eyebrow">{t.forGuest(guestName)}</p>}
            <div className="ce-o ce-o2 ce-front">
              <CorporatePoster variant={variant} invitation={invitation} guestName={guestName} t={t} lang={lang} still={poster} />
            </div>
            <button ref={openBtnRef} type="button" className="ce-open-btn" onClick={open} disabled={phase !== 'closed'}>
              {t.openInvitation}
            </button>
          </div>
        </div>
      )}

      {/* ---------- The invitation ---------- */}
      {(phase === 'revealing' || phase === 'open') && (
        <main className={`ce-invite ${phase === 'revealing' ? 'is-entering' : ''}`}>
          <section className="ce-hero">
            <Scene variant={variant} />
            <div className="ce-hero-inner">
              <CorporatePoster variant={variant} invitation={invitation} guestName={guestName} t={t} lang={lang} titleAs="h1" headingRef={headingRef} product={productEl} still={poster} />
            </div>
          </section>

          <section className="ce-band" aria-label={t.when}>
            <div className="ce-section">
              <Reveal>
                <Details invitation={invitation} t={t} lang={lang} className="ce-details" />
              </Reveal>
              <Reveal>
                <Programme invitation={invitation} t={t} lang={lang} className="ce-programme" />
              </Reveal>
            </div>
          </section>

          {gallery.length > 0 && (
            <section className="ce-band ce-alt" aria-labelledby="ce-moments-h">
              <div className="ce-section">
                <h2 id="ce-moments-h" className="cx-label ce-heading">
                  {t.ourMoments}
                </h2>
                <div className={`ce-photos ${galleryClass(gallery.length, 6)}`}>
                  {gallery.map((p, i) => (
                    <Reveal key={p.id} variant="up" delay={(i % 3) * 120} className="ce-photo">
                      <img src={p.url} alt="" loading="lazy" />
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className={`ce-band ce-end ${gallery.length > 0 ? '' : 'ce-alt'}`}>
            <div className="ce-section">
              <Reveal className="ce-reply-card">
                <Reply invitation={invitation} rsvp={rsvp} t={t} lang={lang} />
              </Reveal>
              <Reveal className="ce-sign-off">
                <CorpLogo logo={invitation.logo} style={invitation.logoStyle} variant={variant} plate={plate} className="ce-sign-logo" />
                <p className="cx-company">{invitation.companyName}</p>
                {guestName && <p className="cx-note">{t.personalNote(guestName)}</p>}
              </Reveal>
            </div>
          </section>
        </main>
      )}

      <MusicButton music={music} labels={t} />
    </div>
  )
}

// One export per design, for the map in InvitationExperience
export const BlackTieGala = (props) => <CorporateEvent variant="black-tie-gala" {...props} />
export const TechInnovation = (props) => <CorporateEvent variant="tech-innovation" {...props} />
export const CorporateAnniversary = (props) => <CorporateEvent variant="corporate-anniversary" {...props} />
export const ProductLaunch = (props) => <CorporateEvent variant="product-launch" {...props} />
export const NetworkingCocktail = (props) => <CorporateEvent variant="networking-cocktail" {...props} />
