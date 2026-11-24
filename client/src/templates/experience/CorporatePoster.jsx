// The front of each corporate invitation: the logo, the guest's name, the company's invitation,
// the event's title and the message, set in each design's own composition (a gold arch, a deco
// hexagon, circuits…). The date and venue follow separately in the When / Where cards.
// Used as the free cards' front, the Premium designs' opening card and their invitation's top.
// Everything is drawn in code; the logo is the only picture.

import { CorpLogo } from './corporateShared'
import { guestNamedInLine, inviteLineText } from '../wording'

// "Annual Awards Gala" → ["Annual Awards", "Gala"]: some designs set the last word apart
function splitTitle(title = '') {
  const words = title.trim().split(/\s+/).filter(Boolean)
  if (words.length < 2) return ['', title.trim()]
  return [words.slice(0, -1).join(' '), words[words.length - 1]]
}
// Longer titles get a smaller size, so any title fits
// (a long single word counts too: "INTRODUCING" must fit on one line)
const SIZES = ['', 'is-mid', 'is-long', 'is-xl']
function sizeOf(s = '') {
  const word = Math.max(0, ...s.split(/\s+/).map((w) => w.length))
  const byText = s.length > 42 ? 3 : s.length > 26 ? 2 : s.length > 14 ? 1 : 0
  const byWord = word > 12 ? 3 : word > 10 ? 2 : word > 8 ? 1 : 0
  return SIZES[Math.max(byText, byWord)]
}

function Dear({ invitation, guestName, t }) {
  if (guestNamedInLine(invitation)) return null
  return <p className="cp-dear">{guestName ? t.dear(guestName) : t.dearGuest}</p>
}
// A company anniversary's number (the editor's form keeps an empty field as "")
const hasMilestone = (invitation) => invitation.milestone != null && invitation.milestone !== ''
const invitesText = (invitation, t) => invitation.hostLine || (invitation.companyName ? t.corpInvites?.(invitation.companyName) : t.together)
function Invites({ invitation, t, className = 'cp-invites' }) {
  const text = invitesText(invitation, t)
  return text ? <p className={className}>{text}</p> : null
}
function Title({ as: Tag = 'h2', headingRef, className = '', children }) {
  return (
    <Tag ref={headingRef} tabIndex={headingRef ? -1 : undefined} className={`cp-title outline-none ${className}`}>
      {children}
    </Tag>
  )
}
function Words({ invitation, guestName, t }) {
  const line = inviteLineText(invitation, guestName)
  return (
    <div className="cp-words">
      <p className="cp-message">{invitation.message || t.defaultInvite}</p>
      {line && <p className="cp-line">{line}</p>}
    </div>
  )
}
// The anniversary front is burgundy (its stage is light), so its one-colour logo is champagne
const Logo = ({ invitation, variant, plate = false }) => (
  <CorpLogo logo={invitation.logo} style={invitation.logoStyle} variant={variant === 'corporate-anniversary' ? 'corporate-anniversary-front' : variant} plate={plate} className="cp-logo" />
)
const svgProps = { 'aria-hidden': true, preserveAspectRatio: 'none', viewBox: '0 0 100 140' }

// The parts every face shows, in order; `title` is each design's own heading
function Body({ invitation, guestName, t, variant, plate, title, before, after, invites }) {
  return (
    <div className="cp-in">
      <Logo invitation={invitation} variant={variant} plate={plate} />
      <Dear invitation={invitation} guestName={guestName} t={t} />
      {before}
      {invites ?? <Invites invitation={invitation} t={t} />}
      {title}
      {after}
      <span className="cp-rule" aria-hidden="true" />
      <Words invitation={invitation} guestName={guestName} t={t} />
    </div>
  )
}

// ---------------------------------------------------------------- the ten faces
function Elegance(p) {
  return (
    <>
      <svg className="cp-art" {...svgProps}>
        <rect pathLength="1" className="cp-draw d1" x="4" y="4" width="92" height="132" />
        <path pathLength="1" className="cp-draw d2" d="M15 136 V50 A35 35 0 0 1 85 50 V136" />
        <path pathLength="1" className="cp-draw d3" d="M18.5 136 V50.5 A31.5 31.5 0 0 1 81.5 50.5 V136" />
      </svg>
      <Body
        {...p}
        variant="corporate-elegance"
        title={<Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>{p.invitation.eventTitle || '…'}</Title>}
        after={hasMilestone(p.invitation) && <p className="cp-note">{p.t.corpYearsOf?.(p.invitation.milestone)}</p>}
      />
    </>
  )
}

function Business(p) {
  return (
    <>
      <span className="cp-frame" aria-hidden="true" />
      <svg className="cp-zig is-top" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="0,2 20,18 40,2 60,18 80,2 100,18 120,2 140,18 160,2 180,18 200,2" />
      </svg>
      <svg className="cp-zig is-bottom" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
        <polyline points="0,18 20,2 40,18 60,2 80,18 100,2 120,18 140,2 160,18 180,2 200,18" />
      </svg>
      <Body
        {...p}
        variant="modern-business"
        plate
        title={<Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>{p.invitation.eventTitle || '…'}</Title>}
        after={p.invitation.companyName && <p className="cp-spaced">{p.invitation.companyName}</p>}
      />
    </>
  )
}

