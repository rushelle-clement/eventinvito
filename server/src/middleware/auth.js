const User = require("../models/User");
const AppError = require("../utils/AppError");
const { verifyToken } = require("../utils/token");

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

    req.user = user;
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

module.exports = { requireAuth, requireRole };
