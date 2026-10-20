const mongoose = require("mongoose");
const Invitation = require("../models/Invitation");
const Template = require("../models/Template");
const Guest = require("../models/Guest");
const AppError = require("../utils/AppError");

// Fields a couple may change through the API. Anything else in the request body is ignored,
// so nobody can change `owner`, `status`, etc. by sending extra fields.
const EDITABLE = {
    partnerOne: { max: 60 },
    partnerTwo: { max: 60 },
    hostLine: { max: 200 },
    partnerOneParents: { max: 200 },
    partnerTwoParents: { max: 200 },
    inviteLine: { max: 200 },
    message: { max: 600 },
    eventDate: { pattern: /^\d{4}-\d{2}-\d{2}$/, label: "a date" },
    eventTime: { pattern: /^\d{2}:\d{2}$/, label: "a time" },
    endTime: { pattern: /^\d{2}:\d{2}$/, label: "a time" },
    venueName: { max: 120 },
    address: { max: 250 },
    mapUrl: { max: 500, url: true },
    dressCode: { max: 200 },
    rsvpDeadline: { pattern: /^\d{4}-\d{2}-\d{2}$/, label: "a date" },
    language: { oneOf: Template.LANGUAGES },
    // Wedding, engagement or homecoming: decides the standard wording
    eventType: { oneOf: Template.COUPLE_OCCASIONS },
    shareMessage: { max: 500 },
    blessing: { max: 140 },
    musicTrack: { max: 60, pattern: /^[a-z0-9-]+$/, label: "a track id" },
};

function isValidDate(s) {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

// Pick and check the editable fields from a request body.
function readChanges(body = {}, current = {}) {
    const changes = {};
    const errors = {};

    for (const [field, rule] of Object.entries(EDITABLE)) {
        if (!(field in body)) continue;
        const raw = body[field];
        if (raw !== null && typeof raw !== "string") {
            errors[field] = "Must be text.";
            continue;
        }
        const value = (raw ?? "").trim();

        if (rule.max && value.length > rule.max) errors[field] = `Must be ${rule.max} characters or fewer.`;
        else if (value && rule.pattern && !rule.pattern.test(value)) errors[field] = `Must be ${rule.label}.`;
        else if (value && rule.pattern && rule.label === "a date" && !isValidDate(value)) errors[field] = "Not a real date.";
        else if (value && rule.url && !/^https?:\/\/\S+$/i.test(value)) errors[field] = "Must be a link starting with http:// or https://";
        else if (rule.oneOf && !rule.oneOf.includes(value)) errors[field] = `Must be one of: ${rule.oneOf.join(", ")}.`;
        else changes[field] = value;
    }

    // Ceremonies: a list of { name, date, time, venue, note }
    if ("ceremonies" in body) {
        const list = body.ceremonies;
        if (!Array.isArray(list)) errors.ceremonies = "Must be a list.";
        else if (list.length > 8) errors.ceremonies = "Up to 8 ceremonies.";
        else {
            const cleaned = [];
            list.forEach((c, i) => {
                const txt = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : null);
                const item = { name: txt(c?.name), date: txt(c?.date), time: txt(c?.time), venue: txt(c?.venue), note: txt(c?.note) };
                const label = `Ceremony ${i + 1}`;
                if (Object.values(item).some((v) => v === null)) errors.ceremonies = `${label}: must be text.`;
                else if (!item.name) errors.ceremonies = `${label}: give it a name, or remove it.`;
                else if (item.name.length > 60) errors.ceremonies = `${label}: name must be 60 characters or fewer.`;
                else if (item.date && (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !isValidDate(item.date))) errors.ceremonies = `${label}: not a real date.`;
                else if (item.time && !/^\d{2}:\d{2}$/.test(item.time)) errors.ceremonies = `${label}: must be a time.`;
                else if (item.venue.length > 120) errors.ceremonies = `${label}: venue must be 120 characters or fewer.`;
                else if (item.note.length > 200) errors.ceremonies = `${label}: note must be 200 characters or fewer.`;
                else cleaned.push(item);
            });
            if (!errors.ceremonies) changes.ceremonies = cleaned;
        }
    }

    // The RSVP deadline can't be after the event
    const eventDate = changes.eventDate ?? current.eventDate;
    const deadline = changes.rsvpDeadline ?? current.rsvpDeadline;
    if (eventDate && deadline && deadline > eventDate && !errors.rsvpDeadline) {
        errors.rsvpDeadline = "The RSVP deadline must be on or before the event date.";
    }

    return { changes, errors };
}

// Loads an invitation only if it belongs to the signed-in user (FR-003).
// Someone else's ID gives the same 404 as a missing one, so IDs can't be probed.
async function findOwned(req) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new AppError(404, "Invitation not found.");
    const invitation = await Invitation.findOne({ _id: id, owner: req.user._id, status: { $ne: "archived" } }).populate(
        "template",
        "name tier"
    );
    if (!invitation) throw new AppError(404, "Invitation not found.");
    return invitation;
}

