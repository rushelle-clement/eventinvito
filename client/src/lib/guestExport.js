// "Download Excel": the guest list and replies as an .xlsx file (Premium Plus and Signature).
// Made in the browser from the list already on the page.

import writeExcelFile from 'write-excel-file/browser'
import { invitationTitle, isBirthday, isChristmas, isCorporate } from '../templates/strings'

const CARD = { online: 'Online', physical: 'Physical card' }
const VIA = { link: 'Online link', qr: 'QR code' }
const REPLY = { attending: 'Attending', not_attending: 'Not attending', pending: 'Awaiting reply' }

const text = (value) => ({ value: value || '', type: String })
const date = (value) => (value ? { value: new Date(value), type: Date, format: 'd mmm yyyy' } : text(''))

// e.g. "Amaya-and-Nuwan-guest-list.xlsx"
export function exportFileName(invitation) {
  const names = isBirthday(invitation) || isCorporate(invitation) || isChristmas(invitation) ? invitationTitle(invitation) : [invitation.partnerOne, invitation.partnerTwo].filter(Boolean).join(' and ') || 'invitation'
  return `${names.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')}-guest-list.xlsx`
}

export async function downloadGuestList(invitation, guests) {
  const replies = true // every design takes replies online
  const headers = ['Guest name', 'Name on invitation', 'Phone number', 'Email address', 'Group', 'Notes', 'Card type', ...(replies ? ['Reply', 'Replied on', 'Replied by'] : []), 'Link shared on', 'First opened on', 'Visits', 'Personal link']
  const rows = guests.map((g) => [
    text(g.name),
    text(g.displayName),
    text(g.phone), // as text so Excel keeps the leading 0
    text(g.email),
    text(g.group),
    text(g.notes),
    text(CARD[g.cardType] || CARD.online),
    ...(replies ? [text(REPLY[g.rsvpStatus] || ''), date(g.respondedAt), text(g.rsvpStatus !== 'pending' ? VIA[g.rsvpVia] || '' : '')] : []),
    date(g.sharedAt),
    date(g.openedAt),
    g.openCount ? { value: g.openCount, type: Number } : text(''),
    text(g.cardType === 'physical' ? '' : g.link),
  ])
  const widths = [28, 28, 18, 28, 20, 30, 14, ...(replies ? [16, 14, 14] : []), 16, 16, 8, 48]
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
