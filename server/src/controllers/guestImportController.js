// Bulk guest import (PRD section 6.10).
//
// The browser reads the spreadsheet and sends the rows as JSON. Everything is checked
// again here, because the browser can't be trusted (NFR-003):
//
//   POST /api/invitations/:id/guests/import
//   { rows: [{ row, name, email, phone, notes, cardType?, action? }], dryRun: true|false, cardType?: "online"|"physical" }
//
// Card type, per guest: online (a personal link) or physical (a printed card; they reply with the
// QR code). Each row's `cardType` is the file's Card type cell ("Online", "Physical", "Paper"…);
// an empty cell uses the request's `cardType` — the package's usual type, or what the couple chose
// for a file without that column. Packages without QR are all online; Printed Cards alone all
// physical. Physical-card guests get no phone number, and two of them can't have the same name,
// because they find themselves by name.
//
// dryRun: true  → nothing is saved; returns each row's problems, duplicates and the action
//                 that would be taken. Used for the preview/review screens.
// dryRun: false → applies the import and returns a summary.
//
// Actions per row:
//   add      – create a new guest (default for clean rows)
//   update   – fill in contact details/notes on the matching existing guest
//   skip     – leave this row out (default for duplicates)
//   exclude  – leave this row out (forced for rows with errors)
// Importing never sends invitations or messages.

const mongoose = require("mongoose");
const Guest = require("../models/Guest");
const AppError = require("../utils/AppError");
const { findOwned } = require("./invitationController");
const { readGuest, canonicalGroup, requireFeature, MAX_GUESTS_PER_INVITATION, guestLimitMessage } = require("./guestController");
const { limitsFor } = require("../utils/packages");
const { newGuestToken } = require("../utils/guestToken");
const qrNames = require("../utils/qrNames");

const MAX_ROWS = 1000;
const ACTIONS = ["add", "update", "skip", "exclude"];

const nameKey = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
// Compare phones by their last 9 digits so 0771234567 and +94771234567 match
const phoneKey = (s) => (s || "").replace(/\D/g, "").slice(-9);

