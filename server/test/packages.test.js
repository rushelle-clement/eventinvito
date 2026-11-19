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
        assert.deepEqual(limits, {
            plan: "plus", planName: "Premium Plus", guests: 300, photos: 6, ownMusic: true, export: true, agenda: true,
            rsvpDeadline: true, openDetails: true, visitDetails: true, import: true, groups: true, groupStats: true, bulkGroups: true, qrRsvp: true, onlineCards: true,
        });

        // A free design on an account with its free card left is a Simple Card
        const card = await createInvitation(plus.token, {}, "ivory-classic");
        assert.equal((await get(plus.token, card)).body.invitation.limits.plan, "free");

        const premium = await registerUser("Premium couple", { plan: "premium" });
        const p = (await get(premium.token, await createInvitation(premium.token))).body.invitation.limits;
        assert.deepEqual(p, {
            plan: "premium", planName: "Premium", guests: 150, photos: 3, ownMusic: false, export: false, agenda: false,
            rsvpDeadline: true, openDetails: true, visitDetails: false, import: true, groups: true, groupStats: true, bulkGroups: true, qrRsvp: false, onlineCards: true,
        });
    });

    it("limits a free card to 50 guests, added one at a time (importing is Premium)", async () => {
        const free = await registerUser("Free couple", { plan: "free" });
        const id = await createInvitation(free.token, {}, "ivory-classic");
        const imp = await importRows(free.token, id, rows(5));
        assert.equal(imp.status, 403);
        assert.equal(imp.body.code, "needs_plan");

        for (let i = 1; i <= 50; i++) await addGuest(free.token, id, { name: `Guest ${i}` });
        const over = await api().post(`/api/invitations/${id}/guests`).set(auth(free.token)).send({ name: "Guest 51" });
        assert.equal(over.status, 403);
        assert.equal(over.body.code, "guest_limit");
        assert.match(over.body.message, /Upgrade your package/);
    });

    it("gives each package its guest-list features", async () => {
        const free = await registerUser("Free couple", { plan: "free" });
        const freeId = await createInvitation(free.token, {}, "ivory-classic");
        // Simple Card: no groups, no per-guest opening detail, no "opened, no reply"
        const noGroup = await api().post(`/api/invitations/${freeId}/guests`).set(auth(free.token)).send({ name: "A", group: "Office" });
        assert.equal(noGroup.status, 403);
        assert.equal(noGroup.body.code, "needs_plan");
        const a = await addGuest(free.token, freeId, { name: "A" });
        await models.Guest.updateOne({ _id: a.id }, { $set: { openedAt: new Date(), lastOpenedAt: new Date(), openCount: 2 } });
        let list = (await api().get(`/api/invitations/${freeId}/guests`).set(auth(free.token))).body;
        assert.equal(list.summary.opened, 1, "the total opened count is still shown");
        assert.equal(list.summary.openedNoReply, undefined);
        assert.equal(list.guests[0].openedAt, null);
        assert.equal(list.summary.groups, undefined);

        // Premium: groups (with the group panel and bulk groups) and who opened (first open), but no visit details
        const premium = await registerUser("Premium couple", { plan: "premium" });
        const pid = await createInvitation(premium.token);
        const b = await addGuest(premium.token, pid, { name: "B", group: "Office" });
        assert.equal(b.group, "Office");
        await models.Guest.updateOne({ _id: b.id }, { $set: { openedAt: new Date(), lastOpenedAt: new Date(), openCount: 3 } });
        list = (await api().get(`/api/invitations/${pid}/guests`).set(auth(premium.token))).body;
        assert.ok(list.guests[0].openedAt);
        assert.equal(list.guests[0].lastOpenedAt, null);
        assert.equal(list.guests[0].openCount, 0);
        assert.equal(list.summary.openedNoReply, 1);
        assert.equal(list.summary.groups[0].name, "Office");
        const bulk = await api().post(`/api/invitations/${pid}/guests/group`).set(auth(premium.token)).send({ guestIds: [b.id], group: "Family" });
        assert.equal(bulk.status, 200);

        // Premium Plus: everything
        const plus = await registerUser("Plus couple", { plan: "plus" });
        const xid = await createInvitation(plus.token);
        const c = await addGuest(plus.token, xid, { name: "C", group: "Office" });
        await models.Guest.updateOne({ _id: c.id }, { $set: { openedAt: new Date(), lastOpenedAt: new Date(), openCount: 4 } });
        list = (await api().get(`/api/invitations/${xid}/guests`).set(auth(plus.token))).body;
        assert.equal(list.guests[0].openCount, 4);
        assert.ok(list.guests[0].lastOpenedAt);
        assert.equal(list.summary.groups[0].name, "Office");
        assert.equal((await api().post(`/api/invitations/${xid}/guests/group`).set(auth(plus.token)).send({ guestIds: [c.id], group: "Family" })).status, 200);
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
