import { Link } from 'react-router-dom'

// The EI monogram with the wordmark beside it. The full round badge (with the name and
// "Create · Invite · Celebrate" around it) is too detailed at header size, so it's used in the footer.
// On phones (under 640px) only the monogram shows, everywhere in the app; the name joins it on wider screens
export default function Logo({ className = '', compact = true }) {
  return (
    <Link to="/" aria-label="EventInvito home" className={`inline-flex items-center gap-2 font-serif text-[28px] leading-none tracking-tight text-espresso ${className}`}>
      <img src="/brand/eventinvito-mark.png" alt="" width="40" height="40" className={`shrink-0 ${compact ? 'h-10 w-10 sm:h-[1.45em] sm:w-[1.45em]' : 'h-[1.45em] w-[1.45em]'}`} />
      <span className={compact ? 'hidden sm:inline' : undefined} aria-hidden="true">
        EventInvito<span className="text-gold">.</span>
      </span>
    </Link>
  )
}
