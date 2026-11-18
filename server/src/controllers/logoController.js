// The company logo on corporate invitations (every package, free cards included).
// Like photos, the file goes straight from the browser to Cloudinary; this controller hands out
// upload permission, checks what arrived and keeps one logo per invitation.

const AppError = require("../utils/AppError");
const cloudinary = require("../utils/cloudinary");
const { findOwned } = require("./invitationController");

// PNG keeps a transparent background; SVG isn't accepted (it can carry scripts)
const LOGO_FORMATS = ["png", "jpg", "jpeg", "webp"];
const LOGO_MAX_BYTES = 2 * 1024 * 1024; // logos are usually well under 500 KB

const folderFor = (invitation) => `eventinvito/${invitation.owner}/${invitation._id}/logo`;

function requireConfigured() {
    if (!cloudinary.isConfigured()) {
        throw new AppError(503, "Uploads aren't set up on this server yet. Add the Cloudinary settings to server/.env.", undefined, "uploads_disabled");
    }
}

function requireCorporate(invitation) {
    if (!invitation.isCorporate()) throw new AppError(400, "A company logo is for corporate invitations.");
}

const logoJSON = (invitation) => invitation.toOwnerJSON().logo;

// POST /api/invitations/:id/logo/signature — permission for one upload
async function logoSignature(req, res) {
    requireConfigured();
    const invitation = await findOwned(req);
    requireCorporate(invitation);
    res.json({ success: true, upload: cloudinary.uploadSignature(folderFor(invitation)) });
}

// POST /api/invitations/:id/logo  { publicId, version, signature } — Cloudinary's reply after upload
async function setLogo(req, res) {
    requireConfigured();
    const invitation = await findOwned(req);
    requireCorporate(invitation);
    const { publicId, version, signature } = req.body || {};
    if (typeof publicId !== "string" || !Number.isInteger(Number(version)) || typeof signature !== "string") {
        throw new AppError(400, "Upload details are missing.");
    }
    if (!cloudinary.verifyUploadResponse({ publicId, version, signature })) throw new AppError(400, "This upload couldn't be verified.");
    if (!publicId.startsWith(`${folderFor(invitation)}/`)) throw new AppError(403, "This logo belongs to a different invitation.");

    // Check the real file on Cloudinary rather than trusting the browser
    const info = await cloudinary.getImage(publicId);
    if (!info) throw new AppError(400, "The uploaded logo couldn't be found.");
    const format = String(info.format || "").toLowerCase();
    if (!LOGO_FORMATS.includes(format) || info.bytes > LOGO_MAX_BYTES) {
        await cloudinary.deleteImage(publicId).catch(() => {});
        throw new AppError(400, "Please upload the logo as a PNG (best, with a transparent background), JPG or WebP under 2 MB.");
    }

    const previous = invitation.logo?.publicId;
    invitation.logo = { publicId, version: Number(info.version || version), width: info.width, height: info.height, format, bytes: info.bytes };
    await invitation.save();
    // The old logo is no longer needed (if this fails, the invitation is still correct)
    if (previous && previous !== publicId) await cloudinary.deleteImage(previous).catch((err) => console.error("[logo] delete failed:", err.message));
    res.status(201).json({ success: true, logo: logoJSON(invitation) });
}

// DELETE /api/invitations/:id/logo
async function removeLogo(req, res) {
    const invitation = await findOwned(req);
    const previous = invitation.logo?.publicId;
    invitation.logo = undefined;
    await invitation.save();
    if (previous && cloudinary.isConfigured()) {
        await cloudinary.deleteImage(previous).catch((err) => console.error("[logo] delete failed:", err.message));
    }
    res.json({ success: true, logo: null });
}

module.exports = { logoSignature, setLogo, removeLogo, LOGO_FORMATS };
