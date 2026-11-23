const express = require("express");
const rateLimit = require("express-rate-limit");
const { viewQr, findGuest, submitQrRsvp } = require("../controllers/qrController");

const router = express.Router();

// The QR reply page for printed cards. Many guests may scan from the same hall Wi-Fi,
// so the limits are generous, but not enough to read out the whole guest list. Names are searched
// as the guest types (a few searches each), and a search never lists more than 5 names.
const limiter = (limit, message) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        skip: () => process.env.NODE_ENV === "test", // the automated tests make many requests quickly
        message: { success: false, message },
    });

router.get("/:code", limiter(200, "Too many requests. Please wait a few minutes and try again."), viewQr);
router.post("/:code/find", limiter(300, "Too many searches. Please wait a few minutes and try again."), findGuest);
router.post("/:code/rsvp", limiter(30, "Too many replies. Please wait a few minutes and try again."), submitQrRsvp);

module.exports = router;
