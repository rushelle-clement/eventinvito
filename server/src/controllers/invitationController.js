const mongoose = require("mongoose");
const Invitation = require("../models/Invitation");
const Template = require("../models/Template");
const Guest = require("../models/Guest");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { customDesignWaiting, KEPT_FOR_CUSTOM } = require("../utils/customDesigns");

// Fields a couple may change through the API. Anything else in the request body is ignored,
// so nobody can change `owner`, `status`, etc. by sending extra fields.
const EDITABLE = {
    partnerOne: { max: 60 },
    partnerTwo: { max: 60 },
    celebrant: { max: 60 }, // birthdays
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
    eventType: { oneOf: [...Template.COUPLE_OCCASIONS, "birthday"] },
    shareMessage: { max: 500 },
    blessing: { max: 140 },
    musicTrack: { max: 60, pattern: /^[a-z0-9-]+$/, label: "a track id" },
};

function isValidDate(s) {
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s);
}

// Uses one of the account's credits ("freeCredits" or "publishCredits"); false if none are left
// The last Premium invitation of a Signature couple is kept for their custom design
async function keepForCustom(user, templateKey) {
    const waiting = await customDesignWaiting(user, templateKey);
    if (waiting) throw KEPT_FOR_CUSTOM(AppError, waiting);
}

async function takeCredit(userId, field) {
    const updated = await User.findOneAndUpdate({ _id: userId, [field]: { $gte: 1 } }, { $inc: { [field]: -1 } }, { returnDocument: "after" });
    // Accounts from before packages: using a Premium credit makes them Premium (so their package
    // stays Premium once the credit is used up)
    if (updated && field === "publishCredits" && !updated.plan) await User.updateOne({ _id: userId, plan: { $exists: false } }, { $set: { plan: "premium" } });
    return Boolean(updated);
}
const NO_CREDIT = () =>
    new AppError(403, "You've already used your free card. Choose a Premium package to publish another invitation — please contact EventInvito.", undefined, "no_credit");
const NEEDS_PREMIUM = () =>
    new AppError(
        403,
        "Animated designs are part of the Premium packages. Contact EventInvito to upgrade, or switch to a free design to publish with your free card.",
        undefined,
        "needs_premium"
    );

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

    // Birthdays: the age they're turning (optional), a whole number from 0 to 120
    if ("age" in body) {
        const raw = body.age;
        if (raw === null || raw === "") changes.age = null;
        else {
            const n = typeof raw === "number" ? raw : typeof raw === "string" && /^\d{1,3}$/.test(raw.trim()) ? Number(raw) : NaN;
            if (!Number.isInteger(n) || n < 0 || n > 120) errors.age = "Must be a whole number from 0 to 120.";
            else changes.age = n;
        }
    }

    // A birthday stays a birthday; couple designs choose between wedding, engagement and homecoming
    if (current.eventType === "birthday" && "eventType" in changes) delete changes.eventType;
    else if (changes.eventType === "birthday") errors.eventType = "Choose a birthday design to make a birthday invitation.";

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
            ...i.toOwnerJSON(req.user),
            guestCounts: counts[String(i._id)] || { total: 0, attending: 0, not_attending: 0, pending: 0 },
        })),
    });
}

// POST /api/invitations  { templateKey, language? } — start a draft from a published template (FR-020)
async function createInvitation(req, res) {
    const templateKey = typeof req.body?.templateKey === "string" ? req.body.templateKey : "";
    const template = await Template.findOne({ key: templateKey, status: "published" });
    if (!template || !template.isVisibleTo(req.user)) throw new AppError(400, "Please choose an available template.");

    const { changes, errors } = readChanges(req.body, { eventType: template.eventType === "birthday" ? "birthday" : "" });
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
        // Birthday designs make birthday invitations; a couple design uses the chosen occasion
        // (wedding by default)
        eventType:
            template.eventType === "birthday"
                ? "birthday"
                : changes.eventType || (Template.COUPLE_OCCASIONS.includes(template.eventType) ? template.eventType : "wedding"),
        status: "draft",
    });
    invitation.template = template;

    res.status(201).json({ success: true, invitation: invitation.toOwnerJSON(req.user) });
}

// GET /api/invitations/:id
async function getInvitation(req, res) {
    const invitation = await findOwned(req);
    res.json({ success: true, invitation: invitation.toOwnerJSON(req.user) });
}

