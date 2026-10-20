// Fills the database with demo data for testing.
// Run from the server folder:  npm run seed:demo
//
// Creates two demo accounts with invitations in every state and guests with mixed RSVPs,
// then prints sign-in details and every guest link.
//
// Safe to re-run: it deletes and recreates ONLY the data of the two demo accounts below.
// Your own accounts and invitations are never touched. It refuses to run in production.

require("node:dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Template = require("../models/Template");
const Invitation = require("../models/Invitation");
const Guest = require("../models/Guest");
const templates = require("../data/templates");
const { newGuestToken, guestLink } = require("../utils/guestToken");

const PASSWORD = "Demo1234";
const DEMO_USERS = [
    { key: "host", name: "Amaya Perera", email: "demo@eventinvito.test" },
    { key: "other", name: "Kasun Silva", email: "other@eventinvito.test" },
];

// Dates relative to today, so the demo keeps working whenever you run it
function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
}

const A = "attending";
const D = "not_attending";
const P = "pending";

// [name, phone, email, notes, rsvp, shared?]
const INVITATIONS = [
    {
        owner: "host",
        label: "1. Live — English (Pure Elegance)",
        templateKey: "pure-elegance",
        status: "published",
        language: "en",
        partnerOne: "Amaya",
        partnerTwo: "Nuwan",
        hostLine: "Mr. & Mrs. Perera and Mr. & Mrs. Fernando request the honour of your presence",
        message: "at the celebration of the marriage of their children",
        eventDate: daysFromNow(60),
        eventTime: "16:00",
        endTime: "22:00",
        venueName: "Mount Lavinia Hotel",
        address: "100 Hotel Road, Mount Lavinia",
        mapUrl: "https://maps.google.com/?q=Mount+Lavinia+Hotel",
        dressCode: "Formal",
        rsvpDeadline: daysFromNow(45),
        shareMessage: "Dear {name}, with great joy {couple} invite you to their wedding! Please open your personal invitation and let us know if you can come:",
        guests: [
            ["Amal Perera", "077 123 4567", "amal@example.com", "Groom's cousin", A, true],
            ["Kamala Silva", "071 234 5678", "", "Bride's aunt", A, true],
            ["Ruwan Fernando", "+94 76 345 6789", "ruwan@example.com", "College friend", D, true],
            ["Nimali Jayawardena", "075 456 7890", "", "Bride's colleague", A, true],
            ["Dinesh Wickramasinghe", "", "dinesh@example.com", "", P, true],
            ["Shanika de Silva", "078 567 8901", "", "Neighbour", P, false],
            ["Tharindu Bandara", "070 678 9012", "", "Groom's colleague", A, true],
            ["Ishara Gunawardena", "", "", "No contact details yet", P, false],
            ["Priyanka Rajapaksa", "072 789 0123", "priyanka@example.com", "", D, true],
            ["Malith Herath", "077 890 1234", "", "Groom's school friend", A, true],
            ["Sanduni Weerasinghe", "071 901 2345", "", "", P, true],
            ["Amal Perera", "076 111 2222", "", "Same name as the first guest — different link", P, false],
        ],
    },
    {
        owner: "host",
        label: "2. Live — Sinhala (Royal Red)",
        templateKey: "royal-red",
        status: "published",
        language: "si",
        partnerOne: "අමායා",
        partnerTwo: "නුවන්",
        hostLine: "",
        message: "",
        eventDate: daysFromNow(100),
        eventTime: "10:30",
        endTime: "15:00",
        venueName: "Galle Face Hotel",
        address: "2 Galle Road, Colombo 03",
        mapUrl: "https://maps.google.com/?q=Galle+Face+Hotel",
        dressCode: "සාම්ප්‍රදායික ඇඳුම්",
        rsvpDeadline: daysFromNow(85),
        guests: [
            ["කමල් පෙරේරා", "077 222 3333", "", "", A, true],
            ["සුනිල් ජයසූරිය", "071 333 4444", "", "", P, true],
            ["නිරෝෂා ද සිල්වා", "", "", "", D, true],
            ["Lahiru Mendis", "075 444 5555", "", "Name typed in English", P, false],
        ],
    },
    {
        owner: "host",
        label: "3. Draft — Tamil (Crimson Love), not finished",
        templateKey: "crimson-love",
        status: "draft",
        language: "ta",
        partnerOne: "பிரியா",
        partnerTwo: "அருண்",
        eventDate: daysFromNow(150),
        eventTime: "18:00",
        // venue, address and RSVP deadline left empty on purpose → "3 details left before publishing"
        guests: [["Ravi Kumar", "077 555 6666", "", "Added before publishing", P, false]],
    },
    {
        owner: "host",
        label: "4. Live — RSVP deadline has passed (Modern Romance)",
        templateKey: "modern-romance",
        status: "published",
        language: "en",
        partnerOne: "Sachini",
        partnerTwo: "Dilan",
        message: "invite you to an intimate garden ceremony",
        eventDate: daysFromNow(10),
        eventTime: "17:00",
        venueName: "Kandy Garden Club",
        address: "Peradeniya Road, Kandy",
        dressCode: "Garden formal",
        rsvpDeadline: daysFromNow(-3),
        guests: [
            ["Chamari Atapattu", "077 666 7777", "", "", A, true],
            ["Nuwan Kulasekara", "", "", "Never replied", P, true],
            ["Hasini Perera", "071 777 8888", "", "", D, true],
        ],
    },
    {
        owner: "host",
        label: "5. Unpublished (Pure Elegance)",
        templateKey: "pure-elegance",
        status: "unpublished",
        language: "en",
        partnerOne: "Ishan",
        partnerTwo: "Kavya",
        eventDate: daysFromNow(200),
        eventTime: "19:00",
        venueName: "Cinnamon Grand",
        address: "77 Galle Road, Colombo 03",
        rsvpDeadline: daysFromNow(180),
        guests: [["Ashan Silva", "077 888 9999", "", "Link should say 'not available'", P, true]],
    },
    {
        owner: "other",
        label: "6. Another user's invitation (for privacy testing)",
        templateKey: "royal-red",
        status: "published",
        language: "en",
        partnerOne: "Kasun",
        partnerTwo: "Hiruni",
        eventDate: daysFromNow(90),
        eventTime: "15:00",
        venueName: "Waters Edge",
        address: "Battaramulla",
        rsvpDeadline: daysFromNow(75),
        guests: [["Saman Kumara", "077 999 0000", "", "", P, false]],
    },
];

