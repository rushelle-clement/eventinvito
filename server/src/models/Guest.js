const mongoose = require("mongoose");

const RSVP_STATUSES = ["pending", "attending", "not_attending"];

// One invited person (BR-005). Their RSVP lives on the same record, so there can only
// ever be one current answer per guest (FR-056).
const guestSchema = new mongoose.Schema(
    {
        invitation: { type: mongoose.Schema.Types.ObjectId, ref: "Invitation", required: true, index: true },
        // Copied from the invitation so ownership checks are a single query
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

        name: { type: String, required: true, trim: true, maxlength: 100 },
        // Optional name as printed on the invitation (e.g. in Sinhala). Falls back to `name`.
        displayName: { type: String, trim: true, maxlength: 100, default: "" },
        email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
        phone: { type: String, trim: true, maxlength: 20, default: "" },
        notes: { type: String, trim: true, maxlength: 300, default: "" },

        // Personal link (see utils/guestToken.js). Never sent to the guest-facing API.
        tokenHash: { type: String, required: true, unique: true },
        tokenEncrypted: { type: String, required: true },
        linkResetAt: { type: Date },
        // Last time the couple copied or WhatsApp-shared this guest's link (for the "Shared" column)
        sharedAt: { type: Date },

        rsvpStatus: { type: String, enum: RSVP_STATUSES, default: "pending" },
        respondedAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Guest", guestSchema);
module.exports.RSVP_STATUSES = RSVP_STATUSES;
