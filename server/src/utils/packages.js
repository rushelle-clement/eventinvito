// The packages (shown on the home page) and what each allows, per invitation.
// An account's package is set on the admin page when a couple pays; publishing still uses a
// free card or a Premium credit (see invitationController.publishInvitation).

const PLANS = ["free", "premium", "plus", "signature"];

// What each package includes (shown on the home page, components/Packages.jsx):
//  guests / photos   – how many per invitation
//  ownMusic          – upload their own background song
//  export            – download the guest list and replies as Excel
//  agenda            – the wedding day agenda ("day plan")
//  rsvpDeadline      – a reply-by date (Simple Card replies stay open until the event)
//  openDetails       – each guest's opened / not opened status and first-opened date
//                      (Simple Card shows only the total opened count)
//  visitDetails      – each guest's last visit and number of visits
//  import            – bulk import from Excel or CSV
//  groups            – guest groups and filtering by group
//  groupStats        – the per-group counts panel (guests, replies, opens)
//  bulkGroups        – tick many guests and set their group at once
//  qrRsvp            – one QR code for printed cards; physical-card guests reply through it
//  onlineCards       – online invitations with personal links (all but Printed Cards)
//
// "printed" (Printed Cards) isn't an account package: it's an invitation published with a
// printed-cards credit — QR replies only, every guest has a physical card.
const LIMITS = {
    free: { guests: 50, photos: 0, ownMusic: false, export: false, agenda: false, rsvpDeadline: false, openDetails: false, visitDetails: false, import: false, groups: false, groupStats: false, bulkGroups: false, qrRsvp: false, onlineCards: true },
    premium: { guests: 150, photos: 3, ownMusic: false, export: false, agenda: false, rsvpDeadline: true, openDetails: true, visitDetails: false, import: true, groups: true, groupStats: true, bulkGroups: true, qrRsvp: false, onlineCards: true },
    plus: { guests: 300, photos: 6, ownMusic: true, export: true, agenda: true, rsvpDeadline: true, openDetails: true, visitDetails: true, import: true, groups: true, groupStats: true, bulkGroups: true, qrRsvp: true, onlineCards: true },
    printed: { guests: 150, photos: 0, ownMusic: false, export: true, agenda: false, rsvpDeadline: true, openDetails: false, visitDetails: false, import: true, groups: true, groupStats: true, bulkGroups: true, qrRsvp: true, onlineCards: false },
    signature: { guests: 500, photos: 6, ownMusic: true, export: true, agenda: true, rsvpDeadline: true, openDetails: true, visitDetails: true, import: true, groups: true, groupStats: true, bulkGroups: true, qrRsvp: true, onlineCards: true },
};

const NAMES = { free: "Simple Card", premium: "Premium", plus: "Premium Plus", signature: "Signature", printed: "Printed Cards" };

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
    if (invitation.printed) return "printed";
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
