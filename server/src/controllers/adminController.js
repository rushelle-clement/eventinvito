// The admin page: create accounts, give publish credits, turn accounts off or keep them open.
// Every route here needs an admin account (see routes/adminRoutes.js).

const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const Template = require("../models/Template");
const { releaseFinishedDesigns } = require("../utils/customDesigns");
const AppError = require("../utils/AppError");
const { accountStatus } = require("../utils/accountAccess");
const { checkNewAccount, createAccount, str } = require("./authController");
const { PLANS } = require("../utils/packages");

// Premium credits that come with each package: one invitation each (Signature's is its custom design)
const PLAN_CREDITS = { free: 0, premium: 1, plus: 1, signature: 1 };

function planFrom(value) {
    if (!PLANS.includes(value)) throw new AppError(400, "Choose a package: free, premium, plus or signature.", { plan: "Choose a package." });
    return value;
}

const MAX_CREDITS = 50;

function creditsFrom(value) {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 0 || n > MAX_CREDITS) {
        throw new AppError(400, `Credits must be a whole number from 0 to ${MAX_CREDITS}.`, { credits: `0 to ${MAX_CREDITS}.` });
    }
    return n;
}

function invitationSummary(i) {
    return {
        id: i._id.toString(),
        names: i.title(),
        status: i.status,
        paid: i.isPaid(),
        paidKind: i.paidKind(),
        printed: Boolean(i.printed),
        eventDate: i.eventDate,
        onlineUntil: i.onlineUntil(),
        ended: i.hasEnded(),
        // After publishing: what changed (newest first), and the one-off unlocks
        changes: (i.changeLog || []).slice(-20).reverse().map((c) => ({ at: c.at, field: c.field, from: c.from, to: c.to })),
        namesUnlocked: Boolean(i.namesUnlocked),
        datesUnlocked: Boolean(i.datesUnlocked),
    };
}

// GET /api/admin/invitations?q=&page=&limit=&changed=1 — published (paid) invitations, newest
// first, with what changed after publishing. q matches the names or the owner's name / email.
async function listInvitations(req, res) {
    const q = str(req.query?.q).slice(0, 100);
    const limit = PAGE_SIZES.includes(Number(req.query?.limit)) ? Number(req.query.limit) : 20;
    const filter = { status: { $ne: "archived" }, $or: [{ creditUsed: true }, { publishedAt: { $ne: null } }] };
    if (req.query?.changed === "1") filter["changeLog.0"] = { $exists: true };
    if (q) {
        const rx = { $regex: escapeRegex(q), $options: "i" };
        const owners = await User.find({ $or: [{ name: rx }, { email: rx }] }).select("_id");
        filter.$and = [{ $or: [{ owner: { $in: owners.map((u) => u._id) } }, ...["partnerOne", "partnerTwo", "celebrant", "companyName", "eventTitle"].map((f) => ({ [f]: rx }))] }];
    }
    const total = await Invitation.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(pages, Math.max(1, parseInt(req.query?.page, 10) || 1));
    const list = await Invitation.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    const owners = new Map((await User.find({ _id: { $in: list.map((i) => i.owner) } }).select("name email")).map((u) => [String(u._id), u]));
    res.json({
        success: true,
        invitations: list.map((i) => {
            const o = owners.get(String(i.owner));
            return { ...invitationSummary(i), changeCount: (i.changeLog || []).length, owner: o ? { name: o.name, email: o.email } : null };
        }),
        page,
        pages,
        total,
        limit,
    });
}

// PATCH /api/admin/invitations/:id  { namesUnlocked?, datesUnlocked? }
// Lets a couple make one real name change, or move an ended event's date (it locks again after)
async function updateInvitationLocks(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, "Invitation not found.");
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) throw new AppError(404, "Invitation not found.");
    for (const key of ["namesUnlocked", "datesUnlocked"]) {
        if (key in (req.body || {})) {
            if (typeof req.body[key] !== "boolean") throw new AppError(400, `${key} must be true or false.`);
            invitation[key] = req.body[key];
        }
    }
    await invitation.save();
    res.json({ success: true, invitation: invitationSummary(invitation) });
}

async function accountJSON(user, invitations, customs = []) {
    const mine = invitations.filter((i) => String(i.owner) === String(user._id));
    const email = String(user.email).toLowerCase();
    const paid = mine.filter((i) => i.isPaid());
    return {
        ...user.toPublicJSON(),
        disabled: user.disabled,
        freeCredits: user.freeCredits || 0,
        keepAccess: user.keepAccess,
        status: await accountStatus(user, paid),
        drafts: mine.filter((i) => !i.isPaid()).length,
        customDesigns: customs.filter((t) => t.reservedFor === email && !t.releasedAt).map((t) => ({ key: t.key, name: t.name })),
        invitations: paid.map(invitationSummary),
    };
}

const PAGE_SIZES = [10, 20, 50];

