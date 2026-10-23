// Packages: each invitation's guest limit, own song and Excel download follow the couple's package
// (photo limits are checked in photos.test.js).
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, addGuest, models } = require("./helpers");

const SETTINGS = { CLOUDINARY_CLOUD_NAME: "testcloud", CLOUDINARY_API_KEY: "123456", CLOUDINARY_API_SECRET: "test-secret" };

const rows = (n, from = 0) => Array.from({ length: n }, (_, i) => ({ row: i + 2, name: `Guest ${from + i + 1}` }));

describe("Packages", () => {
    before(startDb);
    after(stopDb);
    beforeEach(() => Object.assign(process.env, SETTINGS));

    const get = (token, id) => api().get(`/api/invitations/${id}`).set(auth(token));
    const importRows = (token, id, list) => api().post(`/api/invitations/${id}/guests/import`).set(auth(token)).send({ rows: list, dryRun: false });

    it("tells the couple their package and its limits for each invitation", async () => {
        const plus = await registerUser("Plus couple", { plan: "plus" });
        const id = await createInvitation(plus.token);
        const { limits } = (await get(plus.token, id)).body.invitation;
        assert.deepEqual(limits, { plan: "plus", planName: "Premium Plus", guests: 300, photos: 12, ownMusic: true, export: true });

        // A free design on an account with its free card left is a Simple Card
        const card = await createInvitation(plus.token, {}, "ivory-classic");
        assert.equal((await get(plus.token, card)).body.invitation.limits.plan, "free");

        const premium = await registerUser("Premium couple", { plan: "premium" });
        const p = (await get(premium.token, await createInvitation(premium.token))).body.invitation.limits;
        assert.deepEqual(p, { plan: "premium", planName: "Premium", guests: 150, photos: 6, ownMusic: false, export: false });
    });

    it("limits a free card to 50 guests, one at a time or from Excel", async () => {
        const free = await registerUser("Free couple", { plan: "free" });
        const id = await createInvitation(free.token, {}, "ivory-classic");
        const big = await importRows(free.token, id, rows(51));
        assert.equal(big.status, 403);
        assert.equal(big.body.code, "guest_limit");
        assert.match(big.body.message, /51 guests.*Simple Card includes up to 50 guests/);

        assert.equal((await importRows(free.token, id, rows(49))).status, 200);
        await addGuest(free.token, id, { name: "Guest 50" });
        const over = await api().post(`/api/invitations/${id}/guests`).set(auth(free.token)).send({ name: "Guest 51" });
        assert.equal(over.status, 403);
        assert.equal(over.body.code, "guest_limit");
        assert.match(over.body.message, /Upgrade your package/);
    });

    it("allows 150 guests on Premium, 300 on Premium Plus and 500 on Signature", async () => {
        for (const [plan, limit] of [
            ["premium", 150],
            ["plus", 300],
            ["signature", 500],
        ]) {
            const couple = await registerUser(`${plan} couple`, { plan });
            const id = await createInvitation(couple.token);
            assert.equal((await importRows(couple.token, id, rows(limit))).status, 200, `${plan}: ${limit} guests fit`);
            const over = await api().post(`/api/invitations/${id}/guests`).set(auth(couple.token)).send({ name: "One more" });
            assert.equal(over.status, 403, `${plan}: guest ${limit + 1} is refused`);
        }
    });

    it("keeps their own song for Premium Plus and Signature", async () => {
        const premium = await registerUser("Premium couple", { plan: "premium" });
        const id = await createInvitation(premium.token);
        const res = await api().post(`/api/invitations/${id}/music/signature`).set(auth(premium.token)).send({ rightsConfirmed: true });
        assert.equal(res.status, 403);
        assert.equal(res.body.code, "needs_plus");
        const set = await api().post(`/api/invitations/${id}/music`).set(auth(premium.token)).send({ rightsConfirmed: true, publicId: "x", version: 1, signature: "x" });
        assert.equal(set.status, 403);

        const plus = await registerUser("Plus couple", { plan: "plus" });
        const mine = await createInvitation(plus.token);
        assert.equal((await api().post(`/api/invitations/${mine}/music/signature`).set(auth(plus.token)).send({ rightsConfirmed: true })).status, 200);
    });

    it("keeps an account Premium after its Premium credit is used", async () => {
        const couple = await registerUser("Older account", { plan: null });
        await models.User.updateOne({ email: couple.email }, { $set: { publishCredits: 1 } });
        const id = await createPublishedInvitation(couple.token);
        const me = await api().get("/api/auth/me").set(auth(couple.token));
        assert.equal(me.body.user.publishCredits, 0);
        assert.equal(me.body.user.plan, "premium");
        assert.equal((await get(couple.token, id)).body.invitation.limits.guests, 150);
    });

    it("lets the admin choose an account's package, with its Premium credits", async () => {
        const admin = await registerUser("Admin", { plan: null });
        await models.User.updateOne({ email: admin.email }, { $set: { role: "admin" } });
        const create = (body) => api().post("/api/admin/users").set(auth(admin.token)).send({ name: "Amaya", password: "Password123", ...body });

        const plus = await create({ email: "plus@test.local", plan: "plus" });
        assert.equal(plus.status, 201);
        assert.equal(plus.body.user.plan, "plus");
        assert.equal(plus.body.user.publishCredits, 2, "Premium Plus includes two invitations");
        assert.equal((await create({ email: "premium@test.local", plan: "premium" })).body.user.publishCredits, 1);
        assert.equal((await create({ email: "bad@test.local", plan: "gold" })).status, 400);

        const patch = await api().patch(`/api/admin/users/${plus.body.user.id}`).set(auth(admin.token)).send({ plan: "signature" });
        assert.equal(patch.body.user.plan, "signature");
        assert.equal(patch.body.user.publishCredits, 2, "changing the package alone doesn't change credits");
    });
});
