// The animated invitation a guest sees (and the couple previews).
// Picks the experience for the invitation's template; templates without their own animated
// version yet use the classic card. Music, theme colours and wording are shared by all.

import { lazy, Suspense, useEffect } from 'react'
import { getTheme } from '../themes'
import { STRINGS, stringsFor } from '../strings'
import { defaultTrackFor, getTrack } from '../music'
import InvitationCard from '../InvitationCard'
import useBackgroundMusic from './useBackgroundMusic'
import MusicButton from './MusicButton'
import PureElegance from './PureElegance'
import ModernRomance from './ModernRomance'
import RoyalIndian from './RoyalIndian'
import CrimsonLove from './CrimsonLove'
import NoirRouge from './NoirRouge'
import RanPahana from './RanPahana'
import GoldenVow from './GoldenVow'
import WhiteLily from './WhiteLily'
import RatnaMahal from './RatnaMahal'
import GraceChapel from './GraceChapel'
import CorporateCard from './CorporateCard'
import ChristmasCard from './ChristmasCard'
import ChristmasParty from './ChristmasParty'
import { BlackTieGala, CorporateAnniversary, NetworkingCocktail, ProductLaunch, TechInnovation } from './CorporateEvent'
import WhiteRose from './WhiteRose'
import PinkFloral from './PinkFloral'
import BlueBotanical from './BlueBotanical'
import PurpleGarden from './PurpleGarden'
import KandyanHeritage from './KandyanHeritage'
import NelumLotus from './NelumLotus'
import SwarnaNelum from './SwarnaNelum'
import WhiteVeil from './WhiteVeil'
import EnchantedStorybook from './EnchantedStorybook'
import StaticCard from './StaticCard'
import BirthdayCard from './BirthdayCard'
import BirthdayParty from './BirthdayParty'
import { siteHost, siteUrl } from '../../lib/siteUrl'
import { Link, useLocation, useNavigate } from 'react-router-dom'

// The day plan, opened over the invitation (loaded only when a guest opens it)
const AgendaView = lazy(() => import('../../components/AgendaView'))
import { CalendarClock } from 'lucide-react'
import { agendaStrings } from '../../lib/agenda'
import './experience.css'
import './designs.css'

const EXPERIENCES = {
  'pure-elegance': PureElegance,
  'modern-romance': ModernRomance,
  'royal-red': RoyalIndian, // Royal Indian Wedding (key kept for existing invitations)
  'crimson-love': CrimsonLove,
  'noir-rouge': NoirRouge,
  'ran-pahana': RanPahana,
  'golden-vow': GoldenVow,
  'white-lily': WhiteLily,
  'grace-chapel': GraceChapel,
  'ratna-mahal': RatnaMahal,
  'white-rose': WhiteRose,
  'pink-floral': PinkFloral,
  'blue-botanical': BlueBotanical,
  'purple-garden': PurpleGarden,
  'kandyan-heritage': KandyanHeritage,
  'nelum-lotus': NelumLotus,
  'swarna-nelum': SwarnaNelum,
  'white-veil': WhiteVeil,
  'enchanted-storybook': EnchantedStorybook,
  // Free designs: one static card each (no animation, music, photos or RSVP)
  'ivory-classic': StaticCard,
  'modern-monochrome': StaticCard,
  'pastel-blossom': StaticCard,
  'sinhala-swarna': StaticCard,
  'simple-lotus': StaticCard,
  // Birthdays (Premium, animated)
  'balloon-bash': BirthdayParty,
  'ocean-adventure': BirthdayParty,
  'fairy-garden': BirthdayParty,
  'midnight-gala': BirthdayParty,
  'rose-wish': BirthdayParty,
  'midnight-glam': BirthdayParty,
  'disco-fever': BirthdayParty,
  'tropical-paradise': BirthdayParty,
  // Free birthday cards
  'confetti-pop': BirthdayCard,
  'little-star': BirthdayCard,
  'blush-bloom': BirthdayCard,
  'black-gold': BirthdayCard,
  'rose-bubbles': BirthdayCard,
  // Corporate events (Premium, animated)
  'black-tie-gala': BlackTieGala,
  'tech-innovation': TechInnovation,
  'corporate-anniversary': CorporateAnniversary,
  'product-launch': ProductLaunch,
  'networking-cocktail': NetworkingCocktail,
  // Free corporate cards (a light animation on the card)
  'corporate-elegance': CorporateCard,
  'modern-business': CorporateCard,
  'blue-gradient': CorporateCard,
  'minimal-editorial': CorporateCard,
  'emerald-prestige': CorporateCard,
  // Christmas parties: animated (Premium)
  'christmas-elegance': ChristmasParty,
  'pink-christmas': ChristmasParty,
  'winter-wonderland': ChristmasParty,
  'cosy-christmas': ChristmasParty,
  'christmas-after-dark': ChristmasParty,
  // Free Christmas party cards
  'classic-noel': ChristmasCard,
  'candy-cane': ChristmasCard,
  'nordic-pine': ChristmasCard,
  'golden-star': ChristmasCard,
  'silent-night': ChristmasCard,
}

