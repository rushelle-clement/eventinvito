// Fixed wording printed on invitations, per language (FR-023 / FR-080).
// The couple's own text (names, message, venue…) is shown exactly as they typed it.
//
// NOTE: the Sinhala and Tamil lines are a first draft and should be checked by
// fluent speakers before launch (PRD FR-083).

export const LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-GB' },
  { code: 'si', label: 'සිංහල (Sinhala)', locale: 'si-LK' },
  // Tamil wording exists (existing Tamil invitations still display), but new invitations can't
  // choose it until the translations have been checked — shown as "Coming soon" in the editor
  { code: 'ta', label: 'தமிழ் (Tamil)', locale: 'ta-LK', comingSoon: true },
]

export const STRINGS = {
  en: {
    together: 'Together with their families',
    defaultInvite: 'request the pleasure of your company at the celebration of their marriage',
    dear: (name) => `Dear ${name}`,
    dearGuest: 'Dear Guest',
    sampleGuest: 'Amal Perera', // used in previews
    and: '&',
    date: 'Date',
    time: 'Time',
    venue: 'Venue',
    dressCode: 'Dress code',
    viewMap: 'View on map',
    rsvpBy: (date) => `Kindly respond by ${date}`,
    rsvpPrompt: 'Will you be attending?',
    accept: 'Joyfully accept',
    decline: 'Regretfully decline',
    send: 'Send my reply',
    sending: 'Sending…',
    update: 'Update my reply',
    changeAnswer: 'Change my answer',
    cancel: 'Cancel',
    thanksYes: 'Thank you! We’re delighted you’ll be joining us.',
    thanksNo: 'Thank you for letting us know. You’ll be missed.',
    yourAnswer: (a) => `Your reply: ${a}`,
    canChangeUntil: (d) => `You can change your answer until ${d}.`,
    closed: 'Replies have closed. Please contact the couple directly if anything has changed.',
    noReplyClosed: 'Replies have closed and we didn’t receive an answer from you. Please contact the couple directly.',
    personalNote: (n) => `This invitation is personal to ${n}. Please don’t forward the link.`,
    tryAgain: 'Something went wrong. Please try again.',
    youAreInvited: 'You are invited',
    theWeddingOf: 'The wedding of',
    programme: 'The celebrations',
    ourMoments: 'Our moments',
    when: 'When',
    where: 'Where',
    openInvitation: 'Open Invitation',
    viewInvitation: 'View Invitation',
    enterGarden: 'Enter the Garden',
    openBook: 'Open the Storybook',
    onceUpon: 'Once upon a time…',
    happilyEver: '…and they lived happily ever after',
    forGuest: (n) => `To ${n}`,
    tapToOpen: 'Tap to open your invitation',
    skip: 'Skip',
    playMusic: 'Play music',
    pauseMusic: 'Pause music',
    saveTheDate: 'Save the date',
    celebration: 'The celebration',
    kindlyReply: 'Kindly reply',
    scrollDown: 'Scroll down',
    endedTitle: 'This invitation has ended',
    endedMessage: (couple) => `Thank you for celebrating with ${couple}. This invitation is no longer available.`,
    shareDefault: 'Dear {name}, with great joy we invite you to the wedding of {couple}. Please open your personal invitation and let us know if you can attend:',
  },
  si: {
    together: 'දෙපාර්ශවයේම පවුල්වල ආශීර්වාදය ඇතිව',
    defaultInvite: 'අපගේ විවාහ මංගල්‍යයට සහභාගී වන ලෙස ඔබට ගෞරවයෙන් ආරාධනා කරමු',
    dear: (name) => `ආදරණීය ${name}`,
    dearGuest: 'ආදරණීය අමුත්තා',
    sampleGuest: 'අමල් පෙරේරා මහතා',
    and: 'සහ',
    date: 'දිනය',
    time: 'වේලාව',
    venue: 'ස්ථානය',
    dressCode: 'ඇඳුම් විලාසය',
    viewMap: 'සිතියමෙන් බලන්න',
    rsvpBy: (date) => `කරුණාකර ${date} ට පෙර ඔබගේ පැමිණීම දන්වන්න`,
    rsvpPrompt: 'ඔබ සහභාගී වන්නේද?',
    accept: 'සතුටින් පැමිණෙමි',
    decline: 'කනගාටුවෙන් නොපැමිණෙමි',
    send: 'මගේ පිළිතුර යවන්න',
    sending: 'යවමින්…',
    update: 'පිළිතුර යාවත්කාලීන කරන්න',
    changeAnswer: 'පිළිතුර වෙනස් කරන්න',
    cancel: 'අවලංගු කරන්න',
    thanksYes: 'ස්තූතියි! ඔබ අප හා එක්වීම ගැන අපි ඉතා සතුටු වෙමු.',
    thanksNo: 'දැනුම් දීම ගැන ස්තූතියි. අපට ඔබව මග හැරෙනු ඇත.',
    yourAnswer: (a) => `ඔබගේ පිළිතුර: ${a}`,
    canChangeUntil: (d) => `${d} දක්වා ඔබට පිළිතුර වෙනස් කළ හැක.`,
    closed: 'පිළිතුරු ලබා ගැනීම අවසන්. කිසියම් වෙනසක් ඇත්නම් කරුණාකර යුවළ හා කෙලින්ම සම්බන්ධ වන්න.',
    noReplyClosed: 'පිළිතුරු ලබා ගැනීම අවසන් අතර ඔබගෙන් පිළිතුරක් ලැබී නැත. කරුණාකර යුවළ හා කෙලින්ම සම්බන්ධ වන්න.',
    personalNote: (n) => `මෙම ආරාධනය ${n} සඳහා පමණි. කරුණාකර මෙම සබැඳිය වෙනත් අයට යොමු නොකරන්න.`,
    tryAgain: 'දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.',
    youAreInvited: 'ඔබට ආරාධනා කරමු',
    theWeddingOf: 'විවාහ මංගල්‍යය',
    programme: 'උත්සව වැඩසටහන',
    ourMoments: 'අපගේ මතකයන්',
    when: 'දිනය',
    where: 'ස්ථානය',
    openInvitation: 'ආරාධනය විවෘත කරන්න',
    viewInvitation: 'ආරාධනය බලන්න',
    enterGarden: 'උයනට පිවිසෙන්න',
    openBook: 'කතා පොත විවෘත කරන්න',
    onceUpon: 'එක් කලෙක…',
    happilyEver: '…ඉන්පසු ඔවුහු සදා සතුටින් ජීවත් වූහ',
    forGuest: (n) => `${n} වෙත`,
    tapToOpen: 'ඔබගේ ආරාධනය විවෘත කිරීමට ස්පර්ශ කරන්න',
    skip: 'මඟ හරින්න',
    playMusic: 'සංගීතය වාදනය කරන්න',
    pauseMusic: 'සංගීතය නවත්වන්න',
    saveTheDate: 'දිනය සටහන් කරගන්න',
    celebration: 'උත්සවය',
    kindlyReply: 'කරුණාකර පිළිතුරු දෙන්න',
    scrollDown: 'පහළට යන්න',
    endedTitle: 'මෙම ආරාධනය අවසන් වී ඇත',
    endedMessage: (couple) => `${couple} සමඟ සැමරීමට සහභාගී වූවාට ස්තූතියි. මෙම ආරාධනය තවදුරටත් ලබා ගත නොහැක.`,
    shareDefault: 'ආදරණීය {name}, {couple} ගේ විවාහ මංගල්‍යයට ඔබට සතුටින් ආරාධනා කරමු. කරුණාකර ඔබගේ ආරාධනා පත්‍රය විවෘත කර ඔබගේ පැමිණීම දන්වන්න:',
  },
  ta: {
    together: 'இரு குடும்பத்தாரின் ஆசியுடன்',
    defaultInvite: 'எங்கள் திருமண விழாவில் கலந்துகொள்ள அன்புடன் அழைக்கிறோம்',
    dear: (name) => `அன்புள்ள ${name}`,
    dearGuest: 'அன்புள்ள விருந்தினரே',
    sampleGuest: 'அமல் பெரேரா',
    and: 'மற்றும்',
    date: 'தேதி',
    time: 'நேரம்',
    venue: 'இடம்',
    dressCode: 'ஆடை நெறி',
    viewMap: 'வரைபடத்தில் காண்க',
    rsvpBy: (date) => `${date} க்கு முன் உங்கள் வருகையை உறுதிப்படுத்தவும்`,
    rsvpPrompt: 'நீங்கள் கலந்துகொள்வீர்களா?',
    accept: 'மகிழ்ச்சியுடன் வருகிறேன்',
    decline: 'வருத்தத்துடன் வர இயலாது',
    send: 'என் பதிலை அனுப்பு',
    sending: 'அனுப்புகிறது…',
    update: 'என் பதிலைப் புதுப்பி',
    changeAnswer: 'என் பதிலை மாற்று',
    cancel: 'ரத்து செய்',
    thanksYes: 'நன்றி! நீங்கள் எங்களுடன் கலந்துகொள்வதில் மிக்க மகிழ்ச்சி.',
    thanksNo: 'தெரிவித்தமைக்கு நன்றி. உங்களை நாங்கள் மிஸ் செய்வோம்.',
    yourAnswer: (a) => `உங்கள் பதில்: ${a}`,
    canChangeUntil: (d) => `${d} வரை உங்கள் பதிலை மாற்றலாம்.`,
    closed: 'பதில் அளிக்கும் காலம் முடிந்துவிட்டது. ஏதேனும் மாற்றம் இருந்தால் தம்பதியரை நேரடியாகத் தொடர்புகொள்ளவும்.',
    noReplyClosed: 'பதில் அளிக்கும் காலம் முடிந்துவிட்டது, உங்களிடமிருந்து பதில் கிடைக்கவில்லை. தம்பதியரை நேரடியாகத் தொடர்புகொள்ளவும்.',
    personalNote: (n) => `இந்த அழைப்பிதழ் ${n} அவர்களுக்கு மட்டுமானது. இந்த இணைப்பைப் பிறருக்கு அனுப்ப வேண்டாம்.`,
    tryAgain: 'ஏதோ தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
    youAreInvited: 'உங்களை அன்புடன் அழைக்கிறோம்',
    theWeddingOf: 'திருமண விழா',
    programme: 'விழா நிகழ்ச்சிகள்',
    ourMoments: 'எங்கள் நினைவுகள்',
    when: 'எப்போது',
    where: 'எங்கே',
    openInvitation: 'அழைப்பிதழைத் திற',
    viewInvitation: 'அழைப்பிதழைக் காண்க',
    enterGarden: 'தோட்டத்திற்குள் நுழையுங்கள்',
    openBook: 'கதைப் புத்தகத்தைத் திறக்கவும்',
    onceUpon: 'ஒரு காலத்தில்…',
    happilyEver: '…அவர்கள் என்றென்றும் மகிழ்ச்சியாக வாழ்ந்தனர்',
    forGuest: (n) => `${n} அவர்களுக்கு`,
    tapToOpen: 'உங்கள் அழைப்பிதழைத் திறக்கத் தொடவும்',
    skip: 'தவிர்',
    playMusic: 'இசையை இயக்கு',
    pauseMusic: 'இசையை நிறுத்து',
    saveTheDate: 'தேதியைக் குறித்துக்கொள்ளுங்கள்',
    celebration: 'விழா',
    kindlyReply: 'தயவுசெய்து பதிலளிக்கவும்',
    scrollDown: 'கீழே செல்லவும்',
    endedTitle: 'இந்த அழைப்பிதழ் நிறைவடைந்தது',
    endedMessage: (couple) => `${couple} அவர்களுடன் கொண்டாடியதற்கு நன்றி. இந்த அழைப்பிதழ் இனி கிடைக்காது.`,
    shareDefault: 'அன்புள்ள {name}, {couple} அவர்களின் திருமண விழாவிற்கு உங்களை மகிழ்ச்சியுடன் அழைக்கிறோம். உங்கள் அழைப்பிதழைத் திறந்து உங்கள் வருகையைத் தெரிவிக்கவும்:',
  },
}

