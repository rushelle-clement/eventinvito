// The account's package, shown in the header beside the account menu (and inside the menu).
// It links to the packages, so a free account can see what upgrading adds.

import { Link } from 'react-router-dom'
import { PLANS, planOf } from '../lib/accountPlan'

export default function PlanBadge({ user, className = '', onClick }) {
  const key = planOf(user)
  if (!key) return null
  const { label, Icon, className: look } = PLANS[key]
  // The package chosen at sign-up, still waiting for payment
  const pending = key !== 'admin' && Boolean(user?.requestedPlan)
  const content = (
    <>
      {Icon && <Icon size={13} aria-hidden="true" />}
      {pending ? `${label.replace(/ member$/, '')} · pending` : label}
    </>
  )
  if (pending) {
    return (
      <Link
        to="/dashboard"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-gold px-3 py-1 text-label-sm text-gold-text uppercase transition-shadow hover:shadow-sheet ${className}`}
        title={`${label.replace(/ member$/, '')} package — waiting for payment`}
      >
        {content}
      </Link>
    )
  }
  const cls = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-label-sm uppercase ${look} ${className}`
  if (key === 'admin') return <span className={cls}>{content}</span>
  return (
    <Link to="/#pricing" onClick={onClick} className={`${cls} transition-shadow hover:shadow-sheet`} title={key === 'free' ? 'Free member (Simple Card). See the packages' : `${label}. See the packages`}>
      {content}
    </Link>
  )
}
