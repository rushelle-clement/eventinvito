// Small pieces for the optional wording lines (see ../wording.js)
import { inviteLineText } from '../wording'

// The parents' line, shown above a partner's name (inside the names heading)
export function Parents({ text }) {
  const s = (text || '').trim()
  return s ? <span className="ei-parents">{s}</span> : null
}

// The closing line addressed to the guest
export function InviteLine({ invitation, guestName, className = '' }) {
  const s = inviteLineText(invitation, guestName)
  return s ? <p className={`ei-invite-line ${className}`}>{s}</p> : null
}
