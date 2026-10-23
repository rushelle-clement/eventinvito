// The animated invitation a guest sees (and the couple previews).
// Picks the experience for the invitation's template; templates without their own animated
// version yet use the classic card. Music, theme colours and wording are shared by all.

import { getTheme } from '../themes'
import { STRINGS, stringsFor } from '../strings'
import { getTrack } from '../music'
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
  // Free birthday cards
  'confetti-pop': BirthdayCard,
  'little-star': BirthdayCard,
  'blush-bloom': BirthdayCard,
  'black-gold': BirthdayCard,
  'rose-bubbles': BirthdayCard,
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

/**
 * @param invitation  invitation fields (from the guest API or the owner's copy)
 * @param guestName   shown as "Dear …"; empty for a generic greeting
 * @param rsvp        the RSVP form (guest page) or undefined for a non-clickable sample
 * @param startOpen   skip the opening screen
 * @param topOffset   height of a toolbar above the invitation (the preview page), in px
 * @param poster      render a still of the opening screen (gallery thumbnails): no music, no focus, no clicks
 */
export default function InvitationExperience({ invitation, guestName, rsvp, startOpen = false, topOffset = 0, poster = false }) {
  const theme = getTheme(invitation.templateKey)
  const lang = STRINGS[invitation.language] ? invitation.language : 'en'
  const t = stringsFor(lang, invitation.eventType)
  // "custom" = the couple's own file (guests get musicUrl; the couple's preview has customMusic.url)
  const musicSrc = poster || theme.free
    ? null
    : invitation.musicTrack === 'custom' ? invitation.musicUrl || invitation.customMusic?.url || null : getTrack(invitation.musicTrack)?.src
  const music = useBackgroundMusic(musicSrc)

  const Experience = EXPERIENCES[invitation.templateKey] || ClassicCard

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
      {!poster && <BrandFooter />}
    </div>
  )
}
