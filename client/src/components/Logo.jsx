import { Link } from 'react-router-dom'

// Text wordmark (the PRD says no image logo for now)
export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`font-serif text-[28px] leading-none tracking-tight text-espresso ${className}`}>
      EventInvito<span className="text-gold">.</span>
    </Link>
  )
}
