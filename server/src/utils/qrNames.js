// Name matching for the printed-card QR reply page (controllers/qrController.js).
// Guests type their own name, so we forgive case, extra spaces, dots, titles and
// partial words: "mr. amal per" finds "Amal Perera".

const TITLES = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "rev", "prof", "sir", "madam", "hon", "and", "family", "the"]);

// "Mr. & Mrs.  A.B. Perera" → ["a", "b", "perera"]
function nameTokens(value) {
    return String(value || "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[&.,'’"()\-_/\\]+/g, " ")
        .split(/\s+/)
        .filter((t) => t && !TITLES.has(t));
}

// The key used to spot two physical-card guests with the same name
const nameKey = (value) => nameTokens(value).join(" ");

// Every typed word must be the start of a word in the guest's name
function nameMatches(typedTokens, guestName) {
    const words = nameTokens(guestName);
    if (!words.length) return false;
    const used = new Set();
    return typedTokens.every((t) => {
        const i = words.findIndex((w, idx) => !used.has(idx) && w.startsWith(t));
        if (i === -1) return false;
        used.add(i);
        return true;
    });
}

module.exports = { nameTokens, nameKey, nameMatches };
