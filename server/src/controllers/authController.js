const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/token");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const BCRYPT_ROUNDS = 12;

function str(value) {
    return typeof value === "string" ? value.trim() : "";
}

// POST /api/auth/register  { name, email, password }
async function register(req, res) {
    const name = str(req.body?.name);
    const email = str(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    const errors = {};
    if (!name) errors.name = "Name is required.";
    else if (name.length > 100) errors.name = "Name must be 100 characters or fewer.";
    if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
    if (password.length < MIN_PASSWORD) errors.password = `Password must be at least ${MIN_PASSWORD} characters.`;
    else if (password.length > 128) errors.password = "Password must be 128 characters or fewer.";
    if (Object.keys(errors).length) throw new AppError(400, "Please fix the highlighted fields.", errors);

    if (await User.exists({ email })) {
        throw new AppError(409, "An account with this email already exists.", {
            email: "An account with this email already exists.",
        });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    let user;
    try {
        // Role is never taken from the request — new accounts are always customers
        user = await User.create({ name, email, passwordHash });
    } catch (err) {
        if (err.code === 11000) {
            // Race: same email registered between the check and the insert
            throw new AppError(409, "An account with this email already exists.");
        }
        throw err;
    }

    res.status(201).json({ success: true, token: signToken(user), user: user.toPublicJSON() });
}

// POST /api/auth/login  { email, password }
async function login(req, res) {
    const email = str(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";

    if (!email || !password) {
        throw new AppError(400, "Email and password are required.");
    }

    const user = await User.findOne({ email }).select("+passwordHash");
    const ok = user && (await bcrypt.compare(password, user.passwordHash));

    // Same message for unknown email and wrong password, so accounts can't be probed
    if (!ok) throw new AppError(401, "Incorrect email or password.");

    res.json({ success: true, token: signToken(user), user: user.toPublicJSON() });
}

// GET /api/auth/me  (requires auth)
async function me(req, res) {
    res.json({ success: true, user: req.user.toPublicJSON() });
}

// POST /api/auth/logout  (requires auth)
// Tokens are stateless; the client deletes its stored token. This endpoint exists
// so the client has one place to call, and so server-side revocation can be added later.
async function logout(req, res) {
    res.json({ success: true, message: "Signed out." });
}

module.exports = { register, login, me, logout };
