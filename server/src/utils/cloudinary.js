// Photo storage with Cloudinary (free plan is enough), without extra packages.
//
// How an upload works:
//   1. The editor asks our API for a *signature* (POST /api/invitations/:id/photos/signature).
//      The signature only allows: images, into this invitation's own folder, shrunk to at most
//      2000px. The secret never leaves the server.
//   2. The browser sends the file straight to Cloudinary with that signature (fast, and large
//      files never pass through our server).
//   3. The editor tells our API about the new photo (POST /api/invitations/:id/photos). We check
//      Cloudinary's reply signature and ask Cloudinary for the real size/format before saving it.
//
// Settings (server/.env): CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
// Without them, photo uploads are simply switched off.

const crypto = require("node:crypto");

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "heic", "avif"];
// The editor shrinks JPG/PNG/WebP photos in the browser first (to about 0.5–1 MB), so 5 MB is
// only reached by iPhone HEIC photos, which Cloudinary converts and shrinks on arrival.
const MAX_BYTES = 5 * 1024 * 1024;
const INCOMING_RESIZE = "c_limit,w_2000,h_2000"; // store at most 2000px — sharp on any screen, saves space

// Couple's own music. Cloudinary keeps audio under its "video" resource type.
const AUDIO_FORMATS = ["mp3", "m4a", "aac", "wav", "ogg", "oga", "flac"];
// A 4–6 minute song as a normal MP3 is about 4–7 MB
const AUDIO_MAX_BYTES = 8 * 1024 * 1024;
const AUDIO_MAX_SECONDS = 6 * 60;

function config() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
}

const isConfigured = () => config() !== null;

// Cloudinary's signing rule: sort the parameters, join as a=1&b=2, append the secret, SHA-1
function sign(params, apiSecret) {
    const toSign = Object.keys(params)
        .filter((k) => params[k] !== undefined && params[k] !== "")
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&");
    return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

// Parameters + signature the browser needs for one upload into `folder`.
// kind "image": photos, resized on arrival. kind "audio": the couple's music file.
function uploadSignature(folder, kind = "image") {
    const c = config();
    const audio = kind === "audio";
    const params = {
        timestamp: Math.floor(Date.now() / 1000),
        folder,
        allowed_formats: (audio ? AUDIO_FORMATS : ALLOWED_FORMATS).join(","),
        ...(audio ? {} : { transformation: INCOMING_RESIZE }),
    };
    return {
        cloudName: c.cloudName,
        apiKey: c.apiKey,
        uploadUrl: `https://api.cloudinary.com/v1_1/${c.cloudName}/${audio ? "video" : "image"}/upload`,
        params,
        signature: sign(params, c.apiSecret),
        maxBytes: audio ? AUDIO_MAX_BYTES : MAX_BYTES,
        allowedFormats: audio ? AUDIO_FORMATS : ALLOWED_FORMATS,
    };
}

// Cloudinary signs its upload reply with public_id + version; this proves the browser didn't invent it
function verifyUploadResponse({ publicId, version, signature }) {
    const c = config();
    if (!publicId || !version || !signature) return false;
    const expected = sign({ public_id: publicId, version }, c.apiSecret);
    const a = Buffer.from(String(signature));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const basicAuth = (c) => "Basic " + Buffer.from(`${c.apiKey}:${c.apiSecret}`).toString("base64");

// Ask Cloudinary what was really stored (size, format, dimensions / duration)
async function getResource(publicId, resourceType = "image") {
    const c = config();
    const path = publicId.split("/").map(encodeURIComponent).join("/");
    const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/resources/${resourceType}/upload/${path}`, {
        headers: { Authorization: basicAuth(c) },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Cloudinary lookup failed (${res.status})`);
    return res.json();
}

async function deleteResource(publicId, resourceType = "image") {
    const c = config();
    const params = { public_id: publicId, timestamp: Math.floor(Date.now() / 1000) };
    const body = new URLSearchParams({ ...params, api_key: c.apiKey, signature: sign(params, c.apiSecret) });
    const res = await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/${resourceType}/destroy`, { method: "POST", body });
    if (!res.ok) throw new Error(`Cloudinary delete failed (${res.status})`);
    return res.json();
}

const getImage = (publicId) => getResource(publicId, "image");
const deleteImage = (publicId) => deleteResource(publicId, "image");

// Delivery URLs: Cloudinary picks the best format (WebP/AVIF) and quality for each phone
function imageUrl(photo, width = 1600) {
    const c = config();
    const cloud = c?.cloudName || process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloud || !photo?.publicId) return null;
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_${width}/v${photo.version}/${photo.publicId}`;
}

// A photo cropped to the 1200 × 630 link-preview size (WhatsApp, Facebook…), as a JPEG under ~200 KB.
// g_auto keeps the faces in the crop.
function shareImageUrl(photo) {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloud || !photo?.publicId) return null;
    return `https://res.cloudinary.com/${cloud}/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto:good/v${photo.version}/${photo.publicId}`;
}

// Music is delivered as MP3 at 128 kbps, whatever format was uploaded, so every phone can play it
function audioUrl(music) {
    const cloud = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloud || !music?.publicId) return null;
    return `https://res.cloudinary.com/${cloud}/video/upload/br_128k/v${music.version}/${music.publicId}.mp3`;
}

module.exports = {
    shareImageUrl,
    isConfigured,
    getResource,
    deleteResource,
    audioUrl,
    AUDIO_FORMATS,
    AUDIO_MAX_BYTES,
    AUDIO_MAX_SECONDS,
    uploadSignature,
    verifyUploadResponse,
    getImage,
    deleteImage,
    imageUrl,
    sign,
    ALLOWED_FORMATS,
    MAX_BYTES,
};
