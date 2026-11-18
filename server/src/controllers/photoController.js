// Invitation photos (FR-022, NFR-011). Files go straight from the browser to Cloudinary;
// this controller hands out upload permission, checks what arrived, and keeps the list.

const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const cloudinary = require("../utils/cloudinary");
const { findOwned } = require("./invitationController");
const { MAX_PHOTOS } = require("../models/Invitation");

const folderFor = (invitation) => `eventinvito/${invitation.owner}/${invitation._id}`;

function requireConfigured() {
    if (!cloudinary.isConfigured()) {
        throw new AppError(
            503,
            "Photo uploads aren't set up on this server yet. Add the Cloudinary settings to server/.env.",
            undefined,
            "uploads_disabled"
        );
    }
}

const photosJSON = (invitation) => invitation.toOwnerJSON().photos;
const { limitsFor } = require("../utils/packages");

// The package's photo limit (3 for Premium, 6 for Premium Plus and Signature)
function photoLimit(invitation, user) {
    const { photos, planName } = limitsFor(invitation, user);
    return {
        max: photos,
        message: photos
            ? `${planName} includes up to ${photos} photos.${photos < 6 ? " Premium Plus includes up to 6." : ""}`
            : "Photos are part of the Premium packages.",
    };
}

// POST /api/invitations/:id/photos/signature — permission for one upload
async function photoSignature(req, res) {
    requireConfigured();
    const invitation = await findOwned(req);
    const limit = photoLimit(invitation, req.user);
    if (invitation.photos.length >= Math.min(MAX_PHOTOS, limit.max)) throw new AppError(403, limit.message, undefined, "photo_limit");
    res.json({ success: true, upload: cloudinary.uploadSignature(folderFor(invitation)) });
}

// POST /api/invitations/:id/photos  { publicId, version, signature } — Cloudinary's reply after upload
async function addPhoto(req, res) {
    requireConfigured();
    const invitation = await findOwned(req);
    const { publicId, version, signature } = req.body || {};

    if (typeof publicId !== "string" || !Number.isInteger(Number(version)) || typeof signature !== "string") {
        throw new AppError(400, "Upload details are missing.");
    }
    // Must be a genuine Cloudinary reply, for a file in this invitation's own folder
    if (!cloudinary.verifyUploadResponse({ publicId, version, signature })) throw new AppError(400, "This upload couldn't be verified.");
    if (!publicId.startsWith(`${folderFor(invitation)}/`)) throw new AppError(403, "This photo belongs to a different invitation.");
    if (invitation.photos.some((p) => p.publicId === publicId)) {
        return res.json({ success: true, photos: photosJSON(invitation) });
    }
    const limit = photoLimit(invitation, req.user);
    if (invitation.photos.length >= Math.min(MAX_PHOTOS, limit.max)) {
        await cloudinary.deleteImage(publicId).catch(() => {});
        throw new AppError(403, limit.message, undefined, "photo_limit");
    }

    // Check the real file on Cloudinary rather than trusting the browser
    const info = await cloudinary.getImage(publicId);
    if (!info) throw new AppError(400, "The uploaded photo couldn't be found.");
    const format = String(info.format || "").toLowerCase();
    if (!cloudinary.ALLOWED_FORMATS.includes(format) || info.bytes > cloudinary.MAX_BYTES) {
        await cloudinary.deleteImage(publicId).catch(() => {});
        throw new AppError(400, "Please upload a JPG, PNG, WebP or HEIC photo under 5 MB.");
    }

    invitation.photos.push({ publicId, version: Number(info.version || version), width: info.width, height: info.height, format, bytes: info.bytes });
    await invitation.save();
    res.status(201).json({ success: true, photos: photosJSON(invitation) });
}

// DELETE /api/invitations/:id/photos/:photoId
async function removePhoto(req, res) {
    const invitation = await findOwned(req);
    const photo = mongoose.isValidObjectId(req.params.photoId) ? invitation.photos.id(req.params.photoId) : null;
    if (!photo) throw new AppError(404, "Photo not found.");
    const { publicId } = photo;
    photo.deleteOne();
    await invitation.save();
    // Free the space on Cloudinary too (if this fails, the invitation is still correct)
    if (cloudinary.isConfigured()) {
        await cloudinary.deleteImage(publicId).catch((err) => console.error("[photos] delete failed:", err.message));
    }
    res.json({ success: true, photos: photosJSON(invitation) });
}

// PUT /api/invitations/:id/photos/order  { ids: [...] } — first one becomes the cover
async function reorderPhotos(req, res) {
    const invitation = await findOwned(req);
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : null;
    const current = invitation.photos.map((p) => p._id.toString());
    if (!ids || ids.length !== current.length || [...ids].sort().join() !== [...current].sort().join()) {
        throw new AppError(400, "The photo order doesn't match this invitation's photos.");
    }
    const byId = new Map(invitation.photos.map((p) => [p._id.toString(), p.toObject()]));
    invitation.photos = ids.map((id) => byId.get(id));
    await invitation.save();
    res.json({ success: true, photos: photosJSON(invitation) });
}

module.exports = { photoSignature, addPhoto, removePhoto, reorderPhotos };
