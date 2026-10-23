const User = require("../models/User");
const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/token");
const { assertCanSignIn } = require("../utils/accountAccess");

// Requires a valid "Authorization: Bearer <token>" header.
// Loads the user from the database so deleted users / changed roles take effect immediately.
async function requireAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        throw new AppError(401, "Please sign in to continue.");
    }

    let payload;
    try {
        payload = verifyToken(token);
    } catch {
        throw new AppError(401, "Your session has expired. Please sign in again.");
    }

    const user = await User.findById(payload.sub);
    if (!user) {
        throw new AppError(401, "Your session is no longer valid. Please sign in again.");
    }

    // A turned-off or closed account is signed out straight away, even with a valid token
    await assertCanSignIn(user);

    req.user = user;
    next();
}

// Sets req.user when a valid sign-in token is sent, and carries on without one otherwise
// (for public pages that show a little more to the signed-in couple).
async function optionalAuth(req, res, next) {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme === "Bearer" && token) {
        try {
            const user = await User.findById(verifyToken(token).sub);
            if (user && !user.disabled) req.user = user;
        } catch {
            // an expired or broken token: treat as signed out
        }
    }
    next();
}

// Use after requireAuth: requireRole("admin")
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new AppError(403, "You do not have permission to do this.");
        }
        next();
    };
}

module.exports = { optionalAuth, requireAuth, requireRole };
