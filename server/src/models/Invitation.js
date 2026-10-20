const mongoose = require("mongoose");
const { LANGUAGES, EVENT_TYPES } = require("./Template");
const { imageUrl, audioUrl } = require("../utils/cloudinary");

function photoJSON(p) {
    return {
        id: p._id.toString(),
        url: imageUrl(p, 1600),
        thumb: imageUrl(p, 480),
        width: p.width,
        height: p.height,
    };
}

const INVITATION_STATUSES = ["draft", "published", "unpublished", "archived"];
const MAX_PHOTOS = 6;
const MAX_CEREMONIES = 8;

const ceremonySchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 60, required: true },
        date: { type: String, match: /^$|^\d{4}-\d{2}-\d{2}$/, default: "" },
        time: { type: String, match: /^$|^\d{2}:\d{2}$/, default: "" },
        venue: { type: String, trim: true, maxlength: 120, default: "" },
        note: { type: String, trim: true, maxlength: 200, default: "" },
    },
    { _id: false }
);

// A photo stored in Cloudinary (see utils/cloudinary.js). The first photo is the cover.
const photoSchema = new mongoose.Schema({
    publicId: { type: String, required: true, maxlength: 300 },
    version: { type: Number, required: true },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
});

const invitationSchema = new mongoose.Schema(
    {
        // BR-001: every invitation belongs to exactly one account
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

        // Which design it uses. Version is recorded so later template changes can be handled safely.
        template: { type: mongoose.Schema.Types.ObjectId, ref: "Template", required: true },
        templateKey: { type: String, required: true },
        templateVersion: { type: Number, required: true },

        eventType: { type: String, enum: EVENT_TYPES, default: "wedding" },
        language: { type: String, enum: LANGUAGES, default: "en" },
        status: { type: String, enum: INVITATION_STATUSES, default: "draft", index: true },

        // Content the couple edits. Not required in a draft — checked before publishing (BR-002).
        partnerOne: { type: String, trim: true, maxlength: 60, default: "" },
        partnerTwo: { type: String, trim: true, maxlength: 60, default: "" },
        hostLine: { type: String, trim: true, maxlength: 200, default: "" },
        // Optional line above each name, e.g. "... මහතා සහ ... මැතිනියගේ ආදරණීය දියණිය"
        partnerOneParents: { type: String, trim: true, maxlength: 200, default: "" },
        partnerTwoParents: { type: String, trim: true, maxlength: 200, default: "" },
        // Optional closing line addressed to the guest. "{name}" is replaced with the guest's name.
        inviteLine: { type: String, trim: true, maxlength: 200, default: "" },
        message: { type: String, trim: true, maxlength: 600, default: "" },

        // Kept as plain strings ("2026-12-12", "16:00") in the event's own time zone,
        // so the date the couple typed is exactly the date guests see.
        eventDate: { type: String, match: /^$|^\d{4}-\d{2}-\d{2}$/, default: "" },
        eventTime: { type: String, match: /^$|^\d{2}:\d{2}$/, default: "" },
        endTime: { type: String, match: /^$|^\d{2}:\d{2}$/, default: "" },
        timeZone: { type: String, default: "Asia/Colombo" },

        venueName: { type: String, trim: true, maxlength: 120, default: "" },
        address: { type: String, trim: true, maxlength: 250, default: "" },
        mapUrl: { type: String, trim: true, maxlength: 500, default: "" },
        dressCode: { type: String, trim: true, maxlength: 200, default: "" },

        rsvpDeadline: { type: String, match: /^$|^\d{4}-\d{2}-\d{2}$/, default: "" },

        // Optional line printed at the very top, e.g. a blessing or invocation in any script.
        // Left to the couple so no tradition is assumed.
        blessing: { type: String, trim: true, maxlength: 140, default: "" },

        // Optional programme of ceremonies (e.g. Mehendi, Sangeet, Wedding, Reception).
        // Names and details are entirely the couple's own.
        ceremonies: {
            type: [ceremonySchema],
            validate: { validator: (v) => v.length <= MAX_CEREMONIES, message: `Up to ${MAX_CEREMONIES} ceremonies.` },
            default: [],
        },

        // Optional text sent with each guest's link on WhatsApp / copy (FR-033).
        // {name} is replaced with the guest's name.
        shareMessage: { type: String, trim: true, maxlength: 500, default: "" },

        photos: {
            type: [photoSchema],
            validate: { validator: (v) => v.length <= MAX_PHOTOS, message: `Up to ${MAX_PHOTOS} photos.` },
            default: [],
        },

        // Background music: a built-in track id (client/src/templates/music.js),
        // "custom" for the couple's own uploaded file, or "" for none
        musicTrack: { type: String, trim: true, maxlength: 60, match: /^$|^[a-z0-9-]+$/, default: "" },

        // The couple's own music file in Cloudinary, uploaded after they confirmed they may use it
        customMusic: {
            type: new mongoose.Schema(
                {
                    publicId: { type: String, required: true, maxlength: 300 },
                    version: { type: Number, required: true },
                    title: { type: String, trim: true, maxlength: 120, default: "" },
                    format: String,
                    bytes: Number,
                    duration: Number,
                    rightsConfirmedAt: { type: Date, required: true },
                },
                { _id: false }
            ),
            default: undefined,
        },

        publishedAt: { type: Date },
    },
    { timestamps: true }
);