async function main() {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Refusing to load demo data in production.");
    }
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing from .env");

    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

    // Templates must exist first
    for (const t of templates) await Template.updateOne({ key: t.key }, { $set: t }, { upsert: true, runValidators: true });
    const templateByKey = Object.fromEntries((await Template.find({})).map((t) => [t.key, t]));

    // Remove previous demo data (demo accounts only)
    const old = await User.find({ email: { $in: DEMO_USERS.map((u) => u.email) } });
    const oldIds = old.map((u) => u._id);
    await Guest.deleteMany({ owner: { $in: oldIds } });
    await Invitation.deleteMany({ owner: { $in: oldIds } });
    await User.deleteMany({ _id: { $in: oldIds } });

    // Accounts
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    const users = {};
    for (const u of DEMO_USERS) users[u.key] = await User.create({ name: u.name, email: u.email, passwordHash });

    // Invitations + guests
    const report = [];
    for (const spec of INVITATIONS) {
        const { owner, label, guests, templateKey, ...fields } = spec;
        const template = templateByKey[templateKey];
        const invitation = await Invitation.create({
            ...fields,
            owner: users[owner]._id,
            template: template._id,
            templateKey,
            templateVersion: template.version,
            publishedAt: fields.status === "draft" ? undefined : new Date(),
        });

        const links = [];
        for (const [name, phone, email, notes, rsvpStatus, shared] of guests) {
            const { token, tokenHash, tokenEncrypted } = newGuestToken();
            await Guest.create({
                invitation: invitation._id,
                owner: users[owner]._id,
                name,
                phone: phone.replace(/[^\d+]/g, ""),
                email,
                notes,
                tokenHash,
                tokenEncrypted,
                rsvpStatus,
                respondedAt: rsvpStatus === P ? undefined : new Date(Date.now() - Math.random() * 5 * 86400000),
                sharedAt: shared ? new Date(Date.now() - 6 * 86400000) : undefined,
            });
            links.push({ name, rsvpStatus, link: guestLink(token) });
        }
        report.push({ label, owner: users[owner].email, id: invitation._id.toString(), links });
    }

    // Print what was created
    const line = "─".repeat(78);
    console.log(`\n${line}\nDEMO DATA READY\n${line}`);
    console.log("Sign in at  " + (process.env.CLIENT_URL || "http://localhost:5173") + "/signin");
    for (const u of DEMO_USERS) console.log(`  ${u.email.padEnd(26)} password: ${PASSWORD}   (${u.name})`);
    for (const r of report) {
        console.log(`\n${r.label}   [${r.owner}]`);
        console.log(`  editor:  ${(process.env.CLIENT_URL || "http://localhost:5173")}/invitations/${r.id}/edit`);
        for (const g of r.links) console.log(`  ${g.name.padEnd(24)} ${g.rsvpStatus.padEnd(14)} ${g.link}`);
    }
    console.log(`\n${line}`);
}

main()
    .catch((err) => {
        console.error("Demo seeding failed:", err.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
