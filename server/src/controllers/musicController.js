// The couple's own background music (uploaded to Cloudinary, like photos).
// They must confirm they have the right to use the music before uploading.

const AppError = require("../utils/AppError");
const cloudinary = require("../utils/cloudinary");
const { findOwned } = require("./invitationController");

const folderFor = (invitation) => `eventinvito/${invitation.owner}/${invitation._id}/music`;

function requireConfigured() {
    if (!cloudinary.isConfigured()) {
        throw new AppError(503, "Music uploads aren't set up on this server yet. Add the Cloudinary settings to server/.env.", undefined, "uploads_disabled");
    }
}

function requireRights(body) {
    if (body?.rightsConfirmed !== true) {
        throw new AppError(400, "Please confirm you have the right to use this music.", { rightsConfirmed: "Required." });
    }
}

// POST /api/invitations/:id/music/signature  { rightsConfirmed: true }
async function musicSignature(req, res) {
    requireConfigured();
    requireRights(req.body);
    const invitation = await findOwned(req);
    res.json({ success: true, upload: cloudinary.uploadSignature(folderFor(invitation), "audio") });
}

// POST /api/invitations/:id/music  { publicId, version, signature, title, rightsConfirmed: true }
async function setMusic(req, res) {
    requireConfigured();
    requireRights(req.body);
    const invitation = await findOwned(req);
    const { publicId, version, signature } = req.body || {};
    const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 120) : "";

    if (typeof publicId !== "string" || !Number.isInteger(Number(version)) || typeof signature !== "string") {
        throw new AppError(400, "Upload details are missing.");
    }
    if (!cloudinary.verifyUploadResponse({ publicId, version, signature })) throw new AppError(400, "This upload couldn't be verified.");
    if (!publicId.startsWith(`${folderFor(invitation)}/`)) throw new AppError(403, "This file belongs to a different invitation.");

    const info = await cloudinary.getResource(publicId, "video");
    if (!info) throw new AppError(400, "The uploaded file couldn't be found.");
    const format = String(info.format || "").toLowerCase();
    const problem = !cloudinary.AUDIO_FORMATS.includes(format)
        ? "Please upload an MP3, M4A, AAC, WAV, OGG or FLAC audio file."
        : info.bytes > cloudinary.AUDIO_MAX_BYTES
          ? "Please upload a music file under 15 MB."
          : info.duration > cloudinary.AUDIO_MAX_SECONDS
            ? "Please upload a song under 10 minutes long."
            : info.width || info.height
              ? "Please upload an audio file, not a video."
              : null;
    if (problem) {
        await cloudinary.deleteResource(publicId, "video").catch(() => {});
        throw new AppError(400, problem);
    }

    const previous = invitation.customMusic?.publicId;
    invitation.customMusic = {
        publicId,
        version: Number(info.version || version),
        title,
        format,
        bytes: info.bytes,
        duration: info.duration,
        rightsConfirmedAt: new Date(),
    };
    invitation.musicTrack = "custom";
    await invitation.save();
    if (previous && previous !== publicId) await cloudinary.deleteResource(previous, "video").catch(() => {});

    res.status(201).json({ success: true, invitation: invitation.toOwnerJSON() });
}

// DELETE /api/invitations/:id/music
async function removeMusic(req, res) {
    const invitation = await findOwned(req);
    const previous = invitation.customMusic?.publicId;
    invitation.customMusic = undefined;
    if (invitation.musicTrack === "custom") invitation.musicTrack = "";
    await invitation.save();
    if (previous && cloudinary.isConfigured()) {
        await cloudinary.deleteResource(previous, "video").catch((err) => console.error("[music] delete failed:", err.message));
    }
    res.json({ success: true, invitation: invitation.toOwnerJSON() });
}

module.exports = { musicSignature, setMusic, removeMusic };
