// Wording for the printed-card QR reply page (/r/:code), per invitation language.
// "the couple" becomes "the person who invited you" for birthdays, corporate events and Christmas parties.
// NOTE: Sinhala and Tamil are a first draft, like templates/strings.js.

const WHO = {
  en: { couple: 'the couple', hosts: 'the person who invited you' },
  si: { couple: 'මනාලයා සහ මනාලිය', hosts: 'ආරාධනා කළ අය' },
  ta: { couple: 'மணமக்களை', hosts: 'அழைத்தவர்களை' },
}

const QR = {
  en: {
    heading: 'Reply to your invitation',
    findLabel: 'Type your name as it appears on your card',
    findPlaceholder: 'e.g. Amal Perera',
    hint: 'Start typing — matching names appear as you type.',
    searchingNames: 'Looking for your name…',
    find: 'Find my name',
    finding: 'Searching…',
    pick: 'Tap your name',
    notYou: 'Not you? Search again',
    tooShort: 'Please type at least 3 letters of your name.',
    tooMany: 'Many guests match that. Please type your full name.',
    notFound: (who) => `We couldn’t find your name. Please contact ${who}.`,
    unavailable: (who) => `Replies by QR code aren’t open yet. Please contact ${who}.`,
    replied: (a) => `You replied: ${a}`,
    replyBy: (d) => `Please reply by ${d}`,
    change: 'Change my reply',
    done: 'Done',
  },
  si: {
    heading: 'ඔබගේ ආරාධනාවට පිළිතුරු දෙන්න',
    findLabel: 'ඔබගේ කාඩ්පතේ ඇති පරිදි ඔබගේ නම ටයිප් කරන්න',
    findPlaceholder: 'උදා. අමල් පෙරේරා',
    hint: 'ටයිප් කිරීම අරඹන්න — ගැළපෙන නම් පහතින් පෙන්වයි.',
    searchingNames: 'ඔබගේ නම සොයමින්…',
    find: 'මගේ නම සොයන්න',
    finding: 'සොයමින්…',
    pick: 'ඔබගේ නම තෝරන්න',
    notYou: 'ඔබ නොවේද? නැවත සොයන්න',
    tooShort: 'කරුණාකර ඔබගේ නමේ අකුරු 3ක් වත් ටයිප් කරන්න.',
    tooMany: 'නම් බොහොමයක් ගැළපේ. කරුණාකර ඔබගේ සම්පූර්ණ නම ටයිප් කරන්න.',
    notFound: (who) => `ඔබගේ නම සොයාගත නොහැක. කරුණාකර ${who} හා සම්බන්ධ වන්න.`,
    unavailable: (who) => `QR මගින් පිළිතුරු දීම දැනට විවෘත නැත. කරුණාකර ${who} හා සම්බන්ධ වන්න.`,
    replied: (a) => `ඔබගේ පිළිතුර: ${a}`,
    replyBy: (d) => `කරුණාකර ${d} ට පෙර පිළිතුරු දෙන්න`,
    change: 'පිළිතුර වෙනස් කරන්න',
    done: 'හරි',
  },
  ta: {
    heading: 'உங்கள் அழைப்பிதழுக்குப் பதிலளிக்கவும்',
    findLabel: 'உங்கள் அட்டையில் உள்ளபடி உங்கள் பெயரைத் தட்டச்சு செய்யவும்',
    findPlaceholder: 'எ.கா. அமல் பெரேரா',
    hint: 'தட்டச்சு செய்யத் தொடங்கவும் — பொருந்தும் பெயர்கள் கீழே தோன்றும்.',
    searchingNames: 'உங்கள் பெயரைத் தேடுகிறது…',
    find: 'என் பெயரைத் தேடு',
    finding: 'தேடுகிறது…',
    pick: 'உங்கள் பெயரைத் தொடவும்',
    notYou: 'நீங்கள் இல்லையா? மீண்டும் தேடவும்',
    tooShort: 'உங்கள் பெயரின் குறைந்தது 3 எழுத்துகளைத் தட்டச்சு செய்யவும்.',
    tooMany: 'பல பெயர்கள் பொருந்துகின்றன. உங்கள் முழுப் பெயரைத் தட்டச்சு செய்யவும்.',
    notFound: (who) => `உங்கள் பெயரைக் கண்டுபிடிக்க முடியவில்லை. ${who} தொடர்புகொள்ளவும்.`,
    unavailable: (who) => `QR மூலம் பதிலளிப்பது இப்போது திறக்கப்படவில்லை. ${who} தொடர்புகொள்ளவும்.`,
    replied: (a) => `உங்கள் பதில்: ${a}`,
    replyBy: (d) => `${d} க்குள் பதிலளிக்கவும்`,
    change: 'என் பதிலை மாற்று',
    done: 'சரி',
  },
}

export function qrStringsFor(language, eventType) {
  const lang = QR[language] ? language : 'en'
  const who = eventType && eventType !== 'wedding' && eventType !== 'engagement' ? WHO[lang].hosts : WHO[lang].couple
  return { ...QR[lang], who }
}

// The letters in the middle of the QR code: "A&N" for a couple, "K" for a birthday,
// the first letters of the event's title (up to 3) otherwise
export function qrInitials(invitation) {
  const first = (s) => Array.from(String(s || '').trim())[0]?.toUpperCase() || ''
  const type = invitation?.eventType
  if (type === 'birthday') return first(invitation.celebrant)
  if (type === 'corporate' || type === 'christmas') {
    const words = String(invitation.eventTitle || invitation.companyName || '').split(/\s+/).filter((w) => /^\p{L}/u.test(w))
    return words.slice(0, 3).map(first).join('')
  }
  const a = first(invitation?.partnerOne)
  const b = first(invitation?.partnerTwo)
  return a && b ? `${a}&${b}` : a || b
}
