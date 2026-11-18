// Explore Invitations — template gallery (based on the Stitch "Explore Invitations" screen).
// Public: anyone can browse; choosing a design requires signing in.

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom'
import { Eye, Search, Sparkles } from 'lucide-react'
import TierBadge from '../components/TierBadge'
import { api } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import FormAlert from '../components/FormAlert'
import InvitationCard from '../templates/InvitationCard'
import TemplateThumbnail from '../templates/TemplateThumbnail'
import { getTheme, sampleInvitation } from '../templates/themes'
import { CATEGORIES, categoryOf, categoryOfDesign } from '../lib/categories'

const PLANS = [
  { value: 'all', label: 'All designs' },
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
]

// The main occasion categories (no sub-filters): lib/categories.js
const OCCASIONS = [{ value: 'all', label: 'All Occasions' }, ...CATEGORIES]

// The designs, kept between visits, so coming back from a design's preview shows the
// gallery straight away (and can scroll back to where you were)
let cachedTemplates = null
const SCROLL_KEY = 'ei:gallery-scroll'

export default function Templates() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navigationType = useNavigationType()
  const [templates, setTemplates] = useState(cachedTemplates)
  const [loadError, setLoadError] = useState('')
  // The filters live in the address (?occasion=birthday&plan=premium&q=gold), so they're still
  // there after previewing a design and coming back (and links from the home page can set them)
  const [params, setParams] = useSearchParams()
  // older links (?occasion=engagement, ?occasion=party) land on their category
  const occasion = categoryOf(params.get('occasion'))
  const category = CATEGORIES.find((c) => c.value === occasion)
  const plan = params.get('plan') || 'all'
  const query = params.get('q') || ''
  // Built from the address as it is right now, so quick changes (a filter, then typing) all stick
  const setFilter = (name, value, empty) => {
    const next = new URLSearchParams(window.location.search)
    if (!value || value === empty) next.delete(name)
    else next.set(name, value)
    setParams(next, { replace: true })
  }
  const setOccasion = (v) => setFilter('occasion', v, 'all')
  const setPlan = (v) => setFilter('plan', v, 'all')
  const setQuery = (v) => setFilter('q', v, '')
  const [previewing, setPreviewing] = useState(null)
  const [creating, setCreating] = useState('')
  const [createError, setCreateError] = useState('')

  // Signed in, a Signature couple's own custom design is included (first, "Made for you")
  useEffect(() => {
    const rank = (t) => (t.custom ? 0 : t.tier === 'free' ? 1 : 2)
    api('/templates')
      // Their custom design, then free designs, then Premium (each keeps the server's order)
      .then((data) => {
        cachedTemplates = [...data.templates].sort((a, b) => rank(a) - rank(b))
        setTemplates(cachedTemplates)
      })
      .catch((err) => setLoadError(err.message))
  }, [user?.id])

  // Coming back (browser Back, or "All designs" on a preview): return to the same place
  useLayoutEffect(() => {
    if (!templates || navigationType !== 'POP') return
    let saved = null
    try {
      saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null')
    } catch {
      // storage blocked: just stay at the top
    }
    if (saved && saved.search === location.search) window.scrollTo(0, saved.y)
    // run once the designs are on the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates])

  // Remember the scroll position when leaving for a preview
  function rememberScroll() {
    try {
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ search: location.search, y: window.scrollY }))
    } catch {
      // storage blocked: coming back starts at the top
    }
  }

  const visible = useMemo(() => {
    if (!templates) return []
    const q = query.trim().toLowerCase()
    return templates.filter((t) => {
      if (category && !category.types.includes(t.eventType)) return false
      if (plan !== 'all' && (t.tier || 'premium') !== plan) return false
      if (!q) return true
      return [t.name, t.description, ...(t.styleTags || [])].join(' ').toLowerCase().includes(q)
    })
  }, [templates, category, plan, query])
  // a category with no designs at all yet shows "Coming soon" (not "no match")
  const comingSoon = !!category && !templates?.some((t) => category.types.includes(t.eventType))


  async function chooseDesign(template) {
    if (!user) {
      navigate('/signin', { state: { from: location.pathname } })
      return
    }
    setCreating(template.key)
    setCreateError('')
    try {
      const data = await api('/invitations', { method: 'POST', body: { templateKey: template.key } })
      navigate(`/invitations/${data.invitation.id}/edit`)
    } catch (err) {
      setCreateError(err.message)
      setCreating('')
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-margin-mobile py-10 md:px-margin">
      <nav aria-label="Breadcrumb" className="text-label-sm text-on-surface-variant uppercase">
        Home <span className="mx-1">/</span> <span className="text-gold-text">Explore invitations</span>
      </nav>
      <h1 className="mt-3 font-serif text-headline-lg-mobile text-espresso md:text-display">Find Your Perfect Invitation</h1>
      <p className="mt-3 max-w-2xl text-body-lg text-on-surface-variant">
        Pick a design, add your details, and preview it exactly as your guests will see it.
      </p>

      {/* Search + filters */}
      <div className="card mt-8 p-4 sm:p-5">
        <label className="relative block">
          <span className="sr-only">Search designs</span>
          <Search size={18} aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, style or colour…"
            className="w-full rounded-full border border-bone bg-ivory py-3 pr-4 pl-11 text-body-md outline-none focus:border-gold focus:shadow-[0_0_0_3px_rgba(197,160,89,0.15)]"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Free or Premium">
          {PLANS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setPlan(o.value)}
              aria-pressed={plan === o.value}
              className={`rounded-full border px-4 py-1.5 text-body-sm transition-colors ${
                plan === o.value ? 'border-espresso bg-espresso font-semibold text-white' : 'border-bone bg-ivory text-espresso hover:border-gold'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Occasion">
          {OCCASIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setOccasion(o.value)}
              aria-pressed={occasion === o.value}
              className={`rounded-full border px-4 py-1.5 text-body-sm transition-colors ${
                occasion === o.value ? 'border-gold bg-blush-tint font-semibold text-espresso' : 'border-bone bg-ivory text-espresso hover:border-gold'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <FormAlert>{loadError || createError}</FormAlert>
      </div>

      {/* Results */}
      {!templates && !loadError && (
        <p className="mt-10 text-body-md text-on-surface-variant" role="status">
          Loading designs…
        </p>
      )}

      {templates && (
        <>
          <p className="mt-6 text-body-sm text-on-surface-variant" aria-live="polite">
            Showing {visible.length} design{visible.length === 1 ? '' : 's'}
            {category && <span className="text-on-surface-variant/80"> · {category.covers}</span>}
          </p>

          {visible.length === 0 ? (
            <div className="card mt-4 px-6 py-14 text-center">
              <Sparkles className="mx-auto text-gold-text" aria-hidden="true" />
              <h2 className="mt-4 font-serif text-headline-sm text-espresso">
                {comingSoon ? 'Coming soon' : 'No designs match your search'}
              </h2>
              <p className="mt-2 text-body-md text-on-surface-variant">
                {comingSoon
                  ? `Designs for ${category.properNames ? category.covers : category.covers.charAt(0).toLowerCase() + category.covers.slice(1)} are on the way.`
                  : 'Try a different word, or clear the search.'}
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((t) => (
                <li key={t.key} className="card flex flex-col overflow-hidden">
                  <div className="relative">
                    <TemplateThumbnail templateKey={t.key} height={260} occasion="wedding" />
                    <TierBadge tier={t.tier} custom={t.custom} className="absolute top-2 left-2" />
                  </div>
                  <div className="flex flex-1 flex-col p-3 sm:p-4">
                    <div className="hidden items-center justify-between sm:flex">
                      <p className="min-w-0 truncate text-label-sm text-gold-text uppercase">
                        {t.eventType === 'christmas' ? 'Christmas' : categoryOfDesign(t.eventType)?.label || t.eventType}
                      </p>
                      <span className="flex gap-1" aria-hidden="true">
                        {t.palette?.map((c) => (
                          <span key={c} className="h-3 w-3 rounded-full border border-bone" style={{ background: c }} />
                        ))}
                      </span>
                    </div>
                    <h2 className="mt-1 font-serif text-[17px] leading-snug text-espresso sm:text-title-lg">{t.name}</h2>
                    <p className="mt-1 hidden text-body-sm text-on-surface-variant sm:line-clamp-2">{t.description}</p>
                    <ul className="mt-2 hidden flex-wrap gap-1.5 lg:flex">
                      {t.styleTags?.map((tag) => (
                        <li key={tag} className="rounded-full border border-bone px-2.5 py-0.5 text-label-sm text-on-surface-variant">
                          {tag}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto grid gap-2 pt-3 sm:grid-cols-2">
                      <Link
                        to={`/templates/${t.key}/preview`}
                        state={{ fromGallery: true }}
                        onClick={rememberScroll}
                        className="btn-secondary !px-3 !py-2 text-body-sm"
                      >
                        <Eye size={15} aria-hidden="true" /> Preview
                      </Link>
                      <button type="button" className="btn-primary !px-3 !py-2 text-body-sm" onClick={() => chooseDesign(t)} disabled={!!creating}>
                        {creating === t.key ? 'Creating…' : 'Use Design'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {previewing && (
        <Modal
          title={`${previewing.name} — preview`}
          onClose={() => setPreviewing(null)}
          wide
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setPreviewing(null)}>
                Close
              </button>
              <button type="button" className="btn-primary" onClick={() => chooseDesign(previewing)} disabled={!!creating}>
                {creating ? 'Creating…' : 'Use This Design'}
              </button>
            </>
          }
        >
          <div className="p-4 sm:p-8" style={{ background: getTheme(previewing.key).page }}>
            <InvitationCard
              invitation={sampleInvitation(previewing.key, 'wedding')}
              templateKey={previewing.key}
              guestName="Amal Perera"
              className="mx-auto max-w-xl shadow-float"
            />
          </div>
        </Modal>
      )}
    </div>
  )
}
