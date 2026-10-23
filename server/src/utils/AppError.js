// An error with an HTTP status and a message that is safe to show the user.
// `details` = per-field messages; `code` = a short machine-readable reason the client can check;
// `extra` = more fields to send with the error (safe for the person who sees it).
class AppError extends Error {
    constructor(statusCode, message, details, code, extra) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.code = code;
        this.extra = extra;
    }
}

module.exports = AppError;
