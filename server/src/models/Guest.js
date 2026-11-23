const mongoose = require("mongoose");

const RSVP_STATUSES = ["pending", "attending", "not_attending"];
const CARD_TYPES = ["online", "physical"];

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
        // The couple's own grouping, e.g. "Bride's family", "Groom's friends", "Office".
        // Free text so they can use any groups they like; used for filtering and counts.
        group: { type: String, trim: true, maxlength: 40, default: "" },

        // Personal link (see utils/guestToken.js). Never sent to the guest-facing API.
        tokenHash: { type: String, required: true, unique: true },
        tokenEncrypted: { type: String, required: true },
        linkResetAt: { type: Date },
        // Last time the couple copied or WhatsApp-shared this guest's link (for the "Shared" column)
        sharedAt: { type: Date },

        // When the guest opened their invitation: the first time, the last time, and how many
        // visits (opens within 30 minutes of each other count once). The couple's own visits and
        // link-preview bots don't count.
        openedAt: { type: Date },
        lastOpenedAt: { type: Date },
        openCount: { type: Number, default: 0, min: 0 },

        // "online": gets a personal link. "physical": gets a printed card and replies through
        // the invitation's QR code (see controllers/qrController.js).
        cardType: { type: String, enum: CARD_TYPES, default: "online" },

        rsvpStatus: { type: String, enum: RSVP_STATUSES, default: "pending" },
        respondedAt: { type: Date },
        // Where the current reply came from: their personal link or the printed card's QR code
        rsvpVia: { type: String, enum: ["", "link", "qr", "host"], default: "" }, // "host": the couple entered it (e.g. the guest phoned)
    },
    { timestamps: true }
);

module.exports = mongoose.model("Guest", guestSchema);
module.exports.RSVP_STATUSES = RSVP_STATUSES;
module.exports.CARD_TYPES = CARD_TYPES;
