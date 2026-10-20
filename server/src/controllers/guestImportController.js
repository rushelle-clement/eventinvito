// Bulk guest import (PRD section 6.10).
//
// The browser reads the spreadsheet and sends the rows as JSON. Everything is checked
// again here, because the browser can't be trusted (NFR-003):
//
//   POST /api/invitations/:id/guests/import
//   { rows: [{ row, name, email, phone, notes, action? }], dryRun: true|false }
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
const { readGuest, MAX_GUESTS_PER_INVITATION } = require("./guestController");
const { newGuestToken } = require("../utils/guestToken");

const MAX_ROWS = 1000;
const ACTIONS = ["add", "update", "skip", "exclude"];

const nameKey = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
// Compare phones by their last 9 digits so 0771234567 and +94771234567 match
const phoneKey = (s) => (s || "").replace(/\D/g, "").slice(-9);

function analyse(rows, existing) {
    const byPhone = new Map();
    const byEmail = new Map();
    const byName = new Map();
    for (const g of existing) {
        if (g.phone) byPhone.set(phoneKey(g.phone), g);
        if (g.email) byEmail.set(g.email, g);
        if (!byName.has(nameKey(g.name))) byName.set(nameKey(g.name), g);
    }

    const seen = { phone: new Map(), email: new Map(), name: new Map() };

    return rows.map((input, index) => {
        const rowNumber = Number.isInteger(input?.row) ? input.row : index + 2;
        const raw = {
            name: typeof input?.name === "string" ? input.name.replace(/\s+/g, " ") : input?.name,
            displayName: typeof input?.displayName === "string" ? input.displayName.replace(/\s+/g, " ") : input?.displayName ?? "",
            email: input?.email ?? "",
            phone: input?.phone == null ? "" : String(input.phone),
            notes: input?.notes ?? "",
        };
        const { values, errors: fieldErrors } = readGuest(raw);

        // A missing/invalid name blocks the row. A bad email or phone is dropped with a warning.
        const errors = {};
        const warnings = {};
        if (fieldErrors.name) errors.name = fieldErrors.name;
        if (fieldErrors.notes) errors.notes = fieldErrors.notes;
        if (fieldErrors.displayName) errors.displayName = fieldErrors.displayName;
        if (fieldErrors.email) warnings.email = "Not a valid email — the guest will be imported without it.";
        if (fieldErrors.phone) warnings.phone = "Not a valid phone number — the guest will be imported without it.";

        const clean = {
            name: values.name || (typeof raw.name === "string" ? raw.name.trim() : ""),
            displayName: values.displayName || "",
            email: fieldErrors.email ? "" : values.email || "",
            phone: fieldErrors.phone ? "" : values.phone || "",
            notes: values.notes || "",
        };

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

        // Decide the action: the user's choice if it's allowed, otherwise a safe default
        const hasErrors = Object.keys(errors).length > 0;
        const allowed = hasErrors ? ["exclude"] : duplicate?.type === "existing" ? ["skip", "update", "add"] : duplicate ? ["skip", "add"] : ["add", "exclude"];
        const requested = ACTIONS.includes(input?.action) ? input.action : null;
        const action = requested && allowed.includes(requested) ? requested : allowed[0];

        return { row: rowNumber, values: clean, errors, warnings, duplicate, allowedActions: allowed, action };
    });
}

function summarise(analysed) {
    const s = { total: analysed.length, valid: 0, invalid: 0, duplicates: 0, warnings: 0, add: 0, update: 0, skip: 0 };
    for (const r of analysed) {
        if (Object.keys(r.errors).length) s.invalid += 1;
        else s.valid += 1;
        if (r.duplicate) s.duplicates += 1;
        if (Object.keys(r.warnings).length) s.warnings += 1;
        if (r.action === "add") s.add += 1;
        else if (r.action === "update") s.update += 1;
        else s.skip += 1; // skip + exclude
    }
    return s;
}

async function importGuests(req, res) {
    const invitation = await findOwned(req);
    const { rows, dryRun } = req.body || {};

    if (!Array.isArray(rows) || rows.length === 0) throw new AppError(400, "The file has no guest rows to import.");
    if (rows.length > MAX_ROWS) throw new AppError(400, `Please import up to ${MAX_ROWS} rows at a time. Split larger lists into several files.`);

    const existing = await Guest.find({ invitation: invitation._id, owner: req.user._id }).select("name displayName email phone notes");
    const analysed = analyse(rows, existing);
    const summary = summarise(analysed);

    if (existing.length + summary.add > MAX_GUESTS_PER_INVITATION) {
        throw new AppError(
            400,
            `This would bring your list to ${existing.length + summary.add} guests. An invitation can have up to ${MAX_GUESTS_PER_INVITATION}.`
        );
    }

    if (dryRun !== false) {
        return res.json({ success: true, dryRun: true, summary, rows: analysed });
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
        .map((g) => ({ _id: g._id, displayName: g.displayName, phone: g.phone, email: g.email, notes: g.notes }));

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
            await guest.save();
        }
    } catch (err) {
        // Undo everything so the list isn't left half-imported
        await Guest.deleteMany({ _id: { $in: newDocs.map((d) => d._id) } }).catch(() => {});
        for (const o of originals) {
            await Guest.updateOne({ _id: o._id }, { $set: { displayName: o.displayName || "", phone: o.phone, email: o.email, notes: o.notes } }).catch(() => {});
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
        rows: analysed,
    });
}

module.exports = { importGuests, MAX_ROWS };