// Theme colours as CSS variables, so experience.css can use them
function themeVars(theme) {
  return {
    '--ei-page': theme.page,
    '--ei-card': theme.card,
    '--ei-text': theme.text,
    '--ei-muted': theme.muted,
    '--ei-accent': theme.accent,
    '--ei-accent-text': theme.accentText,
    '--ei-soft': theme.soft,
    '--ei-border': theme.border,
    '--ei-heading-font': theme.headingFont,
    '--ei-names-font': theme.namesFont,
    '--ei-body-font': theme.bodyFont,
  }
}

function ClassicCard({ invitation, guestName, rsvp, music, t }) {
  return (
    <>
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-6 sm:py-12">
        <InvitationCard invitation={invitation} templateKey={invitation.templateKey} guestName={guestName} rsvp={rsvp} className="shadow-float" />
        {guestName && (
          <p lang={invitation.language} className="mt-6 text-center text-[12px]" style={{ color: 'var(--ei-muted)' }}>
            {t.personalNote(guestName)}
          </p>
        )}
      </main>
      <MusicButton music={music} labels={t} />
    </>
  )
}

// "Made with ♥ on EventInvito · eventinvito.lk" at the very bottom of every invitation.
// It links to the home page (?ref=invite shows how many visitors come from invitations).
function BrandFooter() {
  const url = siteUrl()
  const host = siteHost()
  return (
    <footer className="ei-brand" lang="en">
      <a href={`${url}/?ref=invite`} target="_blank" rel="noopener">
        <span className="ei-brand-line">
          Made with{' '}
          <span className="ei-brand-heart" aria-label="love">
            ♥
          </span>{' '}
          on <strong>EventInvito</strong>
        </span>
        {host && <span className="ei-brand-url">{host}</span>}
      </a>
    </footer>
  )
}

// "Day plan": opens the timed plan of the day. It sits under the opening screen (which covers
// the whole page), so guests see it once the invitation is open.
// With the invitation's details at hand, the plan opens over the invitation instead of on its own
// page, so the music keeps playing and closing it returns to the same place. The phone's Back
// button closes it too (opening it adds a history step; the address stays the same).
function DayPlanButton({ href, lang, invitation, music, t }) {
  const location = useLocation()
  const navigate = useNavigate()
  const open = Boolean(location.state?.dayPlan)

  // The page behind stays where it was; only the plan scrolls. Esc closes it.
  useEffect(() => {
    if (!open) return undefined
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && navigate(-1)
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = before
      document.removeEventListener('keydown', onKey)
    }
  }, [open, navigate])

  if (!invitation?.agenda?.length) {
    return (
      <Link to={href} className="ei-dayplan" lang={lang}>
        <CalendarClock size={16} aria-hidden="true" />
        {agendaStrings(lang).dayPlan}
      </Link>
    )
  }
  return (
    <>
      <button type="button" className="ei-dayplan" lang={lang} onClick={() => navigate(`${location.pathname}${location.search}`, { state: { dayPlan: true } })}>
        <CalendarClock size={16} aria-hidden="true" />
        {agendaStrings(lang).dayPlan}
      </button>
      {open && (
        // A popup over the dimmed invitation; a tap outside it (or Esc) closes it too
        <div className="ei-plan-overlay" onClick={(e) => e.target === e.currentTarget && navigate(-1)}>
          <div className="ei-plan-panel" role="dialog" aria-modal="true" aria-label={agendaStrings(lang).title}>
            {/* Scrolls inside the rounded card, so the scrollbar never cuts its corners */}
            <div className="ei-plan-scroll">
              <Suspense fallback={null}>
                <AgendaView invitation={invitation} onBack={() => navigate(-1)} />
              </Suspense>
            </div>
          </div>
          {/* The design's own music button sits under this panel, so the plan has its own */}
          {music?.available && <MusicButton music={music} labels={t} />}
        </div>
      )}
    </>
  )
}

