const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, me, logout, forgotPassword, resetPassword } = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Slow down password guessing and mass sign-ups: 20 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test", // the automated tests make many requests quickly
    message: { success: false, message: "Too many attempts. Please wait a few minutes and try again." },
});

// Reset emails: at most 5 requests per 15 minutes per IP, so the form can't be used to flood inboxes
const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: { success: false, message: "Too many requests. Please wait a few minutes and try again." },
});

router.post("/register", authLimiter, register);
router.post("/forgot-password", resetLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/login", authLimiter, login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

module.exports = router;