// The occasions a couple can choose. Every design works for all three; only the standard
// wording below changes (the couple's own text is always shown as typed).
export const OCCASIONS = [
  { value: 'wedding', label: 'Wedding', plural: 'Weddings' },
  { value: 'engagement', label: 'Engagement', plural: 'Engagements' },
  { value: 'homecoming', label: 'Homecoming', plural: 'Homecomings' },
]

const OCCASION_STRINGS = {
  engagement: {
    en: {
      defaultInvite: 'request the pleasure of your company at the celebration of their engagement',
      theWeddingOf: 'The engagement of',
      shareDefault: 'Dear {name}, with great joy we invite you to the engagement of {couple}. Please open your personal invitation and let us know if you can attend:',
    },
    si: {
      defaultInvite: 'අපගේ විවාහ ගිවිස ගැනීමේ උත්සවයට සහභාගී වන ලෙස ඔබට ගෞරවයෙන් ආරාධනා කරමු',
      theWeddingOf: 'විවාහ ගිවිස ගැනීමේ උත්සවය',
      shareDefault: 'ආදරණීය {name}, {couple} ගේ විවාහ ගිවිස ගැනීමේ උත්සවයට ඔබට සතුටින් ආරාධනා කරමු. කරුණාකර ඔබගේ ආරාධනා පත්‍රය විවෘත කර ඔබගේ පැමිණීම දන්වන්න:',
    },
    ta: {
      defaultInvite: 'எங்கள் நிச்சயதார்த்த விழாவில் கலந்துகொள்ள அன்புடன் அழைக்கிறோம்',
      theWeddingOf: 'நிச்சயதார்த்த விழா',
      shareDefault: 'அன்புள்ள {name}, {couple} அவர்களின் நிச்சயதார்த்த விழாவிற்கு உங்களை மகிழ்ச்சியுடன் அழைக்கிறோம். உங்கள் அழைப்பிதழைத் திறந்து உங்கள் வருகையைத் தெரிவிக்கவும்:',
    },
  },
  homecoming: {
    en: {
      defaultInvite: 'request the pleasure of your company at their homecoming celebration',
      theWeddingOf: 'The homecoming of',
      shareDefault: 'Dear {name}, with great joy we invite you to the homecoming of {couple}. Please open your personal invitation and let us know if you can attend:',
    },
    si: {
      defaultInvite: 'අපගේ ගෙදර ඒමේ උත්සවයට සහභාගී වන ලෙස ඔබට ගෞරවයෙන් ආරාධනා කරමු',
      theWeddingOf: 'ගෙදර ඒමේ උත්සවය',
      shareDefault: 'ආදරණීය {name}, {couple} ගේ ගෙදර ඒමේ උත්සවයට ඔබට සතුටින් ආරාධනා කරමු. කරුණාකර ඔබගේ ආරාධනා පත්‍රය විවෘත කර ඔබගේ පැමිණීම දන්වන්න:',
    },
    ta: {
      defaultInvite: 'எங்கள் மறுவீட்டு விழாவில் கலந்துகொள்ள அன்புடன் அழைக்கிறோம்',
      theWeddingOf: 'மறுவீட்டு விழா',
      shareDefault: 'அன்புள்ள {name}, {couple} அவர்களின் மறுவீட்டு விழாவிற்கு உங்களை மகிழ்ச்சியுடன் அழைக்கிறோம். உங்கள் அழைப்பிதழைத் திறந்து உங்கள் வருகையைத் தெரிவிக்கவும்:',
    },
  },
}

