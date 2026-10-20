// Optional wording lines every design can show (set in the editor's Wording section):
//  • partnerOneParents / partnerTwoParents – a line above each name, e.g.
//    "… මහතා සහ … මැතිනියගේ ආදරණීය දියණිය"
//  • inviteLine – a closing line addressed to the guest; "{name}" becomes the guest's name

// The closing line with the guest's name filled in ('' when there is none)
export function inviteLineText(invitation, guestName) {
  const line = effectiveLine(invitation)
  if (!line) return ''
  return line.replaceAll('{name}', guestName || '').replace(/[ \t]{2,}/g, ' ').trim()
}

// When the closing line already names the guest, the "Dear …" greeting is left out
export function guestNamedInLine(invitation) {
  return effectiveLine(invitation).includes('{name}')
}

// The couple's closing line; Sinhala invitations without one get the traditional line,
// so the guest's name sits in the wording instead of a separate "ආදරණීය …" greeting
function effectiveLine(invitation) {
  const own = (invitation?.inviteLine || '').trim()
  if (own) return own
  return invitation?.language === 'si' ? SINHALA_WORDING.inviteLine : ''
}

// Traditional Sinhala wording the editor can fill in. Words in [brackets] are for the couple to replace.
export const SINHALA_WORDING = {
  blessing: 'ශ්‍රී සුබ මංගලම්',
  partnerOneParents: '[පියාගේ නම] මහතා සහ [මවගේ නම] මැතිනියගේ ආදරණීය දියණිය',
  partnerTwoParents: '[පියාගේ නම] මහතා සහ [මවගේ නම] මැතිනියගේ ආදරණීය පුත්',
  message: 'සමඟ අතිනත ගැනීමේ ප්‍රීතිය නිමිත්තෙන්',
  inviteLine: '{name} ඔබට කෙරෙන සුහද ඇරයුමයි මේ.',
}

// The middle line changes with the occasion
const SINHALA_MESSAGE = {
  engagement: 'සමඟ විවාහ ගිවිස ගැනීමේ ප්‍රීතිය නිමිත්තෙන්',
  homecoming: 'සමඟ පැවැත්වෙන ගෙදර ඒමේ උත්සවය නිමිත්තෙන්',
}
export function sinhalaWording(eventType) {
  return SINHALA_MESSAGE[eventType] ? { ...SINHALA_WORDING, message: SINHALA_MESSAGE[eventType] } : SINHALA_WORDING
}

// With the parents' lines filled in, the standard "together with their families" line is left out
export function hasParentsLines(invitation) {
  return Boolean(invitation?.partnerOneParents?.trim() || invitation?.partnerTwoParents?.trim())
}
