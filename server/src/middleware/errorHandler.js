const AppError = require("../utils/AppError");

function notFound(req, res) {
    res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express 5 forwards errors thrown in async handlers here automatically.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.code && { code: err.code }),
            ...(err.details && { errors: err.details }),
        });
    }

    // Malformed JSON body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ success: false, message: "Invalid JSON in request body." });
    }

    // Request body over the size limit
    if (err.type === "entity.too.large") {
        return res.status(413).json({ success: false, message: "That request is too large." });
    }

    // Other request problems reported by Express itself (bad encoding, etc.)
    if (err.expose && err.status >= 400 && err.status < 500) {
        return res.status(err.status).json({ success: false, message: err.message });
    }

    // Mongoose schema validation
    if (err.name === "ValidationError") {
        const errors = Object.fromEntries(
            Object.entries(err.errors).map(([field, e]) => [field, e.message])
        );
        return res.status(400).json({ success: false, message: "Validation failed.", errors });
    }

    // Invalid ObjectId in a URL param
    if (err.name === "CastError") {
        return res.status(400).json({ success: false, message: "Invalid ID." });
    }

    // Unexpected error: log it (never log request bodies — they may contain passwords)
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
}

module.exports = { notFound, errorHandler };
