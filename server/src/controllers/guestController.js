// Guest list management for the invitation owner (FR-040 – FR-046).
// Every route first loads the invitation with findOwned(), so a user can only
// touch guests of their own invitations (FR-003).

const mongoose = require("mongoose");
const Guest = require("../models/Guest");
const AppError = require("../utils/AppError");
const { limitsFor } = require("../utils/packages");

// "Simple Card includes up to 50 guests per invitation. Upgrade to add more."
function guestLimitMessage(planName, limit) {
    return `${planName} includes up to ${limit} guests per invitation.${limit < 500 ? " Upgrade your package to add more." : ""}`;
}
const { findOwned } = require("./invitationController");
const { newGuestToken, decrypt, guestLink } = require("../utils/guestToken");
const { nameKey } = require("../utils/qrNames");
const { CARD_TYPES } = require("../models/Guest");

const MAX_GUESTS_PER_INVITATION = 2000;
const FULL = { openDetails: true, visitDetails: true };

// A package feature the invitation doesn't include → 403 with code "needs_plan"
function requireFeature(limits, feature, message) {
    if (!limits[feature]) throw new AppError(403, `${message} Your package is ${limits.planName}.`, undefined, "needs_plan");
}
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
    if ("cardType" in body) {
        if (!CARD_TYPES.includes(body.cardType)) errors.cardType = "Choose online or physical card.";
        else out.cardType = body.cardType;
    }
    if ("group" in body) {
        const group = text(body.group);
        if (group === null) errors.group = "Must be text.";
        else if (group.length > MAX_GROUP_LENGTH) errors.group = `Group must be ${MAX_GROUP_LENGTH} characters or fewer.`;
        else out.group = cleanGroup(group);
    }
    return { values: out, errors };
}

// "  bride's   FAMILY " stays as typed apart from spaces; matching groups ignores case,
// so the couple doesn't end up with "Office" and "office" as two groups.
const MAX_GROUP_LENGTH = 40;
const cleanGroup = (s) => String(s || "").replace(/\s+/g, " ").trim();
const groupKey = (s) => cleanGroup(s).toLowerCase();

// Use the spelling of a group the invitation already has, if one matches
function canonicalGroup(group, existingGroups) {
    if (!group) return "";
    const match = existingGroups.find((g) => groupKey(g) === groupKey(group));
    return match || group;
}

async function groupsOf(invitationId, ownerId) {
    const rows = await Guest.find({ invitation: invitationId, owner: ownerId, group: { $nin: ["", null] } }).select("group").lean();
    return [...new Set(rows.map((g) => g.group))];
}