// Birthdays: one person and their age. Couple wording that doesn't fit is replaced too
// ("contact the couple" → "contact the hosts"). Sinhala and Tamil are drafts to be checked.
OCCASION_STRINGS.birthday = {
  en: {
    bdayJoin: 'Join us to celebrate',
    bdayAge: (age) => (age != null ? `${ordinalEn(age)} Birthday` : 'Birthday'),
    bdayParty: 'Birthday party',
    // Under the big number: "5" + "th" + "Birthday"
    bdayNumCaption: 'Birthday',
    bdaySuffix: (age) => ordinalEn(age).replace(String(age), ''),
    // the animated birthday designs' opening buttons
    openBalloons: 'Let the balloons go',
    openTreasure: 'Open the treasure chest',
    openGate: 'Open the garden gate',
    openGift: 'Open your gift',
    openWish: 'Make a wish',
    bdaySignoff: 'See you at the party!',
    defaultInvite: 'Come and celebrate with cake, laughter and lots of fun!',
    theWeddingOf: 'The birthday of',
    together: 'You are invited',
    thanksYes: 'Thank you! We can’t wait to celebrate with you.',
    thanksNo: 'Thank you for letting us know. We’ll miss you at the party.',
    closed: 'Replies have closed. Please contact the hosts directly if anything has changed.',
    noReplyClosed: 'Replies have closed and we didn’t receive an answer from you. Please contact the hosts directly.',
    accept: 'Yes, I’ll be there',
    decline: 'Sorry, I can’t come',
    ourMoments: 'Moments',
    shareDefault: 'Dear {name}, you’re invited to {couple}! Please open your personal invitation and let us know if you can come:',
  },
  si: {
    bdayJoin: 'සමරන්නට අප හා එක්වන්න',
    bdayAge: (age) => (age != null ? `${age} වන උපන්දිනය` : 'උපන්දිනය'),
    bdayParty: 'උපන්දින සාදය',
    bdayNumCaption: 'වන උපන්දිනය',
    bdaySuffix: () => '',
    openBalloons: 'බැලූන් නිදහස් කරන්න',
    openTreasure: 'නිධන් පෙට්ටිය විවෘත කරන්න',
    openGate: 'උයනේ දොරටුව විවෘත කරන්න',
    openGift: 'ඔබගේ තෑග්ග විවෘත කරන්න',
    openWish: 'පැතුමක් පතන්න',
    bdaySignoff: 'සාදයේදී හමුවෙමු!',
    defaultInvite: 'කේක්, සිනහව සහ සතුටින් පිරි මේ සැමරුමට ඔබටත් ආදරයෙන් ආරාධනා කරමු',
    theWeddingOf: 'උපන්දින සැමරුම',
    together: 'ඔබට ආරාධනා කරමු',
    thanksYes: 'ස්තූතියි! ඔබ සමඟ සැමරීමට අපි මහත් ආශාවෙන් සිටිමු.',
    thanksNo: 'දැනුම් දීම ගැන ස්තූතියි. සාදයේදී අපට ඔබව මග හැරෙනු ඇත.',
    closed: 'පිළිතුරු ලබා ගැනීම අවසන්. කිසියම් වෙනසක් ඇත්නම් කරුණාකර ආරාධනා කළ අය හා කෙලින්ම සම්බන්ධ වන්න.',
    noReplyClosed: 'පිළිතුරු ලබා ගැනීම අවසන් අතර ඔබගෙන් පිළිතුරක් ලැබී නැත. කරුණාකර ආරාධනා කළ අය හා කෙලින්ම සම්බන්ධ වන්න.',
    ourMoments: 'මතකයන්',
    shareDefault: 'ආදරණීය {name}, {couple} සැමරීමට ඔබට සතුටින් ආරාධනා කරමු. කරුණාකර ඔබගේ ආරාධනා පත්‍රය විවෘත කර ඔබගේ පැමිණීම දන්වන්න:',
  },
  ta: {
    bdayJoin: 'எங்களுடன் கொண்டாட வாருங்கள்',
    bdayAge: (age) => (age != null ? `${age}வது பிறந்தநாள்` : 'பிறந்தநாள்'),
    bdayParty: 'பிறந்தநாள் விழா',
    bdayNumCaption: 'வது பிறந்தநாள்',
    bdaySuffix: () => '',
    openBalloons: 'பலூன்களைப் பறக்க விடுங்கள்',
    openTreasure: 'புதையல் பெட்டியைத் திறக்கவும்',
    openGate: 'தோட்ட வாயிலைத் திறக்கவும்',
    openGift: 'உங்கள் பரிசைத் திறக்கவும்',
    openWish: 'ஒரு வேண்டுதல் செய்யுங்கள்',
    bdaySignoff: 'விழாவில் சந்திப்போம்!',
    defaultInvite: 'கேக், சிரிப்பு மற்றும் மகிழ்ச்சி நிறைந்த இந்தக் கொண்டாட்டத்தில் கலந்துகொள்ள அன்புடன் அழைக்கிறோம்',
    theWeddingOf: 'பிறந்தநாள் விழா',
    together: 'உங்களை அன்புடன் அழைக்கிறோம்',
    thanksYes: 'நன்றி! உங்களுடன் கொண்டாட ஆவலுடன் காத்திருக்கிறோம்.',
    thanksNo: 'தெரிவித்தமைக்கு நன்றி. விழாவில் உங்களை நாங்கள் மிஸ் செய்வோம்.',
    closed: 'பதில் அளிக்கும் காலம் முடிந்துவிட்டது. ஏதேனும் மாற்றம் இருந்தால் அழைத்தவர்களை நேரடியாகத் தொடர்புகொள்ளவும்.',
    noReplyClosed: 'பதில் அளிக்கும் காலம் முடிந்துவிட்டது, உங்களிடமிருந்து பதில் கிடைக்கவில்லை. அழைத்தவர்களை நேரடியாகத் தொடர்புகொள்ளவும்.',
    ourMoments: 'நினைவுகள்',
    shareDefault: 'அன்புள்ள {name}, {couple} விழாவிற்கு உங்களை மகிழ்ச்சியுடன் அழைக்கிறோம். உங்கள் அழைப்பிதழைத் திறந்து உங்கள் வருகையைத் தெரிவிக்கவும்:',
  },
}