// GET /api/admin/users?q=amaya&page=2&limit=20&waiting=1 — newest first, one page at a time.
// waiting=1: only accounts whose chosen package is waiting for payment
async function listAccounts(req, res) {
    const q = str(req.query?.q).slice(0, 100);
    const filter = q ? { $or: [{ name: { $regex: escapeRegex(q), $options: "i" } }, { email: { $regex: escapeRegex(q), $options: "i" } }] } : {};
    if (req.query?.waiting === "1") filter.requestedPlan = { $in: ["premium", "plus", "signature", "printed"] };
    const limit = PAGE_SIZES.includes(Number(req.query?.limit)) ? Number(req.query.limit) : 20;
    const total = await User.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(pages, Math.max(1, parseInt(req.query?.page, 10) || 1));
    const users = await User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    const invitations = await Invitation.find({ owner: { $in: users.map((u) => u._id) }, status: { $ne: "archived" } }).select(
        "owner partnerOne partnerTwo celebrant age companyName eventTitle eventType status eventDate ceremonies timeZone creditUsed creditKind publishedAt printed changeLog namesUnlocked datesUnlocked"
    );
    const customs = await Template.find({ reservedFor: { $in: users.map((u) => String(u.email).toLowerCase()) } });
    res.json({
        success: true,
        users: await Promise.all(users.map((u) => accountJSON(u, invitations, customs))),
        page,
        pages,
        total,
        limit,
        waiting: await User.countDocuments({ requestedPlan: { $in: ["premium", "plus", "signature", "printed"] } }),
        lockAfterEvent: process.env.LOCK_AFTER_EVENT === "true", // accounts close after their event
    });
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// POST /api/admin/users  { name, email, password, plan, credits? }
// Credits default to the package's: Premium 1, Premium Plus and Signature 2.
async function createUserAccount(req, res) {
    const name = str(req.body?.name);
    const email = str(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    checkNewAccount({ name, email, password });
    const plan = planFrom(req.body?.plan ?? "premium");
    const credits = creditsFrom(req.body?.credits ?? PLAN_CREDITS[plan]);
    const printedCredits = "printedCredits" in (req.body || {}) ? creditsFrom(req.body.printedCredits) : 0;
    // Only Simple Card comes with the free card: a paid package has its own invitation (free designs
    // use it too), and Printed Cards are paper only
    const freeCredits = "freeCredits" in (req.body || {}) ? creditsFrom(req.body.freeCredits) : plan === "free" && !printedCredits ? 1 : 0;
    const user = await createAccount({ name, email, password, publishCredits: credits, freeCredits, printedCredits, plan });
    res.status(201).json({ success: true, user: await accountJSON(user, []) });
}

// PATCH /api/admin/users/:id  { plan?, credits?, freeCredits?, printedCredits?, disabled?, keepAccess?, password?, name? }
async function updateUserAccount(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, "Account not found.");
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, "Account not found.");
    const self = String(user._id) === String(req.user._id);
    const body = req.body || {};

    const wasPaid = PLANS.includes(user.plan) && user.plan !== "free";
    if ("plan" in body) user.plan = planFrom(body.plan);
    // From free to a paid package: the package's invitation replaces the free card (unless the
    // free card is set in the same request)
    if (!wasPaid && user.plan && user.plan !== "free" && !("freeCredits" in body)) user.freeCredits = 0;
    // Giving a paid package or Printed Cards by hand also settles the package they asked for
    if ((user.plan && user.plan !== "free") || ("printedCredits" in body && Number(body.printedCredits) > 0)) user.requestedPlan = undefined;
    if ("credits" in body) user.publishCredits = creditsFrom(body.credits);
    if ("freeCredits" in body) user.freeCredits = creditsFrom(body.freeCredits);
    if ("printedCredits" in body) {
        const firstPrinted = !user.printedMember && !(user.printedCredits > 0);
        user.printedCredits = creditsFrom(body.printedCredits);
        if (user.printedCredits > 0) {
            // Becoming a Printed Cards account: paper cards only, so the unused free card goes
            // (unless the free card is set in the same request)
            if (firstPrinted && !("freeCredits" in body)) user.freeCredits = 0;
            user.printedMember = true;
        }
    }
    if ("disabled" in body) {
        if (typeof body.disabled !== "boolean") throw new AppError(400, "disabled must be true or false.");
        if (self && body.disabled) throw new AppError(400, "You can't turn off your own account.");
        user.disabled = body.disabled;
    }
    if ("keepAccess" in body) {
        if (typeof body.keepAccess !== "boolean") throw new AppError(400, "keepAccess must be true or false.");
        user.keepAccess = body.keepAccess;
    }
    if ("name" in body) {
        const name = str(body.name);
        if (!name || name.length > 100) throw new AppError(400, "Name must be 1 to 100 characters.", { name: "1 to 100 characters." });
        user.name = name;
    }
    if ("password" in body) {
        const password = typeof body.password === "string" ? body.password : "";
        if (password.length < 8 || password.length > 128) throw new AppError(400, "Password must be 8 to 128 characters.", { password: "8 to 128 characters." });
        user.passwordHash = await bcrypt.hash(password, 12);
        user.passwordChangedAt = new Date(Date.now() - 1000); // signs out the account's other sessions
    }
    await user.save();

    const invitations = await Invitation.find({ owner: user._id, status: { $ne: "archived" } }).select(
        "owner partnerOne partnerTwo celebrant age companyName eventTitle eventType status eventDate ceremonies timeZone creditUsed creditKind publishedAt printed changeLog namesUnlocked datesUnlocked"
    );
    const customs = await Template.find({ reservedFor: String(user.email).toLowerCase() });
    res.json({ success: true, user: await accountJSON(user, invitations, customs) });
}

