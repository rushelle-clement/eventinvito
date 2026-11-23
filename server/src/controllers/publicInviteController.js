// What a guest sees when they open their personal link (FR-043, FR-044).
// The token in the URL is the only credential: it identifies exactly one guest,
// and nothing in the request can switch to another guest.

const Guest = require("../models/Guest");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const { limitsFor } = require("../utils/packages");
const AppError = require("../utils/AppError");
const { hashToken, looksLikeToken } = require("../utils/guestToken");
const { shareImageUrl } = require("../utils/cloudinary");

const INVALID = "This invitation link is not valid. It may have been mistyped, replaced, or removed. Please contact the couple for a new link.";
const UNAVAILABLE = "This invitation isn't available right now. Please check back later or contact the couple.";
const ENDED = "This invitation has ended. Thank you for celebrating with the couple.";

// Shared by the view and RSVP routes
async function loadByToken(token) {
    if (!looksLikeToken(token)) throw new AppError(404, INVALID, undefined, "invalid_link");

    const guest = await Guest.findOne({ tokenHash: hashToken(token) });
    if (!guest) throw new AppError(404, INVALID, undefined, "invalid_link");

    const invitation = await Invitation.findById(guest.invitation).populate("template", "tier");
    // Printed Cards guests reply with the QR code on their card; only those given the free online
    // card (when the couple turned it on) have a link that opens
    const printedOnly = invitation?.printed && !(invitation.onlineCard && guest.cardType !== "physical");
    if (!invitation || invitation.status === "archived" || printedOnly) throw new AppError(404, INVALID, undefined, "invalid_link");
    if (invitation.status !== "published") throw new AppError(403, UNAVAILABLE, undefined, "not_published");
    // The day after the last event has passed: only the couple's names, for a polite note
    if (invitation.hasEnded()) {
        throw new AppError(410, ENDED, undefined, "ended", {
            ended: {
                partnerOne: invitation.partnerOne,
                partnerTwo: invitation.partnerTwo,
                celebrant: invitation.celebrant,
                age: invitation.age ?? null,
                companyName: invitation.companyName || "",
                eventTitle: invitation.eventTitle || "",
                eventType: invitation.eventType,
                language: invitation.language,
            },
        });
    }

    return { guest, invitation };
}

// The day plan is shown when the couple switched it on and their package includes it
async function showAgenda(invitation) {
    if (invitation.isBirthday() || !invitation.agendaVisible || !(invitation.agenda || []).length) return false;
    const owner = await User.findById(invitation.owner).select("plan role publishCredits freeCredits");
    return Boolean(owner && limitsFor(invitation, owner).agenda);
}

async function guestView(guest, invitation) {
    return {
        success: true,
        guest: { name: guest.displayName || guest.name },
        rsvp: {
            available: true, // every design takes replies; free designs have no deadline
            status: guest.rsvpStatus,
            respondedAt: guest.respondedAt,
            open: invitation.isRsvpOpen(),
            deadline: invitation.isFreeDesign() ? "" : invitation.rsvpDeadline, // Simple Card has no deadline
        },
        invitation: invitation.toGuestJSON({ showAgenda: await showAgenda(invitation) }),
    };
}

// Notes that the guest opened their invitation (see Guest.openedAt). Not when the couple opens a
// guest's link themselves while signed in, e.g. to check it.
const VISIT_GAP = 30 * 60 * 1000;
async function recordOpen(req, guest, invitation) {
    if (req.user && String(req.user._id) === String(invitation.owner)) return;
    const now = new Date();
    const newVisit = !guest.lastOpenedAt || now - guest.lastOpenedAt > VISIT_GAP;
    const update = { $set: { lastOpenedAt: now }, ...(newVisit && { $inc: { openCount: 1 } }) };
    if (!guest.openedAt) update.$set.openedAt = now;
    try {
        await Guest.updateOne({ _id: guest._id, tokenHash: guest.tokenHash }, update);
    } catch (err) {
        console.error("[invite] could not record an open:", err.message); // never stops the guest seeing it
    }
}

// GET /api/invite/:token
async function viewInvite(req, res) {
    const { guest, invitation } = await loadByToken(req.params.token);
    await recordOpen(req, guest, invitation);
    res.set("Cache-Control", "no-store");
    res.json(await guestView(guest, invitation));
}

// POST /api/invite/:token/rsvp  { response: "attending" | "not_attending" }
// The token decides which guest is answering — the body can't name a different guest (BR-007).
// Answering again before the deadline replaces the earlier answer (FR-056).
async function submitRsvp(req, res) {
    const response = req.body?.response;
    if (!["attending", "not_attending"].includes(response)) {
        throw new AppError(400, "Please choose whether you will attend.", { response: "Choose attending or not attending." });
    }

    // Rules are checked here on the server, not just in the page (FR-057)
    const { guest, invitation } = await loadByToken(req.params.token);
    if (!invitation.isRsvpOpen()) {
        throw new AppError(403, "Replies for this invitation have closed. Please contact the couple directly.", undefined, "rsvp_closed");
    }

    // Only update if the link is still the current one (it could have been reset a moment ago)
    const updated = await Guest.findOneAndUpdate(
        { _id: guest._id, tokenHash: guest.tokenHash },
        { $set: { rsvpStatus: response, respondedAt: new Date(), rsvpVia: "link", ...(!guest.openedAt && { openedAt: new Date(), lastOpenedAt: new Date() }) } },
        { returnDocument: "after", runValidators: true }
    );
    if (!updated) throw new AppError(404, INVALID, undefined, "invalid_link");

    res.set("Cache-Control", "no-store");
    res.json(await guestView(updated, invitation));
}

