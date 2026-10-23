// Home / landing page — based on the Stitch "Digital Invitation Platform" screen.
// Copy only promises what the product actually does today.

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Cake,
  CalendarClock,
  Check,
  Eye,
  Gem,
  Heart,
  House,
  Languages,
  Link2,
  ListChecks,
  MapPin,
  MessageCircle,
  PartyPopper,
  PenLine,
  Send,
  Sparkles,
  Wine,
} from 'lucide-react'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import TemplateThumbnail from '../templates/TemplateThumbnail'
import { useSiteConfig } from '../lib/siteConfig'
import Packages from '../components/Packages'

const FALLBACK_TEMPLATES = [
  { key: 'pure-elegance', name: 'Pure Elegance', description: 'Ivory and white with champagne gold, delicate florals and classic serif lettering.', styleTags: ['Classic', 'Gold foil'] },
  { key: 'modern-romance', name: 'Modern Romance', description: 'A minimalist composition in white, silver and beige with clean, airy typography.', styleTags: ['Minimalist', 'Modern'] },
  { key: 'royal-red', name: 'Royal Indian Wedding', description: 'Deep crimson and antique gold with mandala, paisley and palace-arch ornament.', styleTags: ['Traditional', 'Indian'] },
  { key: 'crimson-love', name: 'Crimson Love', description: 'Crimson, white and blush in a modern romantic style.', styleTags: ['Romantic', 'Modern'] },
]

const OCCASIONS = [
  { icon: Heart, title: 'Weddings', text: 'Ceremonies and receptions, with a personal link for every guest.', available: 'wedding' },
  { icon: Gem, title: 'Engagements', text: 'Announce the engagement and invite family and friends.', available: 'engagement' },
  { icon: House, title: 'Homecomings', text: 'Welcome guests to the homecoming after the wedding.', available: 'homecoming' },
  { icon: Cake, title: 'Birthdays', text: 'Kids’ parties and milestone birthdays, with the age on the invitation.', available: 'birthday' },
  { icon: Wine, title: 'Anniversaries', text: 'Vow renewals and silver or golden jubilees.' },
  { icon: PartyPopper, title: 'Parties', text: 'Seasonal gatherings and evening soirées.' },
  { icon: Building2, title: 'Corporate Events', text: 'Launches, galas and client dinners.' },
]

const STEPS = [
  { n: '01', title: 'Choose a design', text: 'Pick a design for your wedding, engagement or homecoming and preview it with sample details before you commit.', note: 'Free to browse' },
  { n: '02', title: 'Personalise it', text: 'Add your names, date, venue, wording and RSVP deadline. A live preview shows every change as you type.', note: 'Live preview' },
  { n: '03', title: 'Share & collect RSVPs', text: 'Add your guests and send each their personal link by WhatsApp or copy-and-paste. Replies appear on your dashboard.', note: 'Replies in one place' },
]

const FEATURES = [
  { icon: Link2, title: 'Personal guest links', text: 'Every guest gets their own private link that greets them by name — “Dear Amal Perera”.' },
  { icon: ListChecks, title: 'RSVP tracking', text: 'See who is attending, who has declined and who hasn’t replied yet, with the time of each reply.' },
  { icon: MessageCircle, title: 'WhatsApp sharing', text: 'Open WhatsApp with your message and the guest’s link ready to go. You review it and press Send.' },
  { icon: Languages, title: 'English & Sinhala', text: 'Choose the language for each invitation. The wording, dates and RSVP form follow it. Tamil is coming soon.' },
  { icon: CalendarClock, title: 'RSVP deadline', text: 'Guests can change their answer until your deadline, then replies close automatically. The invitation stays online until the day after your event.' },
  { icon: MapPin, title: 'Venue & map link', text: 'Show the venue, address and dress code, with a map link so guests find their way.' },
]

