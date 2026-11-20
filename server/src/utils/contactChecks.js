// Checks for a guest's phone number and email (guest form and Excel import).
// Phones: Sri Lankan mobiles (sent by WhatsApp) in any common form, or a foreign number with
// its country code. Emails: a real-looking address, with a hint for common typos (gmial.com).

// Sri Lankan mobile numbers without the leading 0: 70, 71, 72, 74, 75, 76, 77, 78 + 7 digits
const SL_MOBILE = /^7[0124-8]\d{7}$/;

// Keep digits and a leading +, e.g. "077 123 4567" → "0771234567".
// A 9-digit number starting with 7 is a Sri Lankan mobile that lost its leading 0
// (Excel often does this to numbers), so the 0 is put back.
function cleanPhone(value) {
    const trimmed = String(value).trim();
    const plus = trimmed.startsWith("+") ? "+" : "";
    const digits = trimmed.replace(/\D/g, "");
    if (!plus && /^7\d{8}$/.test(digits)) return `0${digits}`;
    return plus + digits;
}

// → { phone } when it's fine (cleaned), or { error } with what to fix
function checkPhone(value) {
    const raw = String(value).trim();
    if (/[a-z]/i.test(raw)) return { error: "A phone number can only have digits, spaces, dashes and a + at the start." };
    const phone = cleanPhone(raw);
    const plus = phone.startsWith("+");
    const digits = phone.replace("+", "");
    if (!digits) return { error: "Enter a phone number, or leave it empty." };
    if (/^(\d)\1+$/.test(digits.replace(/^0|^94/, ""))) return { error: "This doesn't look like a real phone number." };

    // Sri Lankan, with the country code: +94 77 123 4567 or 94771234567
    if ((plus && digits.startsWith("94")) || (!plus && digits.startsWith("94") && digits.length === 11)) {
        const national = digits.slice(2).replace(/^0/, ""); // "+94 077…" happens too
        if (national.length !== 9) return { error: "A Sri Lankan number has 9 digits after +94, e.g. +94 77 123 4567." };
        if (!SL_MOBILE.test(national)) return { error: "Use a mobile number (+94 7…) so the invitation can be sent by WhatsApp." };
        return { phone: plus ? `+94${national}` : `94${national}` };
    }
    // Another country: + and its code
    if (plus) {
        if (digits.length < 8 || digits.length > 15) return { error: "Enter the full number with its country code, e.g. +44 7700 900123." };
        return { phone };
    }
    // Sri Lankan, local: 077 123 4567
    if (digits.startsWith("0")) {
        if (digits.length !== 10) return { error: `A Sri Lankan number has 10 digits (this has ${digits.length}), e.g. 077 123 4567.` };
        if (!SL_MOBILE.test(digits.slice(1))) return { error: "Use a mobile number (07…) so the invitation can be sent by WhatsApp." };
        return { phone };
    }
    return { error: "Start with 0 (e.g. 077 123 4567), or + and the country code for a number abroad." };
}

const EMAIL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;

// Mistyped big email providers → the right spelling
const DOMAIN_TYPOS = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com", "gamil.com": "gmail.com", "gnail.com": "gmail.com",
    "gmaill.com": "gmail.com", "gmail.co": "gmail.com", "gmail.cm": "gmail.com", "gmail.con": "gmail.com", "gmail.om": "gmail.com", "gmail.lk": "gmail.com",
    "yahooo.com": "yahoo.com", "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "yahoo.con": "yahoo.com",
    "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com",
    "outlok.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com",
    "iclod.com": "icloud.com", "icloud.co": "icloud.com", "icoud.com": "icloud.com",
};

// → { email } (lower case) when it's fine, or { error }
function checkEmail(value) {
    const email = String(value).trim().toLowerCase();
    if (/\s/.test(email)) return { error: "An email address can't have spaces." };
    if (email.length > 254 || !EMAIL_RE.test(email)) return { error: "Enter a full email address, e.g. amal@gmail.com, or leave it empty." };
    const [local, domain] = email.split("@");
    if (local.length > 64) return { error: "The part before @ is too long." };
    if (DOMAIN_TYPOS[domain]) return { error: `Did you mean ${local}@${DOMAIN_TYPOS[domain]}?` };
    return { email };
}

module.exports = { cleanPhone, checkPhone, checkEmail };
