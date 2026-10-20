const jwt = require("jsonwebtoken");

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not set in .env");
    }
    return secret;
}

function signToken(user) {
    return jwt.sign({ sub: user._id.toString(), role: user.role }, getSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
}

function verifyToken(token) {
    return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
