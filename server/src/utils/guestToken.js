// Personal guest links (FR-042, NFR-005).
//
// Each guest gets a random 192-bit token, e.g. https://site/i/Xb3k...  It is:
//   - unguessable (random, not based on the database ID)
//   - looked up by its SHA-256 hash, so the database never needs the raw token to find a guest
//   - also kept encrypted (AES-256-GCM) so the couple can copy the link again later.
//     The encryption key is derived from JWT_SECRET. If that secret ever changes, existing
//     links keep working (lookup uses the hash), but the couple must "Reset link" to see them again.

const crypto = require("node:crypto");

const TOKEN_BYTES = 24;

function key() {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET is not set in .env");
    return Buffer.from(crypto.hkdfSync("sha256", secret, "eventinvito", "guest-link-encryption", 32));
}

function hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function encrypt(token) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
    const data = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

function decrypt(stored) {
    try {
        const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64url"));
        const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    } catch {
        return null; // key changed or data damaged
    }
}

// A new token plus what to store for it
function newGuestToken() {
    const token = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
    return { token, tokenHash: hashToken(token), tokenEncrypted: encrypt(token) };
}

// Quick shape check before touching the database (base64url, right length)
function looksLikeToken(token) {
    return typeof token === "string" && /^[A-Za-z0-9_-]{32}$/.test(token);
}

function guestLink(token) {
    const base = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
    return `${base}/i/${token}`;
}

module.exports = { newGuestToken, hashToken, decrypt, looksLikeToken, guestLink };
