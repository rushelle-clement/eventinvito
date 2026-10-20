// Shared setup for the automated tests (npm test).
//
// Each test file gets its own temporary, in-memory MongoDB (mongodb-memory-server), so tests
// never touch your real Atlas database. The first run downloads a MongoDB binary (~100 MB),
// which is cached afterwards. To use another database instead, set MONGODB_TEST_URI.

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET_TEST || "test-secret-only-for-automated-tests-0123456789";
process.env.CLIENT_URL = "http://localhost:5173";

const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const Template = require("../src/models/Template");
const User = require("../src/models/User");
const Guest = require("../src/models/Guest");
const Invitation = require("../src/models/Invitation");
const templates = require("../src/data/templates");

let mongod;

async function startDb() {
    if (process.env.MONGODB_TEST_URI) {
        await mongoose.connect(process.env.MONGODB_TEST_URI);
    } else {
        const { MongoMemoryServer } = require("mongodb-memory-server");
        mongod = await MongoMemoryServer.create();
        await mongoose.connect(mongod.getUri());
    }
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.dropDatabase();
        // Build unique indexes (email, guest link) before tests rely on them
        await Promise.all([User.init(), Guest.init(), Invitation.init(), Template.init()]);
    }
    for (const t of templates) await Template.updateOne({ key: t.key }, { $set: t }, { upsert: true });
    // One unpublished template, to check customers can't use it
    await Template.updateOne(
        { key: "secret-draft" },
        { $set: { key: "secret-draft", name: "Unreleased", status: "draft", version: 1 } },
        { upsert: true }
    );
}

async function stopDb() {
    if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
}

const api = () => request(app);

let counter = 0;
async function registerUser(name = "Test User") {
    counter += 1;
    const email = `user${counter}-${Date.now()}@test.local`;
    const res = await api().post("/api/auth/register").send({ name, email, password: "Password123" });
    if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
    return { token: res.body.token, user: res.body.user, email, password: "Password123" };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// Date string N days from today in Sri Lanka time (the default event time zone)
function colomboDay(offsetDays = 0) {
    const d = new Date(Date.now() + offsetDays * 86400000);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

const COMPLETE = () => ({
    partnerOne: "Amaya",
    partnerTwo: "Nuwan",
    eventDate: colomboDay(60),
    eventTime: "16:00",
    venueName: "Mount Lavinia Hotel",
    address: "Mount Lavinia",
    rsvpDeadline: colomboDay(30),
});

async function createInvitation(token, fields = {}, templateKey = "pure-elegance") {
    const res = await api().post("/api/invitations").set(auth(token)).send({ templateKey });
    if (res.status !== 201) throw new Error(`create failed: ${res.status} ${JSON.stringify(res.body)}`);
    const id = res.body.invitation.id;
    if (Object.keys(fields).length) {
        const upd = await api().patch(`/api/invitations/${id}`).set(auth(token)).send(fields);
        if (upd.status !== 200) throw new Error(`update failed: ${upd.status} ${JSON.stringify(upd.body)}`);
    }
    return id;
}

async function createPublishedInvitation(token, fields = {}) {
    const id = await createInvitation(token, { ...COMPLETE(), ...fields });
    const res = await api().post(`/api/invitations/${id}/publish`).set(auth(token));
    if (res.status !== 200) throw new Error(`publish failed: ${res.status} ${JSON.stringify(res.body)}`);
    return id;
}

async function addGuest(token, invitationId, guest = {}) {
    const res = await api()
        .post(`/api/invitations/${invitationId}/guests`)
        .set(auth(token))
        .send({ name: "Amal Perera", ...guest });
    if (res.status !== 201) throw new Error(`add guest failed: ${res.status} ${JSON.stringify(res.body)}`);
    return { ...res.body.guest, token: res.body.guest.link.split("/i/")[1] };
}

module.exports = {
    startDb,
    stopDb,
    api,
    auth,
    registerUser,
    createInvitation,
    createPublishedInvitation,
    addGuest,
    colomboDay,
    COMPLETE,
    models: { User, Guest, Invitation, Template },
};