// What an "update" would change on a guest already on the list: only details the file has and
// the list doesn't (or has differently). Blank cells never clear anything.
const CHANGE_FIELDS = [
    ["displayName", "Name on invitation"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["group", "Group"],
    ["notes", "Notes"],
];
const same = (field, a, b) => (field === "phone" ? phoneKey(a) === phoneKey(b) : field === "group" ? nameKey(a) === nameKey(b) : (a || "").trim() === (b || "").trim());

function changesFor(guest, values, cardType) {
    const changes = [];
    for (const [field, label] of CHANGE_FIELDS) {
        const to = values[field];
        if (to && !same(field, guest[field], to)) changes.push({ field, label, from: guest[field] || "", to });
    }
    if ((guest.cardType || "online") !== cardType) changes.push({ field: "cardType", label: "Card", from: guest.cardType || "online", to: cardType });
    return changes;
}

// The Card type column: "Online" / "Physical" in the couple's words. "" = left empty, null = not understood.
const ONLINE_WORDS = ["online", "online card", "link", "whatsapp", "e-card", "ecard", "digital", "ඔන්ලයින්", "ஆன்லைன்"];
const PHYSICAL_WORDS = ["physical", "physical card", "paper", "paper card", "printed", "printed card", "print", "card", "qr", "කාඩ්පත", "අච්චු", "அட்டை"];
function readCardType(value) {
    const v = String(value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
    if (!v) return "";
    if (ONLINE_WORDS.includes(v)) return "online";
    if (PHYSICAL_WORDS.includes(v)) return "physical";
    return null;
}
const CARD_NAME = { online: "an online card", physical: "a physical card" };

// cards: which card types the package allows ("both", "online" or "physical");
// defaultCard: what an empty Card type cell (or a file without the column) means
function analyse(rows, existing, { cards = "both", defaultCard = "online" } = {}) {
    // Physical-card guests already on the list, by the name they'd type on the QR page
    const physicalByName = new Map();
    for (const g of existing) if (g.cardType === "physical") physicalByName.set(qrNames.nameKey(g.name), g);
    const physicalSeen = new Map();
    // Groups already used on the list, then new ones from this file, so "office" and "Office" become one
    const groupNames = [...new Set(existing.map((g) => g.group).filter(Boolean))];
    const byPhone = new Map();
    const byEmail = new Map();
    const byName = new Map();
    for (const g of existing) {
        if (g.phone) byPhone.set(phoneKey(g.phone), g);
        if (g.email) byEmail.set(g.email, g);
        if (!byName.has(nameKey(g.name))) byName.set(nameKey(g.name), g);
    }

    const seen = { phone: new Map(), email: new Map(), name: new Map() };
    const byId = new Map(existing.map((g) => [g._id.toString(), g]));

    return rows.map((input, index) => {
        const rowNumber = Number.isInteger(input?.row) ? input.row : index + 2;

        // This row's card type: the Card type cell, or the file's default when it's empty
        const typed = readCardType(input?.cardType);
        const cardWarning =
            cards === "online" && typed === "physical"
                ? "Physical cards with a QR code are part of Premium Plus. This guest will get an online card."
                : cards === "both" && typed === null
                  ? `Card type “${String(input.cardType).slice(0, 30)}” isn’t Online or Physical — this guest will get ${CARD_NAME[defaultCard]}.`
                  : "";
        const cardType = cards === "physical" ? "physical" : cards === "online" ? "online" : typed || defaultCard;
        const physical = cardType === "physical";

        const raw = {
            name: typeof input?.name === "string" ? input.name.replace(/\s+/g, " ") : input?.name,
            displayName: typeof input?.displayName === "string" ? input.displayName.replace(/\s+/g, " ") : input?.displayName ?? "",
            email: input?.email ?? "",
            phone: physical || input?.phone == null ? "" : String(input.phone),
            notes: input?.notes ?? "",
            group: typeof input?.group === "string" ? input.group : input?.group == null ? "" : String(input.group),
        };
        const { values, errors: fieldErrors } = readGuest(raw);

        // A missing/invalid name blocks the row. A bad email or phone is dropped with a warning.
        const errors = {};
        const warnings = {};
        if (fieldErrors.name) errors.name = fieldErrors.name;
        if (fieldErrors.notes) errors.notes = fieldErrors.notes;
        if (fieldErrors.group) warnings.group = "Group is too long (40 characters at most) — the guest will be imported without it.";
        if (fieldErrors.displayName) errors.displayName = fieldErrors.displayName;
        if (fieldErrors.email) warnings.email = `Email: ${fieldErrors.email} The guest will be imported without it.`;
        if (fieldErrors.phone) warnings.phone = `Phone: ${fieldErrors.phone} The guest will be imported without it.`;
        if (cardWarning) warnings.cardType = cardWarning;

        const clean = {
            name: values.name || (typeof raw.name === "string" ? raw.name.trim() : ""),
            displayName: values.displayName || "",
            email: fieldErrors.email ? "" : values.email || "",
            phone: fieldErrors.phone ? "" : values.phone || "",
            notes: values.notes || "",
            group: fieldErrors.group ? "" : canonicalGroup(values.group || "", groupNames),
            cardType,
        };

        if (clean.group && !groupNames.includes(clean.group)) groupNames.push(clean.group);

        // Duplicates: against the existing list first, then earlier rows in this file
        let duplicate = null;
        if (!errors.name) {
            const pk = phoneKey(clean.phone);
            const match =
                (pk && byPhone.get(pk) && { guest: byPhone.get(pk), on: "phone" }) ||
                (clean.email && byEmail.get(clean.email) && { guest: byEmail.get(clean.email), on: "email" }) ||
                (byName.get(nameKey(clean.name)) && { guest: byName.get(nameKey(clean.name)), on: "name" });
            if (match) {
                duplicate = {
                    type: "existing",
                    on: match.on,
                    guestId: match.guest._id.toString(),
                    guestName: match.guest.name,
                    guestPhone: match.guest.phone,
                    guestEmail: match.guest.email,
                };
            } else {
                const inFile =
                    (pk && seen.phone.get(pk) && { row: seen.phone.get(pk), on: "phone" }) ||
                    (clean.email && seen.email.get(clean.email) && { row: seen.email.get(clean.email), on: "email" }) ||
                    (seen.name.get(nameKey(clean.name)) && { row: seen.name.get(nameKey(clean.name)), on: "name" });
                if (inFile) duplicate = { type: "file", on: inFile.on, row: inFile.row };
            }
            if (pk && !seen.phone.has(pk)) seen.phone.set(pk, rowNumber);
            if (clean.email && !seen.email.has(clean.email)) seen.email.set(clean.email, rowNumber);
            if (!seen.name.has(nameKey(clean.name))) seen.name.set(nameKey(clean.name), rowNumber);
        }

        // Physical cards: the same name as another physical-card guest can't be added
        if (physical && !errors.name) {
            const key = qrNames.nameKey(clean.name);
            const clash = physicalByName.get(key);
            if (clash) {
                duplicate = { type: "existing", on: "name", physical: true, guestId: clash._id.toString(), guestName: clash.name, guestPhone: "", guestEmail: clash.email };
            } else if (key && physicalSeen.has(key)) {
                duplicate = { type: "file", on: "name", physical: true, row: physicalSeen.get(key) };
            }
            if (key && !physicalSeen.has(key)) physicalSeen.set(key, rowNumber);
        }

        if (duplicate?.type === "existing") {
            const guest = byId.get(duplicate.guestId);
            duplicate.changes = guest ? changesFor(guest, clean, cardType) : [];
        }

        // Decide the action: the user's choice if it's allowed, otherwise a safe default
        const hasErrors = Object.keys(errors).length > 0;
        const allowed = hasErrors
            ? ["exclude"]
            : duplicate?.physical
              ? duplicate.type === "existing" ? ["skip", "update"] : ["skip"]
              : duplicate?.type === "existing" ? ["skip", "update", "add"] : duplicate ? ["skip", "add"] : ["add", "exclude"];
        const requested = ACTIONS.includes(input?.action) ? input.action : null;
        const action = requested && allowed.includes(requested) ? requested : allowed[0];

        return { row: rowNumber, values: clean, errors, warnings, duplicate, allowedActions: allowed, action };
    });
}

function summarise(analysed) {
    const s = { total: analysed.length, valid: 0, invalid: 0, duplicates: 0, warnings: 0, add: 0, update: 0, skip: 0, addOnline: 0, addPhysical: 0 };
    for (const r of analysed) {
        if (Object.keys(r.errors).length) s.invalid += 1;
        else s.valid += 1;
        if (r.duplicate) s.duplicates += 1;
        if (Object.keys(r.warnings).length) s.warnings += 1;
        if (r.action === "add") {
            s.add += 1;
            if (r.values.cardType === "physical") s.addPhysical += 1;
            else s.addOnline += 1;
        } else if (r.action === "update") s.update += 1;
        else s.skip += 1; // skip + exclude
    }
    return s;
}

async function importGuests(req, res) {
    const invitation = await findOwned(req);
    requireFeature(limitsFor(invitation, req.user), "import", "Importing guests from Excel or CSV is part of Premium and above.");
    const { rows, dryRun } = req.body || {};
    // Card types: each row's Card type cell, or `cardType` (the file's default: the package's usual
    // type, or what the couple chose for a file without the column). Printed Cards alone: all physical.
    const limits = limitsFor(invitation, req.user);
    const cards = limits.onlineCards === false ? "physical" : limits.qrRsvp ? "both" : "online";
    const usual = limits.plan === "printed" ? "physical" : "online";
    let cardType = req.body?.cardType ?? usual;
    if (!["online", "physical"].includes(cardType)) throw new AppError(400, "Choose online or physical cards.");
    if (cardType === "physical" && cards === "online") requireFeature(limits, "qrRsvp", "Physical cards with a QR code are part of Premium Plus and Signature.");
    if (cards !== "both") cardType = cards;

    if (!Array.isArray(rows) || rows.length === 0) throw new AppError(400, "The file has no guest rows to import.");
    if (rows.length > MAX_ROWS) throw new AppError(400, `Please import up to ${MAX_ROWS} rows at a time. Split larger lists into several files.`);

    const existing = await Guest.find({ invitation: invitation._id, owner: req.user._id }).select("name displayName email phone notes group cardType");
    const analysed = analyse(rows, existing, { cards, defaultCard: cardType });
    const summary = summarise(analysed);

    const { guests: planLimit, planName } = limitsFor(invitation, req.user);
    const limit = Math.min(planLimit, MAX_GUESTS_PER_INVITATION);
    // How the file fits the package. A check (dryRun) can ask to see this instead of an error,
    // so the couple sees how many guests are new and can leave some out; a real import never goes over.
    const room = Math.max(0, limit - existing.length);
    const fit = { limit, planName, existing: existing.length, adding: summary.add, room, over: existing.length + summary.add > limit };
    if (fit.over && !(dryRun !== false && req.body?.showLimit === true)) {
        throw new AppError(
            403,
            `This would bring your list to ${existing.length + summary.add} guests. ${guestLimitMessage(planName, limit)}`,
            undefined,
            "guest_limit"
        );
    }

    if (dryRun !== false) {
        return res.json({ success: true, dryRun: true, cardType, summary, fit, rows: analysed });
    }

    // ---- Apply ----
    const toAdd = analysed.filter((r) => r.action === "add");
    const toUpdate = analysed.filter((r) => r.action === "update");
    const existingById = new Map(existing.map((g) => [g._id.toString(), g]));

    // IDs are chosen up front so that, if saving fails halfway, we know exactly what to remove
    const newDocs = toAdd.map((r) => {
        const { tokenHash, tokenEncrypted } = newGuestToken();
        return {
            _id: new mongoose.Types.ObjectId(),
            ...r.values,
            invitation: invitation._id,
            owner: req.user._id,
            tokenHash,
            tokenEncrypted,
        };
    });
    const originals = toUpdate
        .map((r) => existingById.get(r.duplicate.guestId))
        .filter(Boolean)
        .map((g) => ({ _id: g._id, displayName: g.displayName, phone: g.phone, email: g.email, notes: g.notes, group: g.group, cardType: g.cardType || "online" }));

    let added = 0;
    try {
        if (newDocs.length) added = (await Guest.insertMany(newDocs, { ordered: true })).length;

        for (const r of toUpdate) {
            const guest = existingById.get(r.duplicate.guestId);
            if (!guest) continue;
            // Only fill in what the file adds — never blank out details the couple already has
            if (r.values.phone) guest.phone = r.values.phone;
            if (r.values.email) guest.email = r.values.email;
            if (r.values.notes) guest.notes = r.values.notes;
            if (r.values.displayName) guest.displayName = r.values.displayName;
            if (r.values.group) guest.group = r.values.group;
            // The guest moves to this row's card type (physical cards have no phone)
            guest.cardType = r.values.cardType;
            if (r.values.cardType === "physical") guest.phone = "";
            await guest.save();
        }
    } catch (err) {
        // Undo everything so the list isn't left half-imported
        await Guest.deleteMany({ _id: { $in: newDocs.map((d) => d._id) } }).catch(() => {});
        for (const o of originals) {
            await Guest.updateOne({ _id: o._id }, { $set: { displayName: o.displayName || "", phone: o.phone, email: o.email, notes: o.notes, group: o.group || "", cardType: o.cardType } }).catch(() => {});
        }
        console.error("[guest import] failed:", err.message);
        throw new AppError(
            500,
            "We couldn't finish the import, so nothing new was added. Please try again.",
            undefined,
            "import_failed"
        );
    }

    res.json({
        success: true,
        dryRun: false,
        summary: { ...summary, added, updated: originals.length },
        cardType,
        rows: analysed,
    });
}

module.exports = { importGuests, MAX_ROWS };