// `limits` (the invitation's package) decides how much opening detail the couple sees:
// Simple Card only the total (in the summary), Premium who opened and when first,
// Premium Plus and Signature also the last visit and the number of visits.
function toOwnerJSON(guest, limits = FULL) {
    const token = decrypt(guest.tokenEncrypted);
    return {
        id: guest._id.toString(),
        name: guest.name,
        displayName: guest.displayName || "",
        email: guest.email,
        phone: guest.phone,
        notes: guest.notes,
        group: guest.group || "",
        cardType: guest.cardType || "online",
        link: token ? guestLink(token) : null, // null → the couple should reset the link
        rsvpStatus: guest.rsvpStatus,
        respondedAt: guest.respondedAt,
        rsvpVia: guest.rsvpVia || "",
        sharedAt: guest.sharedAt,
        openedAt: limits.openDetails ? guest.openedAt || null : null,
        lastOpenedAt: limits.visitDetails ? guest.lastOpenedAt || null : null,
        openCount: limits.visitDetails ? guest.openCount || 0 : 0,
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
    const limits = limitsFor(invitation, req.user);
    const guests = await Guest.find({ invitation: invitation._id, owner: req.user._id }).sort({ name: 1 });
    const summary = { total: guests.length, attending: 0, not_attending: 0, pending: 0, shared: 0, opened: 0, openedNoReply: 0 };
    // The same counts for online-card and printed-card guests, and how many replied by QR
    const card = () => ({ total: 0, attending: 0, not_attending: 0, pending: 0 });
    summary.byCard = { online: card(), physical: card() };
    summary.viaQr = 0;
    const groups = new Map(); // per group: invited, replies and opens
    for (const g of guests) {
        const key = groupKey(g.group);
        if (!groups.has(key)) groups.set(key, { name: g.group || "", total: 0, attending: 0, not_attending: 0, pending: 0, opened: 0 });
        const row = groups.get(key);
        row.total += 1;
        row[g.rsvpStatus] += 1;
        if (g.openedAt) row.opened += 1;

        summary[g.rsvpStatus] += 1;
        const byCard = summary.byCard[g.cardType === "physical" ? "physical" : "online"];
        byCard.total += 1;
        byCard[g.rsvpStatus] += 1;
        if (g.rsvpVia === "qr" && g.rsvpStatus !== "pending") summary.viaQr += 1;
        if (g.sharedAt) summary.shared += 1;
        if (g.openedAt) {
            summary.opened += 1;
            if (g.rsvpStatus === "pending") summary.openedNoReply += 1;
        }
    }
    if (!limits.openDetails) delete summary.openedNoReply; // "opened, no reply" is a Premium filter
    // Largest groups first; guests without a group last
    // The per-group counts are part of Premium Plus and Signature
    if (limits.groupStats) summary.groups = [...groups.values()].sort((a, b) => (!a.name) - (!b.name) || b.total - a.total || a.name.localeCompare(b.name));
    res.json({ success: true, invitation: invitation.toOwnerJSON(req.user), summary, guests: guests.map((g) => toOwnerJSON(g, limits)) });
}

// Printed-card guests find themselves by name on the QR page, so two of them can't share a name.
// Returns the other guest with the same name, if there is one.
async function physicalNameClash(invitationId, name, exceptId) {
    const key = nameKey(name);
    if (!key) return null;
    const others = await Guest.find({ invitation: invitationId, cardType: "physical", ...(exceptId && { _id: { $ne: exceptId } }) }).select("name").lean();
    return others.find((g) => nameKey(g.name) === key) || null;
}

const clashError = (name) =>
    new AppError(400, "Please fix the highlighted fields.", {
        name: `“${name}” already has a physical card. Add something to tell them apart, e.g. “${name} (Kandy)”.`,
    });

// Printed-card guests: QR replies are a Premium Plus feature, and they get no phone number
// (their invitation isn't sent by WhatsApp).
function applyCardType(values, limits) {
    // Printed Cards: every guest has a physical card
    if (limits.onlineCards === false) values.cardType = "physical";
    if (values.cardType === "physical") {
        requireFeature(limits, "qrRsvp", "Physical cards with a QR code are part of Premium Plus and Signature.");
        values.phone = "";
    }
}

// POST /api/invitations/:id/guests  { name, email?, phone?, notes?, group?, cardType? }
async function addGuest(req, res) {
    const invitation = await findOwned(req);
    const limits = limitsFor(invitation, req.user);
    const { values, errors } = readGuest(req.body);
    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);
    if (values.group) requireFeature(limits, "groups", "Guest groups are part of Premium and above.");
    applyCardType(values, limits);
    if (values.cardType === "physical" && (await physicalNameClash(invitation._id, values.name))) throw clashError(values.name);

    const count = await Guest.countDocuments({ invitation: invitation._id });
    const { guests: limit, planName } = limitsFor(invitation, req.user);
    if (count >= Math.min(limit, MAX_GUESTS_PER_INVITATION)) {
        throw new AppError(403, guestLimitMessage(planName, limit), undefined, "guest_limit");
    }

    if (values.group) values.group = canonicalGroup(values.group, await groupsOf(invitation._id, req.user._id));

    const { tokenHash, tokenEncrypted } = newGuestToken();
    const guest = await Guest.create({
        ...values,
        invitation: invitation._id,
        owner: req.user._id,
        tokenHash,
        tokenEncrypted,
    });
    res.status(201).json({ success: true, guest: toOwnerJSON(guest, limits) });
}

