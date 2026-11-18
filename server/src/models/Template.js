const mongoose = require("mongoose");

const TEMPLATE_STATUSES = ["draft", "published", "archived"];
const EVENT_TYPES = ["wedding", "engagement", "homecoming", "birthday", "anniversary", "party", "corporate", "christmas"];
// The occasions a couple can choose for an invitation. Every couple design works for all three;
// the invitation's standard wording follows the occasion.
const COUPLE_OCCASIONS = ["wedding", "engagement", "homecoming"];
const LANGUAGES = ["en", "si", "ta"];
// Free designs are simple static cards (no animation, music, photos or RSVP); premium designs are
// the animated ones. Nothing is charged yet: premium designs are only labelled as such for now.
const TIERS = ["free", "premium"];

// An invitation design. The React app has a matching design component for each `key`
// (see client/src/templates). Admins control which templates customers can pick (status).
const templateSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: /^[a-z0-9-]+$/,
        },
        name: { type: String, required: true, trim: true, maxlength: 80 },
        description: { type: String, trim: true, maxlength: 400 },
        eventType: { type: String, enum: EVENT_TYPES, default: "wedding" },
        styleTags: [{ type: String, trim: true, maxlength: 30 }],
        // Swatches shown on the gallery card
        palette: [{ type: String, match: /^#[0-9a-fA-F]{6}$/ }],
        // Which invitation fields this design shows/edits (FR-013)
        supportedFields: [{ type: String }],
        languageSupport: {
            type: [{ type: String, enum: LANGUAGES }],
            default: LANGUAGES,
        },
        tier: { type: String, enum: TIERS, default: "premium" },
        status: { type: String, enum: TEMPLATE_STATUSES, default: "draft" },
        version: { type: Number, default: 1, min: 1 },
        sortOrder: { type: Number, default: 0 },
        // Signature custom designs (custom: true in data/templates.js) are hidden until the admin
        // gives one to a couple on the admin page (reservedFor = their account email). Then only
        // that couple (and admins) can see and use it. Once their event is over it joins the
        // collection for everyone (releasedAt is set; see utils/customDesigns.js).
        custom: { type: Boolean, default: false },
        reservedFor: { type: String, lowercase: true, trim: true },
        releasedAt: { type: Date },
    },
    { timestamps: true }
);

// Still private to one couple?
templateSchema.methods.isReserved = function () {
    return (this.custom || Boolean(this.reservedFor)) && !this.releasedAt;
};

// Can this person (signed in or not) see and use the design?
templateSchema.methods.isVisibleTo = function (user) {
    if (!this.isReserved()) return true;
    if (!user) return false;
    return user.role === "admin" || (Boolean(this.reservedFor) && String(user.email).toLowerCase() === this.reservedFor);
};

templateSchema.methods.toPublicJSON = function (viewer) {
    return {
        // "Your custom design" in the gallery (admins see whose it is)
        ...(this.isReserved() && { custom: true, ...(viewer?.role === "admin" && { reservedFor: this.reservedFor }) }),
        id: this._id.toString(),
        key: this.key,
        name: this.name,
        description: this.description,
        eventType: this.eventType,
        styleTags: this.styleTags,
        palette: this.palette,
        supportedFields: this.supportedFields,
        languageSupport: this.languageSupport,
        tier: this.tier,
        version: this.version,
    };
};

module.exports = mongoose.model("Template", templateSchema);
module.exports.TEMPLATE_STATUSES = TEMPLATE_STATUSES;
module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports.COUPLE_OCCASIONS = COUPLE_OCCASIONS;
module.exports.LANGUAGES = LANGUAGES;
module.exports.TIERS = TIERS;
