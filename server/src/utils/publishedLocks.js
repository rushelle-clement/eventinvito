// Once an invitation has been paid for (first published), it belongs to that event:
//  • the main names (couple, birthday person, company / title) can only get small spelling fixes,
//    compared with the names it was first published with — so one card can't be turned into
//    another event step by step. An admin can allow one real change.
//  • after the event has ended its date can't be moved forward (that would reopen it for a new
//    event). An admin can allow it when the event really moved.
//  • changes to the names, date and venue after publishing are recorded for the admin page.
const AppError = require("./AppError");

const NAME_FIELDS = ["partnerOne", "partnerTwo", "celebrant", "companyName", "eventTitle"];
const LOGGED_FIELDS = [...NAME_FIELDS, "eventDate", "venueName"];
const MAX_LOG = 100;

const norm = (s) => String(s ?? "").normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();

// Letters to add, remove or swap to turn one into the other
function distance(a, b) {
    const x = Array.from(a);
    const y = Array.from(b);
    let prev = Array.from({ length: y.length + 1 }, (_, i) => i);
    for (let i = 1; i <= x.length; i++) {
        const cur = [i];
        for (let j = 1; j <= y.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
        prev = cur;
    }
    return prev[y.length];
}

// A spelling fix: up to 3 letters, and no more than about a third of the name
function isSmallFix(original, next) {
    const a = norm(original);
    const b = norm(next);
    if (a === b || !a) return true; // unchanged, or wasn't filled in when published
    const longest = Math.max(Array.from(a).length, Array.from(b).length);
    return distance(a, b) <= Math.min(3, Math.max(1, Math.floor(longest / 3)));
}

const namesOf = (invitation) => Object.fromEntries(NAME_FIELDS.map((f) => [f, invitation[f] || ""]));

const lastDate = (eventDate, ceremonies) => [eventDate, ...(ceremonies || []).map((c) => c.date)].filter(Boolean).sort().pop() || "";

// Before saving `changes`: refuse changes that would make it a different event
function checkPublishedLocks(invitation, changes, user) {
    if (!invitation.isPaid() || user?.role === "admin") return;
    const published = invitation.publishedNames || namesOf(invitation);

    if (!invitation.namesUnlocked) {
        const errors = {};
        for (const f of NAME_FIELDS) {
            if (f in changes && !isSmallFix(published[f], changes[f])) {
                errors[f] = "Names can’t be changed after publishing — small spelling fixes are fine. Contact us if you need to change it.";
            }
        }
        if (Object.keys(errors).length) {
            throw new AppError(403, "This invitation has been published, so its names can only get small spelling fixes. Contact us if you need to change a name.", errors, "names_locked");
        }
    }

    if (!invitation.datesUnlocked && invitation.hasEnded() && ("eventDate" in changes || "ceremonies" in changes)) {
        const next = lastDate(changes.eventDate ?? invitation.eventDate, changes.ceremonies ?? invitation.ceremonies);
        if (next > invitation.lastEventDate()) {
            throw new AppError(
                403,
                "This event has already taken place, so its date can’t be moved. Contact us if the event has been moved.",
                { eventDate: "The event is over. Contact us if it has been moved." },
                "event_ended"
            );
        }
    }
}

// After the changes are applied (before saving): note what changed, and use up a one-off unlock
function recordPublishedChanges(invitation, before) {
    if (!invitation.isPaid()) return;
    if (!invitation.publishedNames) invitation.publishedNames = Object.fromEntries(NAME_FIELDS.map((f) => [f, before[f] || ""]));
    const at = new Date();
    const changed = LOGGED_FIELDS.filter((f) => norm(before[f]) !== norm(invitation[f]));
    if (!changed.length) return;
    invitation.changeLog = [...(invitation.changeLog || []), ...changed.map((field) => ({ at, field, from: String(before[field] || ""), to: String(invitation[field] || "") }))].slice(-MAX_LOG);
    if (invitation.namesUnlocked && changed.some((f) => NAME_FIELDS.includes(f))) {
        invitation.namesUnlocked = false;
        invitation.publishedNames = namesOf(invitation); // the new names are the ones that stay
    }
    if (invitation.datesUnlocked && changed.includes("eventDate")) invitation.datesUnlocked = false;
}

// When it's published for the first time: the names it belongs to
function rememberPublishedNames(invitation) {
    if (!invitation.publishedNames) invitation.publishedNames = namesOf(invitation);
}

module.exports = { NAME_FIELDS, LOGGED_FIELDS, isSmallFix, checkPublishedLocks, recordPublishedChanges, rememberPublishedNames };