// ---------------------------------------------------------------- link previews
//
// GET /api/invite/:token/share — a tiny page with the link-preview details (Open Graph tags) that
// WhatsApp, Facebook, Telegram and the like read when a guest's link is pasted into a chat. They
// don't run the site's JavaScript, so the site (vercel.json) sends only these bots here; people
// always get the real invitation. A person who does land here is sent straight on to it.
//
// Shown: the couple's names (or the birthday), the occasion, date and venue, and their cover photo
// (or a "You're invited" card). Never the guest's name, so a forwarded preview reveals nothing
// personal. Links that are invalid, unpublished or ended get a plain EventInvito preview.

const OCCASION = {
    en: { wedding: "Wedding invitation", engagement: "Engagement invitation", homecoming: "Homecoming invitation", birthday: "Birthday invitation", corporate: "Invitation", christmas: "Christmas party invitation" },
    si: { wedding: "විවාහ ආරාධනාව", engagement: "විවාහ ගිවිස ගැනීමේ ආරාධනාව", homecoming: "ගෙදර ඒමේ උත්සව ආරාධනාව", birthday: "උපන්දින සාද ආරාධනාව", corporate: "ආරාධනාව", christmas: "නත්තල් සාද ආරාධනාව" },
    ta: { wedding: "திருமண அழைப்பிதழ்", engagement: "நிச்சயதார்த்த அழைப்பிதழ்", homecoming: "மறுவீட்டு விழா அழைப்பிதழ்", birthday: "பிறந்தநாள் அழைப்பிதழ்", corporate: "அழைப்பிதழ்", christmas: "கிறிஸ்துமஸ் விருந்து அழைப்பிதழ்" },
};
const TAP = { en: "Tap to open your invitation.", si: "ඔබගේ ආරාධනාව විවෘත කිරීමට තට්ටු කරන්න.", ta: "உங்கள் அழைப்பிதழைத் திறக்கத் தொடவும்." };
const LOCALE = { en: "en-GB", si: "si-LK", ta: "ta-LK" };

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const siteBase = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");

function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

function longDate(iso, lang) {
    if (!iso) return "";
    try {
        return new Intl.DateTimeFormat(LOCALE[lang] || "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
    } catch {
        return iso;
    }
}

// The preview's title, description and picture for one invitation
function sharePreview(invitation) {
    const lang = OCCASION[invitation.language] ? invitation.language : "en";
    const birthday = invitation.isBirthday();
    const occasion = OCCASION[lang][invitation.eventType] || OCCASION[lang].wedding;
    let who;
    if (invitation.isCorporate() || invitation.isChristmas()) {
        who = [invitation.eventTitle, invitation.companyName].filter(Boolean).join(" · ");
    } else if (birthday) {
        const name = invitation.celebrant || "";
        who = lang === "en" && name ? (invitation.age != null ? `${name}'s ${ordinal(invitation.age)} birthday` : `${name}'s birthday`) : name;
    } else {
        who = [invitation.partnerOne, invitation.partnerTwo].filter(Boolean).join(lang === "si" ? " සහ " : " & ");
    }
    const title = invitation.isCorporate() || invitation.isChristmas() ? who || occasion : who ? `${who} · ${birthday && lang === "en" ? "Invitation" : occasion}` : occasion;
    const description = [[longDate(invitation.eventDate, lang), invitation.venueName].filter(Boolean).join(" · "), TAP[lang]].filter(Boolean).join(". ");

    const cover = invitation.showsPhotos() ? (invitation.photos || [])[0] : null;
    const image = shareImageUrl(cover) || `${siteBase()}/share/${birthday ? "invite-birthday" : invitation.isCorporate() || invitation.isChristmas() ? "site" : "invite-wedding"}.jpg`;
    return { title, description, image, lang };
}

const GENERIC = () => ({
    title: "You're invited · EventInvito",
    description: "Tap to open your invitation.",
    image: `${siteBase()}/share/invite-wedding.jpg`,
    lang: "en",
});

function sharePage({ title, description, image, lang }, url) {
    return `<!doctype html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EventInvito">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0; url=${esc(url)}">
</head>
<body><p><a href="${esc(url)}">${esc(title)}</a></p></body>
</html>`;
}

// GET /api/invite/:token/share
async function shareInvite(req, res) {
    const token = req.params.token;
    const url = `${siteBase()}/i/${encodeURIComponent(token)}`;
    let preview;
    try {
        const { invitation } = await loadByToken(token);
        preview = sharePreview(invitation);
    } catch (err) {
        if (!(err instanceof AppError)) throw err;
        preview = GENERIC(); // invalid, unpublished or ended: nothing about the couple
    }
    // Chat apps keep their own copy of a preview; a short cache here keeps repeat fetches cheap
    res.set("Cache-Control", "public, max-age=300");
    res.type("html").send(sharePage(preview, url));
}

module.exports = { viewInvite, submitRsvp, shareInvite, loadByToken, sharePreview };
