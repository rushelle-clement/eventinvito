import { Link } from 'react-router-dom'

// The EI monogram with the wordmark beside it. The full round badge (with the name and
// "Create · Invite · Celebrate" around it) is too detailed at header size, so it's used in the footer.
export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 font-serif text-[28px] leading-none tracking-tight text-espresso ${className}`}>
      <img src="/brand/eventinvito-mark.png" alt="" width="40" height="40" className="h-[1.45em] w-[1.45em] shrink-0" />
      <span>
        EventInvito<span className="text-gold">.</span>
      </span>
    </Link>
  )
}
