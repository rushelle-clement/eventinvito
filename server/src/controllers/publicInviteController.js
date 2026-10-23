// What a guest sees when they open their personal link (FR-043, FR-044).
// The token in the URL is the only credential: it identifies exactly one guest,
// and nothing in the request can switch to another guest.

const Guest = require("../models/Guest");
const Invitation = require("../models/Invitation");
const AppError = require("../utils/AppError");
const { hashToken, looksLikeToken } = require("../utils/guestToken");

const INVALID = "This invitation link is not valid. It may have been mistyped, replaced, or removed. Please contact the couple for a new link.";
const UNAVAILABLE = "This invitation isn't available right now. Please check back later or contact the couple.";
const ENDED = "This invitation has ended. Thank you for celebrating with the couple.";

// Shared by the view and RSVP routes
async function loadByToken(token) {
    if (!looksLikeToken(token)) throw new AppError(404, INVALID, undefined, "invalid_link");

    const guest = await Guest.findOne({ tokenHash: hashToken(token) });
    if (!guest) throw new AppError(404, INVALID, undefined, "invalid_link");

    const invitation = await Invitation.findById(guest.invitation).populate("template", "tier");
    if (!invitation || invitation.status === "archived") throw new AppError(404, INVALID, undefined, "invalid_link");
    if (invitation.status !== "published") throw new AppError(403, UNAVAILABLE, undefined, "not_published");
    // The day after the last event has passed: only the couple's names, for a polite note
    if (invitation.hasEnded()) {
        throw new AppError(410, ENDED, undefined, "ended", {
            ended: {
                partnerOne: invitation.partnerOne,
                partnerTwo: invitation.partnerTwo,
                celebrant: invitation.celebrant,
                age: invitation.age ?? null,
                eventType: invitation.eventType,
                language: invitation.language,
            },
        });
    }

    return { guest, invitation };
}

function guestView(guest, invitation) {
    return {
        success: true,
        guest: { name: guest.displayName || guest.name },
        rsvp: {
            available: !invitation.isFreeDesign(), // free designs have no RSVP
            status: guest.rsvpStatus,
            respondedAt: guest.respondedAt,
            open: invitation.isRsvpOpen(),
            deadline: invitation.rsvpDeadline,
        },
        invitation: invitation.toGuestJSON(),
    };
}

// GET /api/invite/:token
async function viewInvite(req, res) {
    const { guest, invitation } = await loadByToken(req.params.token);
    res.set("Cache-Control", "no-store");
    res.json(guestView(guest, invitation));
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
    if (invitation.isFreeDesign()) {
        throw new AppError(403, "This invitation doesn't take replies online. Please contact the couple directly.", undefined, "rsvp_unavailable");
    }
    if (!invitation.isRsvpOpen()) {
        throw new AppError(403, "Replies for this invitation have closed. Please contact the couple directly.", undefined, "rsvp_closed");
    }

    // Only update if the link is still the current one (it could have been reset a moment ago)
    const updated = await Guest.findOneAndUpdate(
        { _id: guest._id, tokenHash: guest.tokenHash },
        { $set: { rsvpStatus: response, respondedAt: new Date() } },
        { returnDocument: "after", runValidators: true }
    );
    if (!updated) throw new AppError(404, INVALID, undefined, "invalid_link");

    res.set("Cache-Control", "no-store");
    res.json(guestView(updated, invitation));
}

module.exports = { viewInvite, submitRsvp, loadByToken };
