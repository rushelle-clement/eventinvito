// Accounts that published Printed Cards before the `printedMember` flag existed: mark them, so they
// keep their Printed Cards badge and can start more printed-card drafts. Runs when the server
// starts; it only changes accounts that still need it, so running it again does nothing.
const Invitation = require("../models/Invitation");
const User = require("../models/User");

async function markPrintedMembers() {
    const owners = await Invitation.distinct("owner", { creditKind: "printed" });
    if (!owners.length) return 0;
    const res = await User.updateMany({ _id: { $in: owners }, printedMember: { $ne: true } }, { $set: { printedMember: true } });
    return res.modifiedCount ?? res.nModified ?? 0;
}

module.exports = { markPrintedMembers };