function Gala(p) {
  const [head, tail] = splitTitle(p.invitation.eventTitle || '…')
  return (
    <>
      <svg className="cp-art" {...svgProps}>
        <polygon pathLength="1" className="cp-draw d1" points="50,5 93,27 93,113 50,135 7,113 7,27" />
        <polygon pathLength="1" className="cp-draw d2" points="50,10 89,30 89,110 50,130 11,110 11,30" />
      </svg>
      <span className="cp-deco is-tl" aria-hidden="true" />
      <span className="cp-deco is-tr" aria-hidden="true" />
      <span className="cp-deco is-bl" aria-hidden="true" />
      <span className="cp-deco is-br" aria-hidden="true" />
      <span className="cp-stars" aria-hidden="true">
        <i /> <i /> <i /> <i />
      </span>
      <Body
        {...p}
        variant="black-tie-gala"
        title={
          <Title as={p.titleAs} headingRef={p.headingRef}>
            {head && <span className="cp-head">{head}</span>}
            <span className={`cp-tail ${sizeOf(tail)}`}>{tail}</span>
          </Title>
        }
      />
    </>
  )
}

// Blue Corporate Gradient: a deep royal-blue card with a slowly moving cyan light (a mesh gradient),
// fine rings, and a clean left-aligned layout: logo above, title below, company name at the foot
function Gradient(p) {
  const words = (p.invitation.eventTitle || '…').trim().split(/\s+/)
  const last = words.pop()
  return (
    <>
      <span className="cp-mesh" aria-hidden="true">
        <i /> <i /> <i /> <i />
      </span>
      <svg className="cp-rings" viewBox="0 0 200 200" aria-hidden="true">
        {[30, 52, 74, 96].map((r, i) => (
          <circle key={r} pathLength="1" className={`cp-draw d${i + 1}`} cx="200" cy="0" r={r} />
        ))}
      </svg>
      <span className="cp-grid-dots" aria-hidden="true" />
      <div className="cp-in">
        <div className="cp-gb-top">
          <Logo invitation={p.invitation} variant="blue-gradient" />
          <Dear invitation={p.invitation} guestName={p.guestName} t={p.t} />
        </div>
        <div className="cp-gb-main">
          <Invites invitation={p.invitation} t={p.t} />
          <Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>
            {words.length > 0 && <>{words.join(' ')} </>}
            <span className="cp-accent-word">{last}</span>
          </Title>
          {hasMilestone(p.invitation) && <p className="cp-note">{p.t.corpYearsOf?.(p.invitation.milestone)}</p>}
          <span className="cp-rule" aria-hidden="true" />
          <Words invitation={p.invitation} guestName={p.guestName} t={p.t} />
        </div>
        <div className="cp-gb-foot">
          <span className="cp-gb-mark" aria-hidden="true" />
          <span>{p.invitation.companyName}</span>
        </div>
      </div>
    </>
  )
}

function Editorial(p) {
  const words = (p.invitation.eventTitle || '…').trim().split(/\s+/)
  return (
    <>
      {p.invitation.companyName && (
        <p className="cp-strip" aria-hidden="true">
          <span>{p.invitation.companyName}</span>
        </p>
      )}
      <Body
        {...p}
        variant="minimal-editorial"
        title={
          <Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>
            {words.map((w, k) => (
              <span key={k} className="cp-word" style={{ '--w': k }}>
                {w}{' '}
              </span>
            ))}
          </Title>
        }
      />
    </>
  )
}

function Emerald(p) {
  return (
    <>
      <svg className="cp-art" {...svgProps}>
        <polyline pathLength="1" className="cp-draw d1" points="0,22 24,0 44,28 70,0 100,24" />
        <polyline pathLength="1" className="cp-draw d2" points="0,118 28,140 50,110 76,140 100,114" />
        <polyline pathLength="1" className="cp-draw d3" points="7,0 0,62 12,140" />
        <polyline pathLength="1" className="cp-draw d4" points="93,0 100,78 88,140" />
        <rect pathLength="1" className="cp-draw d5" x="8" y="8" width="84" height="124" />
      </svg>
      <span className="cp-sparks" aria-hidden="true">
        {Array.from({ length: 12 }, (_, k) => (
          <i key={k} style={{ '--x': `${((k * 37) % 92) + 4}%`, '--y': `${((k * 53) % 80) + 12}%`, '--d': `${(k % 6) * 0.9}s` }} />
        ))}
      </span>
      <Body
        {...p}
        variant="emerald-prestige"
        title={<Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>{p.invitation.eventTitle || '…'}</Title>}
      />
    </>
  )
}

