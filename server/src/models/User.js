const mongoose = require("mongoose");

const ROLES = ["customer", "admin"];

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false, // never returned unless explicitly requested
        },
        role: {
            type: String,
            enum: ROLES,
            default: "customer",
        },
        // How many more invitations this account may publish. Publishing a new invitation uses
        // one; that invitation can then be unpublished and published again for free. Accounts
        // get credits from the admin page now, and from payments later.
        publishCredits: { type: Number, default: 0, min: 0 },
        // Free cards: invitations it may publish with a free (static) design. Every new account
        // gets one; animated designs always need a (paid) publish credit.
        freeCredits: { type: Number, default: 0, min: 0 },
        // Turned off by an admin: can't sign in
        disabled: { type: Boolean, default: false },
        // Set by an admin: keep the account open after its invitation has ended
        keepAccess: { type: Boolean, default: false },
        // The package the couple paid for (free, premium, plus, signature): sets each
        // invitation's guest limit, photos, own song and Excel download. See utils/packages.js
        plan: { type: String, enum: ["free", "premium", "plus", "signature"] },
    },
    { timestamps: true }
);

// Shape sent to the client — no password hash, no internal fields
userSchema.methods.toPublicJSON = function () {
    return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        role: this.role,
        publishCredits: this.publishCredits || 0,
        freeCredits: this.freeCredits || 0,
        plan: require("../utils/packages").accountPlan(this),
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