function SectionHeading({ eyebrow, title, text, center = true }) {
  return (
    <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className={`eyebrow ${center ? 'justify-center' : ''}`}>{eyebrow}</p>
      <h2 className="mt-3 font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">{title}</h2>
      {text && <p className="mt-3 text-body-lg text-on-surface-variant">{text}</p>}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const location = useLocation()
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES)

  useEffect(() => {
    api('/templates', { auth: false })
      .then((d) => d.templates.length && setTemplates(d.templates))
      .catch(() => {}) // the fallback list is fine for the home page
  }, [])

  // Support links like /#how-it-works
  useEffect(() => {
    if (!location.hash) return
    const el = document.getElementById(location.hash.slice(1))
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const { signupOpen } = useSiteConfig()
  // While accounts are made by EventInvito, visitors start by browsing the designs
  const startHref = user || !signupOpen ? '/templates' : '/signup'

  return (
    <div className="overflow-x-clip">
      {/* ---------- Hero ---------- */}
      <section className="relative bg-[radial-gradient(ellipse_at_top_left,#fbefe2_0%,transparent_50%),radial-gradient(ellipse_at_top_right,#f8e9ea_0%,transparent_45%)]">
        <div className="mx-auto max-w-[1200px] px-margin-mobile pt-16 pb-10 text-center md:px-margin md:pt-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/70 px-4 py-1.5 text-label-md text-gold-text uppercase">
            <Sparkles size={14} aria-hidden="true" /> Digital invitations · Sri Lanka
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-serif text-display-mobile text-espresso md:text-[64px] md:leading-[72px]">
            Every Occasion Deserves a <em className="text-gold-text">Beautiful</em> Invitation.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-on-surface-variant">
            Create, personalise and share elegant digital invitations in minutes. Every guest gets their own link with their name on it, and their RSVP comes straight to your dashboard.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/templates" className="btn-primary px-7 py-3.5 text-title-md">
              Explore Invitations <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className="btn-secondary px-7 py-3.5 text-title-md">
              How It Works
            </a>
          </div>

          {/* Fanned invitation cards */}
          <div className="relative mx-auto mt-14 h-[300px] max-w-3xl sm:h-[360px]" aria-hidden="true">
            {[
              { key: 'royal-red', cls: 'left-1/2 -translate-x-[115%] rotate-[-8deg] top-8 hidden sm:block' },
              { key: 'crimson-love', cls: 'left-1/2 translate-x-[15%] rotate-[8deg] top-8 hidden sm:block' },
              { key: 'pure-elegance', cls: 'left-1/2 -translate-x-1/2 top-0 z-10' },
            ].map(({ key, cls }) => (
              <div key={key} className={`absolute w-[240px] overflow-hidden rounded-xl border border-bone shadow-float sm:w-[260px] ${cls}`}>
                <TemplateThumbnail templateKey={key} height={360} />
              </div>
            ))}
          </div>
        </div>

        {/* Highlights strip */}
        <div className="mx-auto max-w-[1200px] px-margin-mobile pb-16 md:px-margin">
          <ul className="card mx-auto grid max-w-4xl divide-y divide-bone sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { big: 'Personal links', small: 'Each guest greeted by name' },
              { big: '2 languages', small: 'English · සිංහල · Tamil soon' },
              { big: 'WhatsApp ready', small: 'Share in a tap' },
            ].map((s) => (
              <li key={s.big} className="px-6 py-5 text-center">
                <p className="font-serif text-headline-sm text-espresso">{s.big}</p>
                <p className="mt-1 text-label-sm text-on-surface-variant uppercase">{s.small}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Signature designs ---------- */}
      <section className="border-y border-bone bg-surface-container-low py-20">
        <div className="mx-auto max-w-[1200px] px-margin-mobile md:px-margin">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <SectionHeading center={false} eyebrow="Our collection" title="Signature Designs" text="Wedding, engagement and homecoming invitations designed to feel like fine printed stationery — on any phone." />
            <Link to="/templates" className="inline-flex shrink-0 items-center gap-1.5 text-label-md text-gold-text uppercase hover:text-primary">
              View all designs <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {templates.slice(0, 4).map((t) => (
              <li key={t.key} className="card flex flex-col overflow-hidden">
                <TemplateThumbnail templateKey={t.key} height={340} />
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-label-sm text-gold-text uppercase">Wedding suite</p>
                  <h3 className="mt-1 font-serif text-headline-sm text-espresso">{t.name}</h3>
                  <p className="mt-1 flex-1 text-body-sm text-on-surface-variant">{t.description}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {t.styleTags?.slice(0, 2).map((tag) => (
                      <li key={tag} className="rounded-full border border-bone px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                        {tag}
                      </li>
                    ))}
                  </ul>
                  <Link to="/templates" className="btn-secondary mt-4 w-full py-2 text-body-sm">
                    <Eye size={15} aria-hidden="true" /> Preview & customise
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Occasions ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-margin-mobile md:px-margin">
          <SectionHeading eyebrow="Milestone celebrations" title="Designed for Life’s Greatest Milestones" text="Every couple design works for weddings, engagements and homecomings, and birthdays have designs of their own. More occasions are on the way." />
          <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {OCCASIONS.map(({ icon: Icon, title, text, available }) => (
              <li key={title} className={`card flex flex-col p-5 ${available ? 'border-gold/50' : ''}`}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-title-md text-espresso">{title}</h3>
                <p className="mt-1 flex-1 text-body-sm text-on-surface-variant">{text}</p>
                {available ? (
                  <Link to={`/templates?occasion=${available}`} className="mt-4 inline-flex items-center gap-1 text-label-md text-gold-text uppercase hover:text-primary">
                    View designs <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ) : (
                  <span className="mt-4 text-label-sm text-on-surface-variant uppercase">Coming soon</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section id="how-it-works" className="scroll-mt-24 border-y border-bone bg-surface-container-low py-20">
        <div className="mx-auto max-w-[1200px] px-margin-mobile md:px-margin">
          <SectionHeading eyebrow="Simple from start to finish" title="How It Works" text="From choosing a design to counting replies — all in one place." />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="card relative p-7">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-[40px] leading-none text-gold">{s.n}</span>
                  <span className="rounded-full bg-blush-tint px-3 py-1 text-label-sm text-gold-text uppercase">Step {Number(s.n)}</span>
                </div>
                <h3 className="mt-5 font-serif text-headline-sm text-espresso">{s.title}</h3>
                <p className="mt-2 text-body-md text-on-surface-variant">{s.text}</p>
                <p className="mt-5 flex items-center gap-2 border-t border-bone pt-4 text-body-sm text-espresso">
                  <Check size={15} className="text-gold-text" aria-hidden="true" /> {s.note}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section className="py-20">
        <div className="mx-auto max-w-[1200px] px-margin-mobile md:px-margin">
          <SectionHeading eyebrow="Everything in one place" title="Everything You Need for Effortless Hosting" />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="card p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-blush-tint text-gold-text" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <h3 className="mt-4 text-title-md text-espresso">{title}</h3>
                <p className="mt-1.5 text-body-md text-on-surface-variant">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Packages ---------- */}
      <section id="pricing" className="scroll-mt-24 border-y border-bone bg-surface-container-low py-20">
        <div className="mx-auto max-w-[1200px] px-margin-mobile md:px-margin">
          <SectionHeading
            eyebrow="Packages"
            title="Choose the Right Package for Your Celebration"
            text="Start free and upgrade when you want animation, music, photos and online replies. You pay once per package — no monthly fees."
          />
          <Packages />
          <p className="mt-8 text-center text-body-sm text-on-surface-variant">
            Every package: designs for weddings, engagements and homecomings · English or Sinhala · works on any phone · drafts are always free.
          </p>
        </div>
      </section>

      {/* ---------- Custom design ---------- */}
      <section className="pb-20">
        <div className="mx-auto max-w-[1200px] px-margin-mobile md:px-margin">
          <div className="grid items-center gap-8 overflow-hidden rounded-xl border border-bone bg-blush-tint p-8 md:grid-cols-[1fr_auto] md:p-12">
            <div>
              <p className="eyebrow">Custom design service</p>
              <h2 className="mt-3 font-serif text-headline-lg-mobile text-espresso md:text-headline-lg">Need Something Truly One-of-a-Kind?</h2>
              <p className="mt-3 max-w-xl text-body-lg text-on-surface-variant">
                Work with our designers on an invitation made just for you — your monogram, your colours, your story.
              </p>
              <Link to="/custom-design" className="btn-primary mt-6 bg-espresso text-white hover:shadow-float">
                Ask about custom design <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="mx-auto hidden h-44 w-44 place-items-center rounded-full border border-gold/40 bg-white/60 text-center md:grid" aria-hidden="true">
              <div>
                <Gem size={26} className="mx-auto text-gold-text" />
                <p className="mt-2 font-serif text-headline-sm text-espresso">Made for you</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="border-t border-bone bg-surface-container-low py-20">
        <div className="mx-auto max-w-2xl px-margin-mobile text-center">
          <p className="eyebrow justify-center">Create · Invite · Celebrate</p>
          <h2 className="mt-3 font-serif text-headline-lg-mobile text-espresso md:text-display">Start Designing Your Invitation Today</h2>
          <p className="mt-4 text-body-lg text-on-surface-variant">Pick a design, add your details and see it come to life.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={startHref} className="btn-primary px-7 py-3.5 text-title-md">
              <PenLine size={18} aria-hidden="true" /> {user ? 'Create an invitation' : 'Create your account'}
            </Link>
            <Link to="/templates" className="btn-secondary px-7 py-3.5 text-title-md">
              <Send size={18} aria-hidden="true" /> Browse designs
            </Link>
          </div>
          <p className="mt-4 text-body-sm text-on-surface-variant">Browse and preview every design without an account.</p>
        </div>
      </section>
    </div>
  )
}
