// The packages (shown on the home page) and what each allows, per invitation.
// An account's package is set on the admin page when a couple pays; publishing still uses a
// free card or a Premium credit (see invitationController.publishInvitation).

const PLANS = ["free", "premium", "plus", "signature"];

const LIMITS = {
    free: { guests: 50, photos: 0, ownMusic: false, export: false },
    premium: { guests: 150, photos: 6, ownMusic: false, export: false },
    plus: { guests: 300, photos: 12, ownMusic: true, export: true },
    signature: { guests: 500, photos: 12, ownMusic: true, export: true },
};

const NAMES = { free: "Simple Card", premium: "Premium", plus: "Premium Plus", signature: "Signature" };

const rank = (plan) => PLANS.indexOf(plan);
const atLeast = (plan, min) => (rank(plan) >= rank(min) ? plan : min);

// The account's package. Accounts from before packages existed: Premium if they have
// Premium credits to use, otherwise free.
function accountPlan(user) {
    if (user?.role === "admin") return "signature";
    if (PLANS.includes(user?.plan)) return user.plan;
    return (user?.publishCredits || 0) > 0 ? "premium" : "free";
}

// The package an invitation works under:
//  • published with the free card → Simple Card limits;
//  • published with a Premium credit → the account's package (at least Premium);
//  • a draft → what publishing it would use: a free design with a free card left (or on a
//    free account) is a Simple Card; anything else follows the account's package.
function invitationPlan(invitation, user) {
    const account = accountPlan(user);
    const kind = invitation.paidKind();
    if (kind === "free") return "free";
    if (kind === "premium") return atLeast(account, "premium");
    if (invitation.isFreeDesign() && ((user?.freeCredits || 0) > 0 || account === "free")) return "free";
    return atLeast(account, "premium");
}

function limitsFor(invitation, user) {
    const plan = invitationPlan(invitation, user);
    return { plan, planName: NAMES[plan], ...LIMITS[plan] };
}

module.exports = { PLANS, LIMITS, NAMES, accountPlan, invitationPlan, limitsFor };