// 1 → "1st", 22 → "22nd", 13 → "13th"
export function ordinalEn(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

export const isBirthday = (invitation) => invitation?.eventType === 'birthday'

// Who the invitation is for: "Amaya & Nuwan", or "Kavindi" for a birthday
export function hostsOf(invitation, lang = 'en') {
  if (isBirthday(invitation)) return invitation.celebrant || '…'
  const and = (STRINGS[lang] || STRINGS.en).and
  return `${invitation?.partnerOne || '…'} ${and} ${invitation?.partnerTwo || '…'}`
}

// A title for lists, the share message and file names:
// "Amaya & Nuwan", or "Kavindi's 5th birthday" (in the invitation's language)
export function invitationTitle(invitation, lang = 'en') {
  if (!isBirthday(invitation)) return hostsOf(invitation, lang)
  const name = invitation.celebrant || '…'
  const age = invitation.age ?? null
  if (lang === 'si') return age != null ? `${name}ගේ ${age} වන උපන්දිනය` : `${name}ගේ උපන්දිනය`
  if (lang === 'ta') return age != null ? `${name}-இன் ${age}வது பிறந்தநாள்` : `${name}-இன் பிறந்தநாள்`
  return age != null ? `${name}’s ${ordinalEn(age)} birthday` : `${name}’s birthday`
}

// The wording for an invitation: its language, with the lines for its occasion
export function stringsFor(language, eventType) {
  const lang = STRINGS[language] ? language : 'en'
  const extra = OCCASION_STRINGS[eventType]?.[lang]
  return extra ? { ...STRINGS[lang], ...extra } : STRINGS[lang]
}

export function occasionLabel(eventType) {
  if (eventType === 'birthday') return 'Birthday'
  return (OCCASIONS.find((o) => o.value === eventType) || OCCASIONS[0]).label
}

// Sinhala dates are written out here rather than left to the browser: many phones have no
// Sinhala date data and would fall back to English. Order: year, month, day, weekday
// ("2026 දෙසැම්බර් 12 වන සෙනසුරාදා"), using whichever parts `opts` asks for.
const SI_MONTHS = ['ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි', 'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්']
const SI_DAYS = ['ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා']
function sinhalaDate(date, opts = {}) {
  const parts = []
  if (opts.year) parts.push(String(date.getUTCFullYear()))
  if (opts.month) parts.push(opts.month === 'numeric' || opts.month === '2-digit' ? String(date.getUTCMonth() + 1) : SI_MONTHS[date.getUTCMonth()])
  if (opts.day) parts.push(opts.weekday ? `${date.getUTCDate()} වන` : String(date.getUTCDate()))
  if (opts.weekday) parts.push(SI_DAYS[date.getUTCDay()])
  return parts.join(' ')
}

// Use the language's own date format when the browser supports it, otherwise English
function localeFor(language) {
  const locale = LANGUAGES.find((l) => l.code === language)?.locale || 'en-GB'
  try {
    return Intl.DateTimeFormat.supportedLocalesOf(locale).length ? locale : 'en-GB'
  } catch {
    return 'en-GB'
  }
}

// "2026-12-12" → "Saturday, 12 December 2026" (in the invitation's language)
export function formatDate(isoDate, language, opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  if (language === 'si') return sinhalaDate(date, opts)
  try {
    return new Intl.DateTimeFormat(localeFor(language), { ...opts, timeZone: 'UTC' }).format(date)
  } catch {
    return isoDate
  }
}

// "16:00" → "4:00 pm"
export function formatTime(time, language) {
  if (!time) return ''
  const [h, min] = time.split(':').map(Number)
  const date = new Date(Date.UTC(2000, 0, 1, h, min))
  if (language === 'si') return `${h < 12 ? 'පෙ.ව.' : 'ප.ව.'} ${h % 12 || 12}.${String(min).padStart(2, '0')}`
  try {
    return new Intl.DateTimeFormat(localeFor(language), { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' }).format(date)
  } catch {
    return time
  }
}

// A sample guest name in the invitation's language, for previews
export function sampleGuestName(language) {
  return (STRINGS[language] || STRINGS.en).sampleGuest
}
