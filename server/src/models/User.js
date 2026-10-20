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
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
