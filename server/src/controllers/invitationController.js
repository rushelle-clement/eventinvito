const crypto = require("node:crypto");
const mongoose = require("mongoose");
const Invitation = require("../models/Invitation");
const Template = require("../models/Template");
const Guest = require("../models/Guest");
const { LOGGED_FIELDS, checkPublishedLocks, recordPublishedChanges, rememberPublishedNames } = require("../utils/publishedLocks");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { customDesignWaiting, KEPT_FOR_CUSTOM } = require("../utils/customDesigns");
const { limitsFor } = require("../utils/packages");
const { MAX_AGENDA } = require("../models/Invitation");

// Fields a couple may change through the API. Anything else in the request body is ignored,
// so nobody can change `owner`, `status`, etc. by sending extra fields.
const EDITABLE = {
    partnerOne: { max: 60 },
    partnerTwo: { max: 60 },
    celebrant: { max: 60 }, // birthdays
    companyName: { max: 80 }, // corporate events
    eventTitle: { max: 100 },
    logoStyle: { oneOf: ["original", "mono"] },
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
    eventType: { oneOf: [...Template.COUPLE_OCCASIONS, "birthday", "corporate", "christmas"] },
    shareMessage: { max: 500 },
    blessing: { max: 140 },
    musicTrack: { max: 60, pattern: /^[a-z0-9-]+$/, label: "a track id" },
};

// Event types set by the design, which the couple can't switch
const FIXED_TYPES = ["birthday", "corporate", "christmas"];
// Designs keep to their own kind of event: couples, birthdays, corporate events or Christmas parties
const familyOf = (eventType) => (FIXED_TYPES.includes(eventType) ? eventType : "couple");

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
    const changesOrCurrent = (field) => changes[field] ?? body[field] ?? current[field];

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

    // Corporate anniversaries: how many years (optional), a whole number from 1 to 500
    if ("milestone" in body) {
        const raw = body.milestone;
        if (raw === null || raw === "") changes.milestone = null;
        else {
            const n = typeof raw === "number" ? raw : typeof raw === "string" && /^\d{1,3}$/.test(raw.trim()) ? Number(raw) : NaN;
            if (!Number.isInteger(n) || n < 1 || n > 500) errors.milestone = "Must be a whole number from 1 to 500.";
            else changes.milestone = n;
        }
    }

    // A birthday stays a birthday and a corporate event stays corporate (the design decides);
    // couple designs choose between wedding, engagement and homecoming
    if (FIXED_TYPES.includes(current.eventType) && "eventType" in changes) delete changes.eventType;
    else if (changes.eventType === "birthday") errors.eventType = "Choose a birthday design to make a birthday invitation.";
    else if (changes.eventType === "corporate") errors.eventType = "Choose a corporate design to make a corporate invitation.";
    else if (changes.eventType === "christmas") errors.eventType = "Choose a Christmas design to make a Christmas invitation.";

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

    // The day plan: a list of { date, time, endTime, title, place, note }, kept in time order
    if ("agenda" in body) {
        const list = body.agenda;
        if (!Array.isArray(list)) errors.agenda = "Must be a list.";
        else if (list.length > MAX_AGENDA) errors.agenda = `Up to ${MAX_AGENDA} items.`;
        else {
            const cleaned = [];
            list.forEach((a, i) => {
                if (errors.agenda) return;
                const txt = (v) => (typeof v === "string" ? v.trim() : v == null ? "" : null);
                const item = { date: txt(a?.date), time: txt(a?.time), endTime: txt(a?.endTime), title: txt(a?.title), place: txt(a?.place), note: txt(a?.note) };
                const label = `Item ${i + 1}`;
                if (Object.values(item).some((v) => v === null)) errors.agenda = `${label}: must be text.`;
                else if (!item.title) errors.agenda = `${label}: say what happens, or remove it.`;
                else if (item.title.length > 80) errors.agenda = `${label}: must be 80 characters or fewer.`;
                else if (!/^\d{2}:\d{2}$/.test(item.time)) errors.agenda = `${label}: add a start time.`;
                else if (item.endTime && !/^\d{2}:\d{2}$/.test(item.endTime)) errors.agenda = `${label}: the end must be a time.`;
                else if (item.date && (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !isValidDate(item.date))) errors.agenda = `${label}: not a real date.`;
                else if (item.place.length > 120) errors.agenda = `${label}: the place must be 120 characters or fewer.`;
                else if (item.note.length > 200) errors.agenda = `${label}: the note must be 200 characters or fewer.`;
                else cleaned.push(item);
            });
            // In time order (items without a date are on the event day)
            const day = (a) => a.date || changesOrCurrent("eventDate") || "";
            if (!errors.agenda) changes.agenda = cleaned.sort((a, b) => `${day(a)} ${a.time}`.localeCompare(`${day(b)} ${b.time}`));
        }
    }
    if ("agendaVisible" in body) {
        if (typeof body.agendaVisible !== "boolean") errors.agendaVisible = "Must be true or false.";
        else changes.agendaVisible = body.agendaVisible;
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
        Guest.find({ owner: req.user._id }).select("invitation rsvpStatus openedAt rsvpVia"),
    ]);

    const counts = {};
    for (const g of guests) {
        const c = (counts[String(g.invitation)] ??= { total: 0, attending: 0, not_attending: 0, pending: 0, opened: 0, openedNoReply: 0, viaQr: 0 });
        c.total += 1;
        c[g.rsvpStatus] += 1;
        if (g.rsvpVia === "qr" && g.rsvpStatus !== "pending") c.viaQr += 1;
        if (g.openedAt) {
            c.opened += 1;
            if (g.rsvpStatus === "pending") c.openedNoReply += 1;
        }
    }

    res.json({
        success: true,
        invitations: invitations.map((i) => ({
            ...i.toOwnerJSON(req.user),
            guestCounts: counts[String(i._id)] || { total: 0, attending: 0, not_attending: 0, pending: 0, opened: 0, openedNoReply: 0, viaQr: 0 },
        })),
    });
}