// Free designs are simple static cards: no RSVP, music or photos (see Template.tier).
// Needs `template` populated with its tier; an unpopulated template counts as premium.
invitationSchema.methods.isFreeDesign = function () {
    return this.template?.tier === "free";
};

// Fields a couple must fill before publishing. Free designs have no RSVP, so no deadline.
invitationSchema.methods.missingForPublish = function () {
    const missing = [];
    if (!this.partnerOne) missing.push("partnerOne");
    if (!this.partnerTwo) missing.push("partnerTwo");
    if (!this.eventDate) missing.push("eventDate");
    if (!this.eventTime) missing.push("eventTime");
    if (!this.venueName) missing.push("venueName");
    if (!this.address) missing.push("address");
    if (!this.isFreeDesign() && !this.rsvpDeadline) missing.push("rsvpDeadline");
    return missing;
};

invitationSchema.methods.toOwnerJSON = function () {
    return {
        id: this._id.toString(),
        templateKey: this.templateKey,
        templateVersion: this.templateVersion,
        templateName: this.template?.name, // present when populated
        tier: this.template?.tier || "premium",
        eventType: this.eventType,
        language: this.language,
        status: this.status,
        partnerOne: this.partnerOne,
        partnerTwo: this.partnerTwo,
        hostLine: this.hostLine,
        partnerOneParents: this.partnerOneParents,
        partnerTwoParents: this.partnerTwoParents,
        inviteLine: this.inviteLine,
        blessing: this.blessing,
        ceremonies: (this.ceremonies || []).map((c) => ({ name: c.name, date: c.date, time: c.time, venue: c.venue, note: c.note })),
        message: this.message,
        eventDate: this.eventDate,
        eventTime: this.eventTime,
        endTime: this.endTime,
        timeZone: this.timeZone,
        venueName: this.venueName,
        address: this.address,
        mapUrl: this.mapUrl,
        dressCode: this.dressCode,
        rsvpDeadline: this.rsvpDeadline,
        shareMessage: this.shareMessage,
        musicTrack: this.musicTrack,
        customMusic: this.customMusic
            ? { title: this.customMusic.title, duration: this.customMusic.duration, url: audioUrl(this.customMusic) }
            : null,
        photos: (this.photos || []).map(photoJSON),
        missingForPublish: this.missingForPublish(),
        publishedAt: this.publishedAt,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

// Today's date ("2026-10-13") in the event's own time zone
function todayIn(timeZone) {
    try {
        return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch {
        return new Date().toISOString().slice(0, 10);
    }
}

// Guests may reply up to and including the deadline day (FR-052, BR-009)
invitationSchema.methods.isRsvpOpen = function () {
    if (this.isFreeDesign() || !this.rsvpDeadline) return false;
    return todayIn(this.timeZone || "Asia/Colombo") <= this.rsvpDeadline;
};

// What a guest's personal page receives: the invitation content only —
// no owner details, no other guests, no RSVP numbers (NFR-004).
invitationSchema.methods.toGuestJSON = function () {
    const free = this.isFreeDesign(); // free designs show no RSVP, music or photos
    return {
        templateKey: this.templateKey,
        eventType: this.eventType,
        language: this.language,
        partnerOne: this.partnerOne,
        partnerTwo: this.partnerTwo,
        hostLine: this.hostLine,
        partnerOneParents: this.partnerOneParents,
        partnerTwoParents: this.partnerTwoParents,
        inviteLine: this.inviteLine,
        blessing: this.blessing,
        ceremonies: (this.ceremonies || []).map((c) => ({ name: c.name, date: c.date, time: c.time, venue: c.venue, note: c.note })),
        message: this.message,
        eventDate: this.eventDate,
        eventTime: this.eventTime,
        endTime: this.endTime,
        timeZone: this.timeZone,
        venueName: this.venueName,
        address: this.address,
        mapUrl: this.mapUrl,
        dressCode: this.dressCode,
        rsvpDeadline: free ? "" : this.rsvpDeadline,
        musicTrack: free ? "" : this.musicTrack,
        // Only sent when the couple chose their own file
        musicUrl: !free && this.musicTrack === "custom" && this.customMusic ? audioUrl(this.customMusic) : null,
        photos: free ? [] : (this.photos || []).map(photoJSON),
    };
};

module.exports = mongoose.model("Invitation", invitationSchema);
module.exports.INVITATION_STATUSES = INVITATION_STATUSES;
module.exports.MAX_PHOTOS = MAX_PHOTOS;
module.exports.MAX_CEREMONIES = MAX_CEREMONIES;
