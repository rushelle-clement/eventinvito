// "Download Excel": the guest list and replies as an .xlsx file (Premium Plus and Signature).
// Made in the browser from the list already on the page.

import writeExcelFile from 'write-excel-file/browser'
import { invitationTitle, isBirthday } from '../templates/strings'

const REPLY = { attending: 'Attending', not_attending: 'Not attending', pending: 'Awaiting reply' }

const text = (value) => ({ value: value || '', type: String })
const date = (value) => (value ? { value: new Date(value), type: Date, format: 'd mmm yyyy' } : text(''))

// e.g. "Amaya-and-Nuwan-guest-list.xlsx"
export function exportFileName(invitation) {
  const names = isBirthday(invitation) ? invitationTitle(invitation) : [invitation.partnerOne, invitation.partnerTwo].filter(Boolean).join(' and ') || 'invitation'
  return `${names.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}-guest-list.xlsx`
}

export async function downloadGuestList(invitation, guests) {
  const replies = invitation.tier !== 'free' // free designs don't take replies online
  const headers = ['Guest name', 'Name on invitation', 'Phone number', 'Email address', 'Notes', ...(replies ? ['Reply', 'Replied on'] : []), 'Link shared on', 'Personal link']
  const rows = guests.map((g) => [
    text(g.name),
    text(g.displayName),
    text(g.phone), // as text so Excel keeps the leading 0
    text(g.email),
    text(g.notes),
    ...(replies ? [text(REPLY[g.rsvpStatus] || ''), date(g.respondedAt)] : []),
    date(g.sharedAt),
    text(g.link),
  ])
  const widths = [28, 28, 18, 28, 30, ...(replies ? [16, 14] : []), 16, 48]
  const blob = await writeExcelFile([headers.map((value) => ({ value, fontWeight: 'bold' })), ...rows], {
    columns: widths.map((width) => ({ width })),
    stickyRowsCount: 1,
  }).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = exportFileName(invitation)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