// POST /api/invitations  { templateKey, language? } — start a draft from a published template (FR-020)
// POST /api/invitations  { printed: true, eventType } — a Printed Cards invitation: no online design,
// guests reply with the QR code on their paper card
async function createInvitation(req, res) {
    if (req.body?.printed === true) return createPrintedInvitation(req, res);
    const templateKey = typeof req.body?.templateKey === "string" ? req.body.templateKey : "";
    const template = await Template.findOne({ key: templateKey, status: "published" });
    if (!template || !template.isVisibleTo(req.user)) throw new AppError(400, "Please choose an available template.");

    const { changes, errors } = readChanges(req.body, { eventType: FIXED_TYPES.includes(template.eventType) ? template.eventType : "" });
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
        eventType: FIXED_TYPES.includes(template.eventType)
            ? template.eventType
            : changes.eventType || (Template.COUPLE_OCCASIONS.includes(template.eventType) ? template.eventType : "wedding"),
        status: "draft",
    });
    invitation.template = template;

    res.status(201).json({ success: true, invitation: invitation.toOwnerJSON(req.user) });
}

// Printed cards still keep a design (a free one for the event type) so the invitation can be
// moved to online cards later; guests never see it. The QR code is switched on from the start.
async function createPrintedInvitation(req, res) {
    // Printed Cards is a package the admin turns on (a Printed Cards credit). Premium Plus and
    // Signature already have a QR code on their own invitations, so they never need it.
    if (req.user.role !== "admin") {
        if (["plus", "signature"].includes(req.user.plan)) {
            throw new AppError(
                403,
                "Your package already includes a QR code. Open your invitation, mark paper-card guests as “Physical card” and use its QR code page.",
                undefined,
                "has_qr"
            );
        }
        const customer = (req.user.printedCredits || 0) > 0 || req.user.printedMember || (await Invitation.exists({ owner: req.user._id, printed: true, creditKind: "printed" }));
        if (!customer) throw NEEDS_PRINTED();
    }
    const eventType = req.body?.eventType;
    if (!Template.EVENT_TYPES.includes(eventType)) throw new AppError(400, "Choose the type of event.", { eventType: "Choose the type of event." });
    const designTypes = FIXED_TYPES.includes(eventType) ? [eventType] : Template.COUPLE_OCCASIONS;
    const candidates = await Template.find({ status: "published", eventType: { $in: designTypes } }).sort({ tier: 1, createdAt: 1 });
    const template = candidates.find((t) => t.tier === "free" && t.isVisibleTo(req.user)) || candidates.find((t) => t.isVisibleTo(req.user));
    if (!template) throw new AppError(400, "Printed cards aren't available for this type of event yet.");

    const { changes, errors } = readChanges({ ...req.body, eventType }, { eventType: FIXED_TYPES.includes(eventType) ? eventType : "" });
    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);
    delete changes.printed;

    const invitation = await Invitation.create({
        ...changes,
        eventType,
        owner: req.user._id,
        template: template._id,
        templateKey: template.key,
        templateVersion: template.version,
        printed: true,
        qrEnabled: true,
        qrCode: crypto.randomBytes(8).toString("base64url"),
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
    // (printed cards may also "choose" the design they were given, to move to online cards)
    if (typeof req.body?.templateKey === "string" && (req.body.templateKey !== invitation.templateKey || invitation.printed)) {
        newTemplate = await Template.findOne({ key: req.body.templateKey, status: "published" });
        if (!newTemplate || !newTemplate.isVisibleTo(req.user)) errors.templateKey = "That template is not available.";
        // Couple, birthday and corporate invitations have different details, so they keep to their own designs
        else if (familyOf(newTemplate.eventType) !== familyOf(invitation.eventType)) {
            errors.templateKey = invitation.isBirthday()
                ? "Choose another birthday design."
                : invitation.isCorporate()
                  ? "Choose another corporate design."
                  : invitation.isChristmas()
                    ? "Choose another Christmas design."
                    : "Choose a wedding, engagement or homecoming design.";
        }
    }

    // Printed Cards: the free online card for some guests, on or off
    let onlineCard;
    if ("onlineCard" in (req.body || {})) {
        if (typeof req.body.onlineCard !== "boolean") errors.onlineCard = "Must be true or false.";
        else if (!invitation.printed) errors.onlineCard = "Only for printed cards.";
        else onlineCard = req.body.onlineCard;
    }

    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);

    if (onlineCard === false && invitation.onlineCard) {
        const online = await Guest.countDocuments({ invitation: invitation._id, cardType: { $ne: "physical" } });
        if (online) {
            throw new AppError(
                400,
                `${online} guest${online === 1 ? " has" : "s have"} the online card. Change them to a physical card first, then switch it off.`,
                { onlineCard: "Some guests still have the online card." },
                "online_guests"
            );
        }
    }

    // The day plan is part of Premium Plus and Signature. Clearing it or switching it off is always allowed.
    const addsAgenda = (changes.agenda && changes.agenda.length > 0) || changes.agendaVisible === true;
    // The day plan is for weddings (and engagements and homecomings) and corporate events, not birthdays
    if (addsAgenda && (invitation.isBirthday() || invitation.isChristmas())) {
        throw new AppError(400, "The day plan is available for wedding and corporate invitations.", { agenda: "Not available for birthday invitations." });
    }
    if (addsAgenda && !limitsFor(invitation, req.user).agenda) {
        throw new AppError(
            403,
            "The day plan is part of Premium Plus and Signature. Contact EventInvito to upgrade your package.",
            undefined,
            "needs_plus"
        );
    }

    // Printed cards moving to online invitations (e.g. after upgrading to Premium Plus) by choosing
    // a design. Once paid for, that needs a Premium credit, like publishing a new online invitation.
    // (choosing one of the free designs only changes the free online card's design: it stays printed)
    const toOnline = Boolean(newTemplate && invitation.printed && newTemplate.tier !== "free");
    const paidPrinted = toOnline && invitation.paidKind() === "printed";
    // A live invitation published as a free card can only switch to an animated design with a premium credit
    const upgrade = paidPrinted || Boolean(newTemplate && newTemplate.tier !== "free" && invitation.status === "published" && invitation.paidKind() === "free");
    if (upgrade && !((req.user.publishCredits || 0) > 0)) throw paidPrinted ? NEEDS_ONLINE() : NEEDS_PREMIUM(); // checked before anything changes
    if (upgrade) await keepForCustom(req.user, newTemplate.key);

    // Published already: it stays the same event (names, and an ended event's date)
    checkPublishedLocks(invitation, changes, req.user);
    const before = Object.fromEntries(LOGGED_FIELDS.map((f) => [f, invitation[f]]));

    Object.assign(invitation, changes);
    recordPublishedChanges(invitation, before);
    if (onlineCard !== undefined) invitation.onlineCard = onlineCard;
    if (toOnline) invitation.printed = false; // guests keep their physical cards and the QR code keeps working
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
        if (!(await takeCredit(req.user._id, "publishCredits"))) throw paidPrinted ? NEEDS_ONLINE() : NEEDS_PREMIUM();
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
    // Printed Cards use their own credit; once paid, it can be unpublished and published again freely
    if (invitation.printed) return publishPrinted(req, res, invitation);

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
    rememberPublishedNames(invitation);
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

const NEEDS_ONLINE = () =>
    new AppError(
        403,
        "Adding online invitations to printed cards is part of Premium Plus. Contact EventInvito to upgrade — you only pay the difference.",
        undefined,
        "needs_premium"
    );
const NEEDS_PRINTED = () =>
    new AppError(
        403,
        "Publishing printed cards with a QR code uses the Printed Cards package. Contact EventInvito to get it.",
        undefined,
        "needs_printed"
    );

async function publishPrinted(req, res, invitation) {
    const charged = invitation.paidKind() ? null : (await takeCredit(req.user._id, "printedCredits")) ? "printed" : null;
    if (!invitation.paidKind() && !charged) throw NEEDS_PRINTED();
    if (charged) {
        invitation.creditUsed = true;
        invitation.creditKind = charged;
        await User.updateOne({ _id: req.user._id }, { $set: { printedMember: true } }); // keeps the badge after the credit is used
    }
    invitation.status = "published";
    invitation.publishedAt ??= new Date();
    rememberPublishedNames(invitation);
    try {
        await invitation.save();
    } catch (err) {
        if (charged) await User.updateOne({ _id: req.user._id }, { $inc: { printedCredits: 1 } });
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
