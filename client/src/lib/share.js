// Helpers for sharing a guest's personal link (FR-031 – FR-035).
// WhatsApp is only *opened* with the text filled in; the couple presses Send themselves (BR-011).

import { invitationTitle, isBirthday, stringsFor } from '../templates/strings'

// The message that goes with the link. {name} and {couple} are filled in.
export function buildShareText(invitation, guest) {
  const t = stringsFor(invitation.language, invitation.eventType)
  const template = invitation.shareMessage?.trim() || t.shareDefault
  // {couple}: the couple's names, or for a birthday "Kavindi's 5th birthday"
  const couple = isBirthday(invitation)
    ? invitationTitle(invitation, invitation.language)
    : [invitation.partnerOne, invitation.partnerTwo].filter(Boolean).join(` ${t.and} `)
  const text = template.replaceAll('{name}', guest.displayName || guest.name).replaceAll('{couple}', couple)
  return `${text}\n${guest.link}`
}

// Turn a phone number into WhatsApp's format: country code + number, digits only.
// Sri Lankan local numbers (0771234567) become 94771234567.
export function toWhatsAppNumber(phone) {
  if (!phone) return ''
  let digits = phone.replace(/\D/g, '')
  if (!phone.trim().startsWith('+') && digits.length === 10 && digits.startsWith('0')) digits = `94${digits.slice(1)}`
  return digits.length >= 8 ? digits : ''
}

export function whatsAppUrl(phone, text) {
  const number = toWhatsAppNumber(phone)
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}

// Copy text; returns false when the browser blocks it so the UI can show a manual-copy box.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