// GET /api/invitations — the signed-in user's invitations, with guest/RSVP counts
async function listInvitations(req, res) {
    const [invitations, guests] = await Promise.all([
        Invitation.find({ owner: req.user._id, status: { $ne: "archived" } })
            .populate("template", "name tier")
            .sort({ updatedAt: -1 }),
        Guest.find({ owner: req.user._id }).select("invitation rsvpStatus"),
    ]);

    const counts = {};
    for (const g of guests) {
        const c = (counts[String(g.invitation)] ??= { total: 0, attending: 0, not_attending: 0, pending: 0 });
        c.total += 1;
        c[g.rsvpStatus] += 1;
    }

    res.json({
        success: true,
        invitations: invitations.map((i) => ({
            ...i.toOwnerJSON(),
            guestCounts: counts[String(i._id)] || { total: 0, attending: 0, not_attending: 0, pending: 0 },
        })),
    });
}

// POST /api/invitations  { templateKey, language? } — start a draft from a published template (FR-020)
async function createInvitation(req, res) {
    const templateKey = typeof req.body?.templateKey === "string" ? req.body.templateKey : "";
    const template = await Template.findOne({ key: templateKey, status: "published" });
    if (!template) throw new AppError(400, "Please choose an available template.");

    const { changes, errors } = readChanges(req.body);
    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);
    if (changes.language && !template.languageSupport.includes(changes.language)) {
        throw new AppError(400, "This template does not support that language.");
    }

    const invitation = await Invitation.create({
        ...changes,
        owner: req.user._id,
        template: template._id,
        templateKey: template.key,
        templateVersion: template.version,
        // The couple's chosen occasion; a couple design defaults to a wedding
        eventType: changes.eventType || (Template.COUPLE_OCCASIONS.includes(template.eventType) ? template.eventType : "wedding"),
        status: "draft",
    });
    invitation.template = template;

    res.status(201).json({ success: true, invitation: invitation.toOwnerJSON() });
}

// GET /api/invitations/:id
async function getInvitation(req, res) {
    const invitation = await findOwned(req);
    res.json({ success: true, invitation: invitation.toOwnerJSON() });
}

// PATCH /api/invitations/:id — save draft changes (FR-021, FR-025, FR-027)
// Also accepts { templateKey } to switch to another published design.
async function updateInvitation(req, res) {
    const invitation = await findOwned(req);

    const { changes, errors } = readChanges(req.body, invitation);

    let newTemplate = null;
    if (typeof req.body?.templateKey === "string" && req.body.templateKey !== invitation.templateKey) {
        newTemplate = await Template.findOne({ key: req.body.templateKey, status: "published" });
        if (!newTemplate) errors.templateKey = "That template is not available.";
    }

    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);

    Object.assign(invitation, changes);
    if (newTemplate) {
        invitation.template = newTemplate;
        invitation.templateKey = newTemplate.key;
        invitation.templateVersion = newTemplate.version;
    }

    // A published invitation must stay complete — don't let edits remove required details
    if (invitation.status === "published") {
        const missing = invitation.missingForPublish();
        if (missing.length) {
            throw new AppError(
                400,
                "This invitation is live, so these details can't be left empty.",
                Object.fromEntries(missing.map((f) => [f, "Required while the invitation is published."]))
            );
        }
    }

    await invitation.save();
    res.json({ success: true, invitation: invitation.toOwnerJSON() });
}

// POST /api/invitations/:id/publish (FR-026, BR-002)
async function publishInvitation(req, res) {
    const invitation = await findOwned(req);
    const missing = invitation.missingForPublish();
    if (missing.length) {
        throw new AppError(
            400,
            "Please complete the required details before publishing.",
            Object.fromEntries(missing.map((f) => [f, "Required to publish."]))
        );
    }
    const today = new Date().toISOString().slice(0, 10);
    if (!invitation.isFreeDesign() && invitation.rsvpDeadline < today) {
        throw new AppError(400, "The RSVP deadline has already passed. Choose a later date before publishing.", {
            rsvpDeadline: "Must be today or later.",
        });
    }
    invitation.status = "published";
    invitation.publishedAt ??= new Date();
    await invitation.save();
    res.json({ success: true, invitation: invitation.toOwnerJSON() });
}

// POST /api/invitations/:id/unpublish — guest links stop working until it's published again
async function unpublishInvitation(req, res) {
    const invitation = await findOwned(req);
    if (invitation.status === "published") {
        invitation.status = "unpublished";
        await invitation.save();
    }
    res.json({ success: true, invitation: invitation.toOwnerJSON() });
}

// DELETE /api/invitations/:id — archives rather than erasing, so it can be recovered
async function archiveInvitation(req, res) {
    const invitation = await findOwned(req);
    invitation.status = "archived";
    await invitation.save();
    res.json({ success: true, message: "Invitation archived." });
}

module.exports = {
    findOwned,
    listInvitations,
    createInvitation,
    getInvitation,
    updateInvitation,
    publishInvitation,
    unpublishInvitation,
    archiveInvitation,
};