// PATCH /api/invitations/:id — save draft changes (FR-021, FR-025, FR-027)
// Also accepts { templateKey } to switch to another published design.
async function updateInvitation(req, res) {
    const invitation = await findOwned(req);

    const { changes, errors } = readChanges(req.body, invitation);

    let newTemplate = null;
    if (typeof req.body?.templateKey === "string" && req.body.templateKey !== invitation.templateKey) {
        newTemplate = await Template.findOne({ key: req.body.templateKey, status: "published" });
        if (!newTemplate || !newTemplate.isVisibleTo(req.user)) errors.templateKey = "That template is not available.";
        // Birthday and couple invitations have different details, so they keep to their own designs
        else if ((newTemplate.eventType === "birthday") !== invitation.isBirthday()) {
            errors.templateKey = invitation.isBirthday() ? "Choose another birthday design." : "Choose a wedding, engagement or homecoming design.";
        }
    }

    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);

    // A live invitation published as a free card can only switch to an animated design with a premium credit
    const upgrade = Boolean(newTemplate && newTemplate.tier !== "free" && invitation.status === "published" && invitation.paidKind() === "free");
    if (upgrade && !((req.user.publishCredits || 0) > 0)) throw NEEDS_PREMIUM(); // checked before anything changes
    if (upgrade) await keepForCustom(req.user, newTemplate.key);

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

    if (upgrade) {
        if (!(await takeCredit(req.user._id, "publishCredits"))) throw NEEDS_PREMIUM();
        invitation.creditKind = "premium";
    }
    try {
        await invitation.save();
    } catch (err) {
        if (upgrade) await User.updateOne({ _id: req.user._id }, { $inc: { publishCredits: 1 } });
        throw err;
    }
    const owner = upgrade ? await User.findById(req.user._id) : null;
    res.json({ success: true, invitation: invitation.toOwnerJSON(owner || req.user), ...(owner && { user: owner.toPublicJSON() }) });
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
    if (invitation.hasEnded()) {
        throw new AppError(400, "This event has already taken place, so the invitation can't be published. Change the event date if it has moved.", {
            eventDate: "The event is over.",
        });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (!invitation.isFreeDesign() && invitation.rsvpDeadline < today) {
        throw new AppError(400, "The RSVP deadline has already passed. Choose a later date before publishing.", {
            rsvpDeadline: "Must be today or later.",
        });
    }

    // Publishing a new invitation uses one of the account's allowances (one payment = one card):
    //  • a free design uses the free card (or, if that's gone, a premium credit);
    //  • an animated design always needs a premium credit.
    // A paid invitation can be unpublished and published again for free. One published as a free
    // card that has since switched to an animated design needs a premium credit to go live.
    const kind = invitation.paidKind();
    const needsPremium = (!kind && !(invitation.isFreeDesign() && req.user.freeCredits > 0)) || (kind === "free" && !invitation.isFreeDesign());
    if (needsPremium) await keepForCustom(req.user, invitation.templateKey);
    let charged = null;
    if (!kind) {
        if (invitation.isFreeDesign()) charged = (await takeCredit(req.user._id, "freeCredits")) ? "free" : null;
        if (!charged) charged = (await takeCredit(req.user._id, "publishCredits")) ? "premium" : null;
        if (!charged) throw invitation.isFreeDesign() ? NO_CREDIT() : NEEDS_PREMIUM();
    } else if (kind === "free" && !invitation.isFreeDesign()) {
        charged = (await takeCredit(req.user._id, "publishCredits")) ? "premium" : null;
        if (!charged) throw NEEDS_PREMIUM();
    }
    if (charged) {
        invitation.creditUsed = true;
        invitation.creditKind = charged;
    }
    invitation.status = "published";
    invitation.publishedAt ??= new Date();
    try {
        await invitation.save();
    } catch (err) {
        // Give the credit back if the invitation couldn't be saved
        if (charged) await User.updateOne({ _id: req.user._id }, { $inc: { [charged === "free" ? "freeCredits" : "publishCredits"]: 1 } });
        throw err;
    }
    const owner = await User.findById(req.user._id);
    res.json({ success: true, invitation: invitation.toOwnerJSON(owner || req.user), user: owner?.toPublicJSON() });
}

// POST /api/invitations/:id/unpublish — guest links stop working until it's published again
async function unpublishInvitation(req, res) {
    const invitation = await findOwned(req);
    if (invitation.status === "published") {
        invitation.status = "unpublished";
        await invitation.save();
    }
    res.json({ success: true, invitation: invitation.toOwnerJSON(req.user) });
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
