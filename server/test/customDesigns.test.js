// Signature custom designs: private to the couple until their event is over, then in the collection
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, colomboDay, COMPLETE, models } = require("./helpers");
const { releaseFinishedDesigns } = require("../src/utils/customDesigns");

describe("Custom designs", () => {
    let couple;
    let other;

    before(async () => {
        await startDb();
        couple = await registerUser("Amaya");
        other = await registerUser("Someone Else");
        // A design made for Amaya: reuses an existing design's component for the test
        await models.Template.create({ key: "amaya-custom", name: "Amaya & Nuwan", status: "published", tier: "premium", reservedFor: couple.email });
    });
    after(stopDb);

    const keys = async (token) => (await api().get("/api/templates").set(token ? auth(token) : {})).body.templates.map((t) => t.key);

    it("shows the design only to its couple (and admins)", async () => {
        assert.ok(!(await keys()).includes("amaya-custom"), "not in the public gallery");
        assert.ok(!(await keys(other.token)).includes("amaya-custom"), "not for other couples");
        const mine = (await api().get("/api/templates").set(auth(couple.token))).body.templates.find((t) => t.key === "amaya-custom");
        assert.equal(mine.custom, true);
        assert.ok(!("reservedFor" in mine), "the couple isn't shown the email field");

        assert.equal((await api().get("/api/templates/amaya-custom")).status, 404);
        assert.equal((await api().get("/api/templates/amaya-custom").set(auth(other.token))).status, 404);
        assert.equal((await api().get("/api/templates/amaya-custom").set(auth(couple.token))).status, 200);
        assert.equal((await api().get("/api/templates").set({ Authorization: "Bearer broken" })).status, 200, "a bad token just means signed out");
    });

    it("lets only the couple use it", async () => {
        const res = await api().post("/api/invitations").set(auth(other.token)).send({ templateKey: "amaya-custom" });
        assert.equal(res.status, 400);
        const id = await createInvitation(other.token);
        assert.equal((await api().patch(`/api/invitations/${id}`).set(auth(other.token)).send({ templateKey: "amaya-custom" })).status, 400);
        assert.ok(await createInvitation(couple.token, {}, "amaya-custom"));
    });

    it("joins the collection once the couple's event is over", async () => {
        const id = await createPublishedInvitation(couple.token);
        await api().patch(`/api/invitations/${id}`).set(auth(couple.token)).send({ templateKey: "amaya-custom" });
        await releaseFinishedDesigns({ force: true });
        assert.ok(!(await keys()).includes("amaya-custom"), "still private before the event");

        await models.Invitation.updateOne({ _id: id }, { $set: { eventDate: colomboDay(-3), rsvpDeadline: colomboDay(-5), ceremonies: [] } });
        await releaseFinishedDesigns({ force: true });
        assert.ok((await keys()).includes("amaya-custom"), "public after the event");
        const t = (await api().get("/api/templates")).body.templates.find((x) => x.key === "amaya-custom");
        assert.ok(!t.custom);
    });

    describe("from the admin page", () => {
        let admin;
        before(async () => {
            const a = await registerUser("Admin", { plan: null });
            await models.User.updateOne({ email: a.email }, { $set: { role: "admin" } });
            admin = a.token;
            await models.Template.create({ key: "made-for-dilini", name: "Dilini & Kasun", status: "published", tier: "premium", custom: true });
        });
        const assign = (key, body) => api().patch(`/api/admin/custom-designs/${key}`).set(auth(admin)).send(body);

        it("keeps a new custom design hidden until it's given to a couple", async () => {
            assert.ok(!(await keys()).includes("made-for-dilini"));
            assert.ok(!(await keys(other.token)).includes("made-for-dilini"));
            assert.ok((await keys(admin)).includes("made-for-dilini"), "admins can see it");
            const list = (await api().get("/api/admin/custom-designs").set(auth(admin))).body.designs;
            assert.equal(list.find((d) => d.key === "made-for-dilini").status, "unassigned");
            assert.equal((await api().get("/api/admin/custom-designs").set(auth(other.token))).status, 403);
        });

        it("gives it to one couple's account, checking the email", async () => {
            const dilini = await registerUser("Dilini", { plan: "signature" });
            assert.equal((await assign("made-for-dilini", { reservedFor: "nobody@test.local" })).status, 400);
            const res = await assign("made-for-dilini", { reservedFor: dilini.email.toUpperCase() });
            assert.equal(res.status, 200);
            assert.equal(res.body.design.status, "private");
            assert.equal(res.body.design.ownerName, "Dilini");
            assert.ok((await keys(dilini.token)).includes("made-for-dilini"));
            assert.ok(!(await keys(other.token)).includes("made-for-dilini"));

            const accounts = (await api().get(`/api/admin/users?q=${encodeURIComponent(dilini.email)}`).set(auth(admin))).body.users;
            assert.deepEqual(accounts[0].customDesigns, [{ key: "made-for-dilini", name: "Dilini & Kasun" }]);
        });

        it("keeps the last Premium invitation for the custom design: custom + one more Premium + the free card", async () => {
            const kasun = await registerUser("Kasun", { plan: "signature" });
            await models.User.updateOne({ email: kasun.email }, { $set: { publishCredits: 2, freeCredits: 1 } });
            await models.Template.create({ key: "made-for-kasun", name: "Kasun & Nethmi", status: "published", tier: "premium", custom: true });
            await assign("made-for-kasun", { reservedFor: kasun.email });

            await createPublishedInvitation(kasun.token); // one Premium design: fine
            const second = await createInvitation(kasun.token, COMPLETE());
            const refused = await api().post(`/api/invitations/${second}/publish`).set(auth(kasun.token));
            assert.equal(refused.status, 403);
            assert.equal(refused.body.code, "kept_for_custom");
            assert.match(refused.body.message, /Kasun & Nethmi/);

            const card = await createInvitation(kasun.token, COMPLETE(), "ivory-classic");
            assert.equal((await api().post(`/api/invitations/${card}/publish`).set(auth(kasun.token))).status, 200, "the free card still works");

            const custom = await createInvitation(kasun.token, COMPLETE(), "made-for-kasun");
            assert.equal((await api().post(`/api/invitations/${custom}/publish`).set(auth(kasun.token))).status, 200, "the custom design uses the kept one");
            const me = (await api().get("/api/auth/me").set(auth(kasun.token))).body.user;
            assert.equal(me.publishCredits, 0);
            assert.equal(me.freeCredits, 0);
        });

        it("adds it to the collection when the admin chooses", async () => {
            const res = await assign("made-for-dilini", { release: true });
            assert.equal(res.body.design.status, "collection");
            assert.ok((await keys()).includes("made-for-dilini"));
            assert.equal((await assign("made-for-dilini", { reservedFor: "" })).status, 400, "can't be made private again");
        });
    });
});