/**
 * @param invitation  invitation fields (from the guest API or the owner's copy)
 * @param guestName   shown as "Dear …"; empty for a generic greeting
 * @param rsvp        the RSVP form (guest page) or undefined for a non-clickable sample
 * @param startOpen   skip the opening screen
 * @param topOffset   height of a toolbar above the invitation (the preview page), in px
 * @param poster      render a still of the opening screen (gallery thumbnails): no music, no focus, no clicks
 * @param agendaHref  where the "Day plan" button goes; no button when empty
 */
export default function InvitationExperience({ invitation, guestName, rsvp, startOpen = false, topOffset = 0, poster = false, agendaHref = '' }) {
  const theme = getTheme(invitation.templateKey)
  const lang = STRINGS[invitation.language] ? invitation.language : 'en'
  const t = stringsFor(lang, invitation.eventType)
  // "custom" = the couple's own file (guests get musicUrl; the couple's preview has customMusic.url)
  // Free designs play their default track (they can't choose one)
  const musicSrc = poster
    ? null
    : theme.free
      ? getTrack(defaultTrackFor(invitation.templateKey, invitation.eventType))?.src
      : invitation.musicTrack === 'custom' ? invitation.musicUrl || invitation.customMusic?.url || null : getTrack(invitation.musicTrack)?.src
  const music = useBackgroundMusic(musicSrc)
  // Free designs have no opening screen to tap, so their music starts with the guest's first tap
  // anywhere on the page (browsers only allow sound after a tap); the music button pauses it.
  const freeMusic = theme.free && !poster
  const { available: musicReady, play: playMusic } = music
  useEffect(() => {
    if (!freeMusic || !musicReady) return undefined
    const start = (e) => {
      if (!e.target.closest?.('.ei-music-btn')) playMusic()
    }
    document.addEventListener('pointerdown', start, { once: true })
    return () => document.removeEventListener('pointerdown', start)
  }, [freeMusic, musicReady, playMusic])

  // Any free design without its own entry is a static card (birthday cards have their own); without
  // this a new free design fell back to the classic preview card, which shows no reply buttons
  const Experience = EXPERIENCES[invitation.templateKey] || (theme.free ? (theme.birthday ? BirthdayCard : StaticCard) : ClassicCard)

  // In previews there is no real guest, so show what the reply buttons will look like
  const sampleRsvp = (
    <div className={`mt-5 grid grid-cols-1 gap-3 ${lang === 'en' ? 'sm:grid-cols-2' : ''}`} aria-hidden="true">
      <span className="rounded-full px-4 py-3 text-center text-[14px] font-semibold" style={{ background: theme.accent, color: theme.onAccent || (theme.layout === 'regal' ? theme.page : '#fff') }}>
        {t.accept}
      </span>
      <span className="rounded-full border px-4 py-3 text-center text-[14px] font-semibold" style={{ borderColor: theme.accent, color: theme.accentText }}>
        {t.decline}
      </span>
    </div>
  )

  return (
    <div className={`ei-root ${poster ? 'is-poster' : ''}`} lang={lang} style={{ ...themeVars(theme), '--ei-top': `${topOffset}px` }}>
      <Experience invitation={invitation} guestName={guestName} rsvp={rsvp || sampleRsvp} music={music} t={t} lang={lang} startOpen={startOpen} poster={poster} />
      {!poster && agendaHref && <DayPlanButton href={agendaHref} lang={lang} invitation={invitation} music={music} t={t} />}
      {freeMusic && <MusicButton music={music} labels={t} />}
      {!poster && <BrandFooter />}
    </div>
  )
}