// PATCH /api/invitations/:id/guests/:guestId
async function updateGuest(req, res) {
    const invitation = await findOwned(req);
    const guest = await findOwnedGuest(req, invitation);
    const limits = limitsFor(invitation, req.user);
    const { values, errors } = readGuest(req.body, { partial: true });
    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);
    if (values.group) requireFeature(limits, "groups", "Guest groups are part of Premium and above.");
    if (values.group) values.group = canonicalGroup(values.group, await groupsOf(invitation._id, req.user._id));
    if (limits.onlineCards === false || (values.cardType && values.cardType !== guest.cardType)) applyCardType(values, limits);
    else if ((values.cardType || guest.cardType) === "physical") values.phone = "";
    const physical = (values.cardType || guest.cardType) === "physical";
    const name = values.name || guest.name;
    if (physical && (values.name || values.cardType) && (await physicalNameClash(invitation._id, name, guest._id))) throw clashError(name);
    Object.assign(guest, values);
    await guest.save();
    res.json({ success: true, guest: toOwnerJSON(guest, limits) });
}

// POST /api/invitations/:id/guests/group  { guestIds: [...], group }
// Puts many guests in a group at once (or takes them out of their group with group "").
async function setGuestsGroup(req, res) {
    const invitation = await findOwned(req);
    requireFeature(limitsFor(invitation, req.user), "bulkGroups", "Setting the group for many guests at once is part of Premium Plus and Signature.");
    const { guestIds } = req.body || {};
    if (!Array.isArray(guestIds) || guestIds.length === 0) throw new AppError(400, "Choose at least one guest.");
    if (guestIds.length > MAX_GUESTS_PER_INVITATION) throw new AppError(400, "Too many guests in one request.");
    if (!guestIds.every((id) => typeof id === "string" && mongoose.isValidObjectId(id))) throw new AppError(400, "Some of the chosen guests weren't found.");

    const { values, errors } = readGuest({ group: req.body.group ?? "" }, { partial: true });
    if (errors.group) throw new AppError(400, errors.group, errors);
    const group = canonicalGroup(values.group, await groupsOf(invitation._id, req.user._id));

    // Only this couple's guests on this invitation are changed, whatever IDs are sent
    const result = await Guest.updateMany({ _id: { $in: guestIds }, invitation: invitation._id, owner: req.user._id }, { $set: { group } });
    res.json({ success: true, group, updated: result.modifiedCount ?? result.nModified ?? 0, matched: result.matchedCount ?? result.n ?? 0 });
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
    res.json({ success: true, guest: toOwnerJSON(guest, limitsFor(invitation, req.user)) });
}

// POST /api/invitations/:id/guests/:guestId/mark-shared — called when the couple copies or WhatsApps a link.
// We can't know whether they actually pressed Send, so the UI calls it "Shared", not "Delivered".
async function markGuestShared(req, res) {
    const invitation = await findOwned(req);
    const guest = await findOwnedGuest(req, invitation);
    guest.sharedAt = new Date();
    await guest.save();
    res.json({ success: true, guest: toOwnerJSON(guest, limitsFor(invitation, req.user)) });
}

module.exports = {
    guestLimitMessage,
    listGuests,
    addGuest,
    updateGuest,
    removeGuest,
    resetGuestLink,
    markGuestShared,
    setGuestsGroup,
    // shared with the bulk import
    readGuest,
    toOwnerJSON,
    requireFeature,
    canonicalGroup,
    groupsOf,
    MAX_GUESTS_PER_INVITATION,
};
