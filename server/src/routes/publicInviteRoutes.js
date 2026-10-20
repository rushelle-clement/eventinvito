const express = require("express");
const rateLimit = require("express-rate-limit");
const { viewInvite, submitRsvp } = require("../controllers/publicInviteController");

const router = express.Router();

// Guests open their link a few times; someone trying thousands of random links gets blocked.
const inviteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test", // the automated tests make many requests quickly
    message: { success: false, message: "Too many requests. Please wait a few minutes and try again." },
});

// Replies: a guest may change their mind a few times, but not hundreds
const rsvpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test", // the automated tests make many requests quickly
    message: { success: false, message: "Too many replies. Please wait a few minutes and try again." },
});

router.get("/:token", inviteLimiter, viewInvite);
router.post("/:token/rsvp", rsvpLimiter, submitRsvp);

module.exports = router;
