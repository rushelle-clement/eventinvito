// Guest list management for the invitation owner (FR-040 – FR-046).
// Every route first loads the invitation with findOwned(), so a user can only
// touch guests of their own invitations (FR-003).

const mongoose = require("mongoose");
const Guest = require("../models/Guest");
const AppError = require("../utils/AppError");
const { findOwned } = require("./invitationController");
const { newGuestToken, decrypt, guestLink } = require("../utils/guestToken");

const MAX_GUESTS_PER_INVITATION = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function readGuest(body = {}, { partial = false } = {}) {
    const out = {};
    const errors = {};
    const text = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : null);

    if (!partial || "name" in body) {
        const name = text(body.name);
        if (!name) errors.name = "Enter the guest's name.";
        else if (name.length > 100) errors.name = "Name must be 100 characters or fewer.";
        else out.name = name;
    }
    if ("displayName" in body) {
        const displayName = text(body.displayName);
        if (displayName === null) errors.displayName = "Must be text.";
        else if (displayName.length > 100) errors.displayName = "Name on invitation must be 100 characters or fewer.";
        else out.displayName = displayName;
    }
    if ("email" in body) {
        const email = text(body.email);
        if (email === null) errors.email = "Must be text.";
        else if (email && !EMAIL_RE.test(email)) errors.email = "Enter a valid email address, or leave it empty.";
        else out.email = email.toLowerCase();
    }
    if ("phone" in body) {
        const raw = text(body.phone);
        const phone = raw ? cleanPhone(raw) : "";
        if (raw === null) errors.phone = "Must be text.";
        else if (raw && !/^\+?\d{7,15}$/.test(phone)) errors.phone = "Enter a valid phone number, or leave it empty.";
        else out.phone = phone;
    }
    if ("notes" in body) {
        const notes = text(body.notes);
        if (notes === null) errors.notes = "Must be text.";
        else if (notes.length > 300) errors.notes = "Notes must be 300 characters or fewer.";
        else out.notes = notes;
    }
    return { values: out, errors };
}

function toOwnerJSON(guest) {
    const token = decrypt(guest.tokenEncrypted);
    return {
        id: guest._id.toString(),
        name: guest.name,
        displayName: guest.displayName || "",
        email: guest.email,
        phone: guest.phone,
        notes: guest.notes,
        link: token ? guestLink(token) : null, // null → the couple should reset the link
        rsvpStatus: guest.rsvpStatus,
        respondedAt: guest.respondedAt,
        sharedAt: guest.sharedAt,
        createdAt: guest.createdAt,
        updatedAt: guest.updatedAt,
    };
}

async function findOwnedGuest(req, invitation) {
    const { guestId } = req.params;
    if (!mongoose.isValidObjectId(guestId)) throw new AppError(404, "Guest not found.");
    const guest = await Guest.findOne({ _id: guestId, invitation: invitation._id, owner: req.user._id });
    if (!guest) throw new AppError(404, "Guest not found.");
    return guest;
}

// GET /api/invitations/:id/guests
async function listGuests(req, res) {
    const invitation = await findOwned(req);
    const guests = await Guest.find({ invitation: invitation._id, owner: req.user._id }).sort({ name: 1 });
    const summary = { total: guests.length, attending: 0, not_attending: 0, pending: 0, shared: 0 };
    for (const g of guests) {
        summary[g.rsvpStatus] += 1;
        if (g.sharedAt) summary.shared += 1;
    }
    res.json({ success: true, invitation: invitation.toOwnerJSON(), summary, guests: guests.map(toOwnerJSON) });
}

// POST /api/invitations/:id/guests  { name, email?, phone?, notes? }
async function addGuest(req, res) {
    const invitation = await findOwned(req);
    const { values, errors } = readGuest(req.body);
    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);

    const count = await Guest.countDocuments({ invitation: invitation._id });
    if (count >= MAX_GUESTS_PER_INVITATION) {
        throw new AppError(400, `An invitation can have up to ${MAX_GUESTS_PER_INVITATION} guests.`);
    }

    const { tokenHash, tokenEncrypted } = newGuestToken();
    const guest = await Guest.create({
        ...values,
        invitation: invitation._id,
        owner: req.user._id,
        tokenHash,
        tokenEncrypted,
    });
    res.status(201).json({ success: true, guest: toOwnerJSON(guest) });
}

// PATCH /api/invitations/:id/guests/:guestId
async function updateGuest(req, res) {
    const invitation = await findOwned(req);
    const guest = await findOwnedGuest(req, invitation);
    const { values, errors } = readGuest(req.body, { partial: true });
    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);
    Object.assign(guest, values);
    await guest.save();
    res.json({ success: true, guest: toOwnerJSON(guest) });
}

// DELETE /api/invitations/:id/guests/:guestId — the guest's link stops working (FR-045)
async function removeGuest(req, res) {
    const invitation = await findOwned(req);
    const guest = await findOwnedGuest(req, invitation);
    await Guest.deleteOne({ _id: guest._id });
    res.json({ success: true, message: "Guest removed." });
}

// POST /api/invitations/:id/guests/:guestId/reset-link — old link stops working, a new one is issued
async function resetGuestLink(req, res) {
    const invitation = await findOwned(req);
    const guest = await findOwnedGuest(req, invitation);
    const { tokenHash, tokenEncrypted } = newGuestToken();
    guest.tokenHash = tokenHash;
    guest.tokenEncrypted = tokenEncrypted;
    guest.linkResetAt = new Date();
    guest.sharedAt = undefined; // the new link hasn't been sent yet
    await guest.save();
    res.json({ success: true, guest: toOwnerJSON(guest) });
}

// POST /api/invitations/:id/guests/:guestId/mark-shared — called when the couple copies or WhatsApps a link.
// We can't know whether they actually pressed Send, so the UI calls it "Shared", not "Delivered".
async function markGuestShared(req, res) {
    const invitation = await findOwned(req);
    const guest = await findOwnedGuest(req, invitation);
    guest.sharedAt = new Date();
    await guest.save();
    res.json({ success: true, guest: toOwnerJSON(guest) });
}

module.exports = {
    listGuests,
    addGuest,
    updateGuest,
    removeGuest,
    resetGuestLink,
    markGuestShared,
    // shared with the bulk import
    readGuest,
    toOwnerJSON,
    MAX_GUESTS_PER_INVITATION,
};