function Tech(p) {
  const [head, tail] = splitTitle(p.invitation.eventTitle || '…')
  return (
    <>
      <svg className="cp-circuit" viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path className="cp-trace" d="M0 70 H70 L100 40 H180" />
        <path className="cp-trace" d="M0 110 H40 L70 140 H130 L150 120" />
        <path className="cp-trace" d="M40 0 V30 L60 50 H90" />
        <path className="cp-trace" d="M400 70 H340 L310 40 H250" />
        <path className="cp-trace" d="M360 0 V26 L340 46 H300" />
        <circle cx="180" cy="40" r="4" />
        <circle cx="150" cy="120" r="4" />
        <circle cx="90" cy="50" r="3" />
        <circle cx="250" cy="40" r="4" />
        <circle cx="300" cy="46" r="3" />
      </svg>
      <svg className="cp-ribbons" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d={`M-10 ${190 - i * 6} C 120 ${120 - i * 12}, 250 ${210 - i * 4}, 410 ${60 + i * 6}`} />
        ))}
      </svg>
      <Body
        {...p}
        variant="tech-innovation"
        title={
          <Title as={p.titleAs} headingRef={p.headingRef}>
            {head && <span className={`cp-head ${sizeOf(head)}`}>{head}</span>}
            <span className={`cp-tail ${sizeOf(tail)}`}>{tail}</span>
          </Title>
        }
      />
    </>
  )
}

function Anniversary(p) {
  const n = p.invitation.milestone
  return (
    <>
      <span className="cp-frame" aria-hidden="true" />
      {/* the champagne foil tab with the big number */}
      {n != null && (
        <div className="cp-tab">
          <span className="cp-tab-small">{p.lang === 'en' ? 'Celebrating' : ''}</span>
          <span className="cp-number">{n}</span>
          <span className="cp-tab-small">{p.t.corpYears}</span>
          <span className="cp-sparkles" aria-hidden="true">
            <i /> <i /> <i /> <i /> <i />
          </span>
        </div>
      )}
      <Body
        {...p}
        variant="corporate-anniversary"
        invites={p.invitation.companyName ? <p className="cp-company">{p.invitation.companyName}</p> : <Invites invitation={p.invitation} t={p.t} />}
        title={<Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>{p.invitation.eventTitle || '…'}</Title>}
      />
    </>
  )
}

function Launch(p) {
  return (
    <>
      <span className="cp-halftone" aria-hidden="true" />
      <Body
        {...p}
        variant="product-launch"
        plate
        invites={<p className="cp-invites">{p.invitation.companyName ? `${p.invitation.companyName} ${p.t.corpPresents}` : p.t.together}</p>}
        title={
          <>
            <p className="cp-bars-line" aria-hidden="true">
              <span />
              <span />
            </p>
            <Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>
              {p.invitation.eventTitle || '…'}
            </Title>
          </>
        }
        after={p.product}
      />
    </>
  )
}

function Cocktail(p) {
  return (
    <>
      <span className="cp-orbs" aria-hidden="true">
        <i /> <i /> <i /> <i /> <i />
      </span>
      {/* a cocktail glass in fine champagne lines */}
      <svg className="cp-glass" viewBox="0 0 120 200" aria-hidden="true">
        <path pathLength="1" className="cp-draw g1" d="M10 20 H110 L60 92 Z" />
        <path pathLength="1" className="cp-draw g2" d="M60 92 V168 M34 172 H86" />
        <path pathLength="1" className="cp-draw g3" d="M28 46 H92" />
        <path pathLength="1" className="cp-draw g4" d="M78 4 L52 64" />
        <circle pathLength="1" className="cp-draw g5" cx="55" cy="58" r="7" />
      </svg>
      <Body
        {...p}
        variant="networking-cocktail"
        invites={<Invites invitation={p.invitation} t={p.t} className="cp-script" />}
        title={<Title as={p.titleAs} headingRef={p.headingRef} className={sizeOf(p.invitation.eventTitle)}>{p.invitation.eventTitle || '…'}</Title>}
      />
    </>
  )
}

const FACES = {
  'corporate-elegance': Elegance,
  'modern-business': Business,
  'black-tie-gala': Gala,
  'blue-gradient': Gradient,
  'minimal-editorial': Editorial,
  'emerald-prestige': Emerald,
  'tech-innovation': Tech,
  'corporate-anniversary': Anniversary,
  'product-launch': Launch,
  'networking-cocktail': Cocktail,
}

// `titleAs`: "h1" on the invitation itself, "h2" elsewhere; `headingRef` takes focus when it opens.
// `still`: no entrance animation (thumbnails). `product`: Product Launch's product, under the title.
export default function CorporatePoster({ variant, invitation, guestName, t, lang, titleAs = 'h2', headingRef, still = false, product, className = '' }) {
  const Face = FACES[variant] || Elegance
  return (
    <article className={`cp cp-${variant} ${still ? 'is-still' : ''} ${className}`} lang={lang}>
      <Face invitation={invitation} guestName={guestName} t={t} lang={lang} titleAs={titleAs} headingRef={headingRef} product={product} />
    </article>
  )
}