// POST /api/admin/users/:id/activate — the couple paid for the package they chose at sign-up:
// set it and add its credit (Premium / Premium Plus / Signature: 1 Premium invitation; Printed
// Cards: 1 printed-cards invitation, and no free online card)
async function activateAccount(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, "Account not found.");
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError(404, "Account not found.");
    const wanted = user.requestedPlan;
    if (!wanted) throw new AppError(400, "This account isn't waiting for a package.", undefined, "not_waiting");
    if (wanted === "printed") {
        user.printedCredits = (user.printedCredits || 0) + 1;
        user.printedMember = true;
        user.freeCredits = 0;
    } else {
        user.plan = wanted;
        user.publishCredits = (user.publishCredits || 0) + PLAN_CREDITS[wanted];
        user.freeCredits = 0; // one invitation with the package: free designs use it too
    }
    user.requestedPlan = undefined;
    await user.save();
    const invitations = await Invitation.find({ owner: user._id, status: { $ne: "archived" } }).select(
        "owner partnerOne partnerTwo celebrant age companyName eventTitle eventType status eventDate ceremonies timeZone creditUsed creditKind publishedAt printed changeLog namesUnlocked datesUnlocked"
    );
    const customs = await Template.find({ reservedFor: String(user.email).toLowerCase() });
    res.json({ success: true, user: await accountJSON(user, invitations, customs) });
}

// ---- Signature custom designs ----

async function customDesignJSON(t) {
    const owner = t.reservedFor ? await User.findOne({ email: t.reservedFor }) : null;
    const used = owner ? await Invitation.find({ owner: owner._id, templateKey: t.key, status: { $ne: "archived" } }) : [];
    const live = used.find((i) => i.isPaid());
    return {
        key: t.key,
        name: t.name,
        tier: t.tier,
        status: t.releasedAt ? "collection" : t.reservedFor ? "private" : "unassigned",
        reservedFor: t.reservedFor || "",
        ownerName: owner?.name || "",
        releasedAt: t.releasedAt || null,
        // how the couple is using it
        invitation: live ? { status: live.status, ended: live.hasEnded(), onlineUntil: live.onlineUntil() } : used.length ? { status: "draft" } : null,
    };
}

// GET /api/admin/custom-designs — designs made for one couple (custom: true), newest first
async function listCustomDesigns(req, res) {
    await releaseFinishedDesigns({ force: true });
    const templates = await Template.find({ $or: [{ custom: true }, { reservedFor: { $exists: true, $nin: [null, ""] } }] }).sort({ createdAt: -1 });
    res.json({ success: true, designs: await Promise.all(templates.map(customDesignJSON)) });
}

// PATCH /api/admin/custom-designs/:key  { reservedFor: "email" | "" } or { release: true }
//  • reservedFor: give the design to that couple's account (only they can see and use it)
//  • release: add it to the collection for everyone now (it also happens by itself once the
//    couple's event is over)
async function updateCustomDesign(req, res) {
    const template = await Template.findOne({ key: String(req.params.key) });
    if (!template || !(template.custom || template.reservedFor)) throw new AppError(404, "Custom design not found.");
    const body = req.body || {};

    if ("reservedFor" in body) {
        if (template.releasedAt) throw new AppError(400, "This design is already in the collection.");
        const email = str(body.reservedFor).toLowerCase();
        if (email) {
            const owner = await User.findOne({ email });
            if (!owner) throw new AppError(400, "No account uses this email. Ask the couple to sign up first, or create their account above.", { reservedFor: "No account with this email." });
            if (owner.role === "admin") throw new AppError(400, "Choose a couple's account, not an admin account.", { reservedFor: "This is an admin account." });
        }
        template.reservedFor = email || undefined;
    }
    if (body.release === true) {
        template.releasedAt = new Date();
    }
    await template.save();
    res.json({ success: true, design: await customDesignJSON(template) });
}

// A readable random password for new accounts: 3 groups of letters/digits, e.g. "k7dp-qm4x-2hwa"
function suggestPassword() {
    const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
    const bytes = crypto.randomBytes(12);
    let out = "";
    for (let i = 0; i < 12; i++) out += alphabet[bytes[i] % alphabet.length] + (i % 4 === 3 && i < 11 ? "-" : "");
    return out;
}

// GET /api/admin/password-suggestion
function passwordSuggestion(req, res) {
    res.json({ success: true, password: suggestPassword() });
}

module.exports = { activateAccount, listInvitations, updateInvitationLocks, PLAN_CREDITS, listCustomDesigns, updateCustomDesign, listAccounts, createUserAccount, updateUserAccount, passwordSuggestion };
