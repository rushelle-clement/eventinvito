// The five free corporate cards: the invitation's front (CorporatePoster: logo, title and message in
// the design's own composition, with its light animation), then the When and Where cards, the
// programme and the reply. No tap-to-open, music or photos (those come with the Premium designs).
//
//  corporate-elegance  Ivory, champagne gold, charcoal — fine gold lines draw the frame and arch
//  modern-business     Navy, white, silver — bold type, geometric lines slide into place
//  blue-gradient       Royal blue, cyan, white — a moving cyan light, rings and clean left-aligned type
//  minimal-editorial   White, black, grey — Swiss typography; the title appears word by word
//  emerald-prestige    Emerald, gold, ivory — gold facets and softly glowing particles
//
// All drawn in code; the company's logo is the only picture.

import CorporatePoster from './CorporatePoster'
import { Details, Programme, Reply } from './corporateShared'
import './corporate.css'
import './corporateEvent.css'
import './corporatePoster.css'

const VARIANTS = ['corporate-elegance', 'modern-business', 'blue-gradient', 'minimal-editorial', 'emerald-prestige']
// The Premium designs use this card too, for the editor's quick preview (their colours come from ce-)
const PREMIUM = ['black-tie-gala', 'tech-innovation', 'corporate-anniversary', 'product-launch', 'networking-cocktail']

export default function CorporateCard({ invitation, guestName, rsvp, t, lang, embedded = false }) {
  const key = invitation.templateKey
  const premium = PREMIUM.includes(key)
  const variant = premium || VARIANTS.includes(key) ? key : 'corporate-elegance'

  return (
    <main className={`cx-page cx-${variant} ${premium ? `ce-root ce-${variant}` : ''} ${embedded ? 'is-embedded' : ''}`} lang={lang}>
      <CorporatePoster variant={variant} invitation={invitation} guestName={guestName} t={t} lang={lang} titleAs="h1" />

      <section className="cx-card cx-info">
        <Details invitation={invitation} t={t} lang={lang} className="cx-l" />
        <Programme invitation={invitation} t={t} lang={lang} className="cx-l" />
        {!embedded && <Reply invitation={invitation} rsvp={rsvp} t={t} lang={lang} className="cx-l" />}
        {invitation.companyName && <p className="cx-company">{invitation.companyName}</p>}
      </section>
      {guestName && !embedded && <p className="cx-note">{t.personalNote(guestName)}</p>}
    </main>
  )
}
