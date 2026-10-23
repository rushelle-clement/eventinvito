// Signature custom designs are private to the couple they were made for. Once that couple's
// event is over (the day their invitation goes offline, see Invitation.hasEnded) the design
// joins the public collection.

const Template = require("../models/Template");
const User = require("../models/User");
const Invitation = require("../models/Invitation");

const CHECK_EVERY_MS = 10 * 60 * 1000;
let lastCheck = 0;

// Releases every reserved design whose couple's invitation with it has ended.
// Cheap (there are only ever a few reserved designs) and checked at most every 10 minutes.
async function releaseFinishedDesigns({ force = false } = {}) {
    if (!force && Date.now() - lastCheck < CHECK_EVERY_MS) return;
    lastCheck = Date.now();
    const reserved = await Template.find({ reservedFor: { $exists: true, $ne: null }, releasedAt: { $exists: false } });
    for (const template of reserved) {
        if (!template.reservedFor) continue;
        const user = await User.findOne({ email: template.reservedFor });
        if (!user) continue;
        const used = await Invitation.find({ owner: user._id, templateKey: template.key, status: "published" });
        if (used.some((i) => i.hasEnded())) {
            template.releasedAt = new Date();
            await template.save();
        }
    }
}

// Signature includes a custom design plus one more Premium invitation. While the couple's custom
// design is waiting to be published, their last Premium invitation is kept for it.
// Returns the custom design's name when publishing `templateKey` would use that last one.
async function customDesignWaiting(user, templateKey) {
    if (!user?.email || (user.publishCredits || 0) > 1) return null;
    const mine = await Template.find({ reservedFor: String(user.email).toLowerCase(), releasedAt: { $exists: false } });
    for (const t of mine) {
        if (t.key === templateKey) return null; // publishing the custom design itself
        const used = await Invitation.exists({ owner: user._id, templateKey: t.key, creditUsed: true });
        if (!used) return t.name;
    }
    return null;
}

const KEPT_FOR_CUSTOM = (AppError, name) =>
    new AppError(
        403,
        `Your last Premium invitation is kept for your custom design, ${name}. Publish that one first, or contact EventInvito for another invitation.`,
        undefined,
        "kept_for_custom"
    );

module.exports = { releaseFinishedDesigns, customDesignWaiting, KEPT_FOR_CUSTOM };
