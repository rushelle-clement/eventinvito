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
const MAX_PHOTOS = 12; // the most any package allows (utils/packages.js sets each package's limit)
const MAX_CEREMONIES = 8;
const MAX_AGENDA = 30;

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

// One step of the day plan (the wedding day agenda): "10:30 · Poruwa ceremony · Main hall".
// `date` is only needed when the plan covers more than one day; empty means the event date.
const agendaItemSchema = new mongoose.Schema(
    {
        date: { type: String, match: /^$|^\d{4}-\d{2}-\d{2}$/, default: "" },
        time: { type: String, match: /^\d{2}:\d{2}$/, required: true },
        endTime: { type: String, match: /^$|^\d{2}:\d{2}$/, default: "" },
        title: { type: String, trim: true, maxlength: 80, required: true },
        place: { type: String, trim: true, maxlength: 120, default: "" },
        note: { type: String, trim: true, maxlength: 200, default: "" },
    },
    { _id: false }
);
const agendaJSON = (list) =>
    (list || []).map((a) => ({ date: a.date, time: a.time, endTime: a.endTime, title: a.title, place: a.place, note: a.note }));

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
        // Birthdays: the person celebrating and (optionally) the age they're turning
        celebrant: { type: String, trim: true, maxlength: 60, default: "" },
        age: { type: Number, min: 0, max: 120, default: null },
        // Corporate events: the company, the event's title, the company logo and, for an
        // anniversary, how many years (the big number on the Corporate Anniversary design)
        companyName: { type: String, trim: true, maxlength: 80, default: "" },
        eventTitle: { type: String, trim: true, maxlength: 100, default: "" },
        milestone: { type: Number, min: 1, max: 500, default: null },
        // How the logo is shown: in its own colours, or in one colour that matches the design
        logoStyle: { type: String, enum: ["original", "mono"], default: "original" },
        logo: {
            type: new mongoose.Schema(
                {
                    publicId: { type: String, required: true, maxlength: 300 },
                    version: { type: Number, required: true },
                    width: Number,
                    height: Number,
                    format: String,
                    bytes: Number,
                },
                { _id: false }
            ),
            default: undefined,
        },
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

        // The day plan (Premium Plus and Signature): a timed list of what happens on the day.
        // Guests only see it when the couple switches it on (agendaVisible).
        agenda: {
            type: [agendaItemSchema],
            validate: { validator: (v) => v.length <= MAX_AGENDA, message: `Up to ${MAX_AGENDA} agenda items.` },
            default: [],
        },
        agendaVisible: { type: Boolean, default: false },

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

        // QR code for printed cards: guests with a physical card scan it, find their name and reply.
        // `qrCode` is made the first time it's switched on and never changes (it's printed).
        qrEnabled: { type: Boolean, default: false },
        // Printed Cards package: the couple prints every card. No online invitation is shown,
        // only the QR reply page; every guest has a physical card. `template` is only kept
        // so the invitation has a design if they upgrade to online cards.
        printed: { type: Boolean, default: false },
        qrCode: { type: String, unique: true, sparse: true },

        publishedAt: { type: Date },
        // A publish credit was used for this invitation (it may be unpublished and published again freely)
        creditUsed: { type: Boolean, default: false },
        // Which allowance paid for it: a free card (free designs only) or a premium credit
        creditKind: { type: String, enum: ["free", "premium", "printed"] },
    },
    { timestamps: true }
);

// Free designs are simple static cards: replies but no deadline, no music or photos (see Template.tier).
// Needs `template` populated with its tier; an unpopulated template counts as premium.
invitationSchema.methods.isFreeDesign = function () {
    if (this.printed) return false; // printed cards have a reply-by date, like paid cards
    return this.template?.tier === "free";
};

// Birthday invitations are for one person (celebrant + age) instead of a couple
invitationSchema.methods.isBirthday = function () {
    return this.eventType === "birthday";
};

// Corporate events: a company's event (title, company name and logo instead of a couple)
invitationSchema.methods.isCorporate = function () {
    return this.eventType === "corporate";
};

// Christmas parties: the party's title and its hosts (stored in eventTitle and companyName)
invitationSchema.methods.isChristmas = function () {
    return this.eventType === "christmas";
};

// The company logo, sized for invitations (any design, free cards included)
function logoJSON(logo) {
    if (!logo?.publicId) return null;
    return { url: imageUrl(logo, 800), width: logo.width, height: logo.height };
}

// "Amaya & Nuwan", "Kavindi's 1st birthday" or "Annual Awards Night · Acme" (for lists, the admin page and emails)
invitationSchema.methods.title = function () {
    if (this.isCorporate()) return [this.eventTitle, this.companyName].filter(Boolean).join(" · ") || "Untitled event";
    if (this.isChristmas()) return [this.eventTitle, this.companyName].filter(Boolean).join(" · ") || "Untitled Christmas party";
    if (this.isBirthday()) {
        if (!this.celebrant) return "Untitled birthday";
        return this.age != null ? `${this.celebrant}'s ${ordinal(this.age)} birthday` : `${this.celebrant}'s birthday`;
    }
    return [this.partnerOne, this.partnerTwo].filter(Boolean).join(" & ") || "Untitled invitation";
};

function ordinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// Fields a couple must fill before publishing. Free designs have no RSVP, so no deadline.
invitationSchema.methods.missingForPublish = function () {
    const missing = [];
    if (this.isBirthday()) {
        if (!this.celebrant) missing.push("celebrant");
    } else if (this.isCorporate() || this.isChristmas()) {
        if (!this.companyName) missing.push("companyName");
        if (!this.eventTitle) missing.push("eventTitle");
    } else {
        if (!this.partnerOne) missing.push("partnerOne");
        if (!this.partnerTwo) missing.push("partnerTwo");
    }
    if (!this.eventDate) missing.push("eventDate");
    if (!this.eventTime) missing.push("eventTime");
    if (!this.venueName) missing.push("venueName");
    if (!this.address && !this.printed) missing.push("address"); // the address is on the printed card
    if (!this.isFreeDesign() && !this.rsvpDeadline) missing.push("rsvpDeadline");
    return missing;
};

// `owner` (the signed-in couple) adds the package and its limits for this invitation
invitationSchema.methods.toOwnerJSON = function (owner) {
    return {
        ...(owner && { limits: require("../utils/packages").limitsFor(this, owner) }),
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
        celebrant: this.celebrant,
        age: this.age ?? null,
        companyName: this.companyName || "",
        eventTitle: this.eventTitle || "",
        milestone: this.milestone ?? null,
        logo: logoJSON(this.logo),
        logoStyle: this.logoStyle || "original",
        hostLine: this.hostLine,
        partnerOneParents: this.partnerOneParents,
        partnerTwoParents: this.partnerTwoParents,
        inviteLine: this.inviteLine,
        blessing: this.blessing,
        ceremonies: (this.ceremonies || []).map((c) => ({ name: c.name, date: c.date, time: c.time, venue: c.venue, note: c.note })),
        agenda: agendaJSON(this.agenda),
        agendaVisible: Boolean(this.agendaVisible),
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
        paid: this.isPaid(), // publishing it again uses no credit
        paidKind: this.paidKind(),
        onlineUntil: this.onlineUntil(), // guests can open it until the end of this day
        ended: this.hasEnded(),
        qr: { enabled: Boolean(this.qrEnabled), code: this.qrCode || "" },
        printed: Boolean(this.printed),
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

function addDays(isoDate, days) {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

// How long an invitation stays online: guests can open it until the end of the day after
// the last event (the main date or any ceremony in the programme, whichever is later).
// After that their link shows a short "this invitation has ended" note instead.
invitationSchema.methods.lastEventDate = function () {
    return [this.eventDate, ...(this.ceremonies || []).map((c) => c.date)].filter(Boolean).sort().pop() || "";
};
invitationSchema.methods.onlineUntil = function () {
    const last = this.lastEventDate();
    return last ? addDays(last, 1) : "";
};
invitationSchema.methods.hasEnded = function () {
    const until = this.onlineUntil();
    return Boolean(until) && todayIn(this.timeZone || "Asia/Colombo") > until;
};

// Paid for: a credit was used, or it was published before credits existed
invitationSchema.methods.isPaid = function () {
    return Boolean(this.creditUsed || this.publishedAt);
};

// "free" (published with a free card) or "premium"; invitations published before free cards
// existed count as premium. null = not paid for yet.
invitationSchema.methods.paidKind = function () {
    if (!this.isPaid()) return null;
    return this.creditKind || "premium";
};

// Guests may reply up to and including the deadline day (FR-052, BR-009).
// Simple Card (free designs) has no deadline: replies stay open until the invitation ends.
invitationSchema.methods.isRsvpOpen = function () {
    if (this.isFreeDesign()) return !this.hasEnded();
    if (!this.rsvpDeadline) return false;
    return todayIn(this.timeZone || "Asia/Colombo") <= this.rsvpDeadline;
};

// What a guest's personal page receives: the invitation content only —
// no owner details, no other guests, no RSVP numbers (NFR-004).
// `showAgenda`: the couple switched the day plan on and their package includes it.
invitationSchema.methods.toGuestJSON = function ({ showAgenda = false } = {}) {
    const free = this.isFreeDesign(); // free designs show no reply deadline, music or photos
    return {
        templateKey: this.templateKey,
        eventType: this.eventType,
        language: this.language,
        partnerOne: this.partnerOne,
        partnerTwo: this.partnerTwo,
        celebrant: this.celebrant,
        age: this.age ?? null,
        companyName: this.companyName || "",
        eventTitle: this.eventTitle || "",
        milestone: this.milestone ?? null,
        logo: logoJSON(this.logo),
        logoStyle: this.logoStyle || "original",
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
        agenda: showAgenda ? agendaJSON(this.agenda) : [],
    };
};

module.exports = mongoose.model("Invitation", invitationSchema);
module.exports.INVITATION_STATUSES = INVITATION_STATUSES;
module.exports.MAX_PHOTOS = MAX_PHOTOS;
module.exports.MAX_CEREMONIES = MAX_CEREMONIES;
module.exports.MAX_AGENDA = MAX_AGENDA;
