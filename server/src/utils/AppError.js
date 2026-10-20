// An error with an HTTP status and a message that is safe to show the user.
// `details` = per-field messages; `code` = a short machine-readable reason the client can check.
class AppError extends Error {
    constructor(statusCode, message, details, code) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.code = code;
    }
}

module.exports = AppError;
