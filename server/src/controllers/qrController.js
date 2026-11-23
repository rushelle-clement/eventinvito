// One QR code per invitation for printed cards (Premium Plus and Signature).
// Guests with a physical card scan it, type their name, pick themselves and reply.
// Only guests the couple marked as "physical card" can be found this way.
//
//   PATCH /api/invitations/:id/qr   { enabled }       – the couple switches it on or off
//   GET   /api/qr/:code                               – names, date and venue for the reply page
//   POST  /api/qr/:code/find        { name }          – up to 5 physical-card guests matching the name
//   POST  /api/qr/:code/rsvp        { guestId, response }

const crypto = require("crypto");
const mongoose = require("mongoose");
const Guest = require("../models/Guest");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { limitsFor } = require("../utils/packages");
const { nameTokens, nameMatches } = require("../utils/qrNames");
const { findOwned } = require("./invitationController");
const { requireFeature } = require("./guestController");

const MAX_MATCHES = 5;
const UNAVAILABLE = "Replies by QR code aren't open yet. Please contact the person who invited you.";
const ENDED = "This event has ended. Thank you for celebrating with us.";

// ---------- owner ----------

async function setQr(req, res) {
    const invitation = await findOwned(req);
    const enabled = req.body?.enabled;
    if (typeof enabled !== "boolean") throw new AppError(400, "Say whether the QR code is on or off.");
    if (enabled) {
        requireFeature(limitsFor(invitation, req.user), "qrRsvp", "Physical cards with a QR code are part of Premium Plus and Signature.");
        // Made once and kept: it's printed on the cards
        if (!invitation.qrCode) invitation.qrCode = crypto.randomBytes(8).toString("base64url");
    }
    invitation.qrEnabled = enabled;
    await invitation.save();
    res.json({ success: true, qr: invitation.qrJSON(req.user) });
}

// ---------- public ----------

async function loadByCode(code) {
    if (typeof code !== "string" || !/^[\w-]{6,24}$/.test(code)) throw new AppError(404, UNAVAILABLE, undefined, "qr_unavailable");
    const invitation = await Invitation.findOne({ qrCode: code }).populate("template", "tier");
    if (!invitation || !invitation.qrEnabled || invitation.status !== "published") throw new AppError(404, UNAVAILABLE, undefined, "qr_unavailable");
    if (invitation.hasEnded()) throw new AppError(410, ENDED, undefined, "ended");
    // The package may have changed since the cards were printed
    const owner = await User.findById(invitation.owner).select("plan role publishCredits freeCredits");
    if (!owner || !limitsFor(invitation, owner).qrRsvp) throw new AppError(404, UNAVAILABLE, undefined, "qr_unavailable");
    return invitation;
}

const eventJSON = (invitation) => ({
    eventType: invitation.eventType,
    language: invitation.language,
    partnerOne: invitation.partnerOne,
    partnerTwo: invitation.partnerTwo,
    celebrant: invitation.celebrant,
    age: invitation.age ?? null,
    eventTitle: invitation.eventTitle || "",
    companyName: invitation.companyName || "",
    eventDate: invitation.eventDate,
    eventTime: invitation.eventTime,
    venueName: invitation.venueName,
    rsvpDeadline: invitation.rsvpDeadline,
    rsvpOpen: invitation.isRsvpOpen(),
});

const guestJSON = (g) => ({ id: g._id.toString(), name: g.displayName || g.name, status: g.rsvpStatus });

async function viewQr(req, res) {
    const invitation = await loadByCode(req.params.code);
    res.json({ success: true, invitation: eventJSON(invitation) });
}

async function findGuest(req, res) {
    const invitation = await loadByCode(req.params.code);
    const typed = nameTokens(typeof req.body?.name === "string" ? req.body.name.slice(0, 100) : "");
    if (typed.join("").length < 3) throw new AppError(400, "Please type your name.", undefined, "name_too_short");

    const guests = await Guest.find({ invitation: invitation._id, cardType: "physical" }).select("name displayName rsvpStatus").lean();
    const matches = guests.filter((g) => nameMatches(typed, g.name) || nameMatches(typed, g.displayName));
    if (matches.length > MAX_MATCHES) return res.json({ success: true, tooMany: true, matches: [] });
    matches.sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name));
    res.json({ success: true, tooMany: false, matches: matches.map(guestJSON) });
}

async function submitQrRsvp(req, res) {
    const invitation = await loadByCode(req.params.code);
    const { guestId, response } = req.body || {};
    if (!["attending", "not_attending"].includes(response)) throw new AppError(400, "Please choose whether you'll attend.");
    if (typeof guestId !== "string" || !mongoose.isValidObjectId(guestId)) throw new AppError(404, "We couldn't find you on the guest list. Please contact the couple.", undefined, "guest_not_found");
    if (!invitation.isRsvpOpen()) throw new AppError(403, "Replies are closed for this invitation. Please contact the couple.", undefined, "rsvp_closed");

    const guest = await Guest.findOneAndUpdate(
        { _id: guestId, invitation: invitation._id, cardType: "physical" },
        { $set: { rsvpStatus: response, respondedAt: new Date(), rsvpVia: "qr" } },
        { new: true }
    );
    if (!guest) throw new AppError(404, "We couldn't find you on the guest list. Please contact the couple.", undefined, "guest_not_found");
    res.json({ success: true, guest: guestJSON(guest), respondedAt: guest.respondedAt });
}

module.exports = { setQr, viewQr, findGuest, submitQrRsvp };
