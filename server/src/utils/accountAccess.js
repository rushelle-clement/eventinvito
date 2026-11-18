// Whether an account may sign in.
//  • "disabled": an admin turned it off.
//  • "ended": only when LOCK_AFTER_EVENT=true — every invitation it paid for has ended and it
//    has no credits left, so the account closes with its invitation (admins can keep it open).
//    Off by default: accounts stay open; once their credit is used they simply can't publish
//    another invitation without paying.
//  • "active": everything else. Admin accounts are always active.

const Invitation = require("../models/Invitation");
const AppError = require("./AppError");

function lockAfterEvent() {
    return process.env.LOCK_AFTER_EVENT === "true";
}

async function accountStatus(user, paidInvitations) {
    if (user.disabled) return "disabled";
    if (user.role === "admin" || user.keepAccess || !lockAfterEvent()) return "active";
    if ((user.publishCredits || 0) > 0 || (user.printedCredits || 0) > 0) return "active";
    const paid =
        paidInvitations ||
        (await Invitation.find({ owner: user._id, $or: [{ creditUsed: true }, { publishedAt: { $ne: null } }] }).select(
            "eventDate ceremonies timeZone creditUsed publishedAt"
        ));
    if (!paid.length) return "active";
    return paid.every((i) => i.hasEnded()) ? "ended" : "active";
}

const DISABLED = "This account has been turned off. Please contact EventInvito if you need access.";
const ENDED = "Your invitation has ended, so this account is now closed. Thank you for celebrating with EventInvito! Please contact us if you need access again.";

// Throws the right sign-in error for a closed account
async function assertCanSignIn(user) {
    const status = await accountStatus(user);
    if (status === "disabled") throw new AppError(403, DISABLED, undefined, "account_disabled");
    if (status === "ended") throw new AppError(403, ENDED, undefined, "account_ended");
}

module.exports = { accountStatus, assertCanSignIn };
