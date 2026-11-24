// Choosing a package when signing up: Free works straight away; the others wait for payment and the
// admin activates them. Printed Cards accounts get no free online card.
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, models } = require("./helpers");

let n = 0;
async function signUp(pkg) {
    n += 1;
    const email = `pkg${n}-${Date.now()}@test.local`;
    const res = await api()
        .post("/api/auth/register")
        .send({ name: `Couple ${n}`, email, password: "Password123", ...(pkg !== undefined && { package: pkg }) });
    return { res, email, token: res.body.token, id: res.body.user?.id };
}

describe("Choosing a package at sign-up", () => {
    let admin;
    before(async () => {
        await startDb();
        process.env.SIGNUP_CREDITS = "0"; // real sign-ups get no Premium credits
        admin = await registerUser("Admin");
        await models.User.updateOne({ email: admin.email }, { $set: { role: "admin" } });
    });
    after(async () => {
        process.env.SIGNUP_CREDITS = "50";
        await stopDb();
    });

    it("Free (or nothing chosen) works straight away with one free card", async () => {
        for (const pkg of [undefined, "free"]) {
            const { res } = await signUp(pkg);
            assert.equal(res.status, 201);
            assert.equal(res.body.user.requestedPlan, null);
            assert.equal(res.body.user.plan, "free");
            assert.equal(res.body.user.freeCredits, 1);
        }
        assert.equal((await signUp("gold")).res.status, 400);
    });

    it("a paid package waits for payment: drafts use its limits, publishing a Premium design doesn't work yet", async () => {
        const { res, token } = await signUp("plus");
        assert.equal(res.status, 201);
        assert.equal(res.body.user.requestedPlan, "plus");
        assert.equal(res.body.user.plan, "free");
        assert.equal(res.body.user.publishCredits, 0);
        assert.equal(res.body.user.freeCredits, 0, "only Simple Card comes with the free card");

        const draft = await api().post("/api/invitations").set(auth(token)).send({ templateKey: "pure-elegance" });
        assert.equal(draft.status, 201);
        assert.equal(draft.body.invitation.limits.plan, "plus");
        assert.equal(draft.body.invitation.limits.guests, 300);
    });

    it("Printed Cards: no free card, can start printed cards while waiting, can't publish until activated", async () => {
        const { res, token, id } = await signUp("printed");
        assert.equal(res.body.user.requestedPlan, "printed");
        assert.equal(res.body.user.freeCredits, 0);
        assert.equal(res.body.user.printedCredits, 0);

        const inv = await api().post("/api/invitations").set(auth(token)).send({ printed: true, eventType: "wedding" });
        assert.equal(inv.status, 201);
        assert.equal(inv.body.invitation.limits.plan, "printed");

        // Admin activates: one printed-cards credit, still no free card
        const act = await api().post(`/api/admin/users/${id}/activate`).set(auth(admin.token));
        assert.equal(act.status, 200);
        assert.equal(act.body.user.requestedPlan, null);
        assert.equal(act.body.user.printedCredits, 1);
        assert.equal(act.body.user.freeCredits, 0);
        assert.equal((await api().post(`/api/admin/users/${id}/activate`).set(auth(admin.token))).body.code, "not_waiting");
    });

    it("the admin sees who is waiting and activates a paid package with its Premium credit", async () => {
        const { email, id } = await signUp("premium");
        const list = await api().get(`/api/admin/users?waiting=1&q=${encodeURIComponent(email)}`).set(auth(admin.token));
        assert.equal(list.status, 200);
        assert.equal(list.body.users.length, 1);
        assert.equal(list.body.users[0].requestedPlan, "premium");
        assert.ok(list.body.waiting >= 1);

        const act = await api().post(`/api/admin/users/${id}/activate`).set(auth(admin.token));
        assert.equal(act.body.user.plan, "premium");
        assert.equal(act.body.user.publishCredits, 1);
        assert.equal(act.body.user.freeCredits, 0);
        const after = await api().get(`/api/admin/users?waiting=1&q=${encodeURIComponent(email)}`).set(auth(admin.token));
        assert.equal(after.body.users.length, 0);
    });

    it("the couple can change their choice until it's activated; only Simple Card has the free card", async () => {
        const { token, id } = await signUp("premium");
        const change = (pkg) => api().patch("/api/auth/me/package").set(auth(token)).send({ package: pkg });
        let r = await change("printed");
        assert.equal(r.status, 200);
        assert.equal(r.body.user.requestedPlan, "printed");
        assert.equal(r.body.user.freeCredits, 0);
        r = await change("free");
        assert.equal(r.body.user.requestedPlan, null);
        assert.equal(r.body.user.freeCredits, 1);
        r = await change("signature");
        assert.equal(r.body.user.requestedPlan, "signature");
        assert.equal(r.body.user.freeCredits, 0);

        await api().post(`/api/admin/users/${id}/activate`).set(auth(admin.token));
        const late = await change("plus");
        assert.equal(late.status, 403);
        assert.equal(late.body.code, "package_active");
    });

    it("setting the package by hand on the admin page also settles the request", async () => {
        const { id } = await signUp("plus");
        const r = await api().patch(`/api/admin/users/${id}`).set(auth(admin.token)).send({ plan: "plus", credits: 1 });
        assert.equal(r.body.user.requestedPlan, null);
    });

    it("Premium couples can't add printed cards: a QR code is Premium Plus", async () => {
        for (const pkg of ["premium", "plus"]) {
            const { token } = await signUp(pkg); // waiting for payment
            const res = await api().post("/api/invitations").set(auth(token)).send({ printed: true, eventType: "wedding" });
            assert.equal(res.status, 403);
            assert.equal(res.body.code, "needs_plus");
        }
        const { token, id } = await signUp("premium");
        await api().post(`/api/admin/users/${id}/activate`).set(auth(admin.token));
        await api().patch(`/api/admin/users/${id}`).set(auth(admin.token)).send({ printedCredits: 1 });
        const res = await api().post("/api/invitations").set(auth(token)).send({ printed: true, eventType: "wedding" });
        assert.equal(res.status, 403);
        assert.equal(res.body.code, "needs_plus");
    });

    it("after the free online card is used, printed cards aren't offered (that's Premium Plus)", async () => {
        const { token, id } = await signUp("free");
        const tpl = await models.Template.findOne({ key: "ivory-classic" });
        await models.Invitation.create({
            owner: id,
            template: tpl._id,
            templateKey: tpl.key,
            templateVersion: tpl.version || 1,
            eventType: "wedding",
            status: "published",
            creditUsed: true,
            creditKind: "free",
        });
        const change = await api().patch("/api/auth/me/package").set(auth(token)).send({ package: "printed" });
        assert.equal(change.status, 400);
        assert.equal(change.body.code, "used_free_card");
        // Choosing Premium Plus is fine (then back to Simple Card for the next check)
        assert.equal((await api().patch("/api/auth/me/package").set(auth(token)).send({ package: "plus" })).status, 200);
        assert.equal((await api().patch("/api/auth/me/package").set(auth(token)).send({ package: "free" })).status, 200);

        await models.User.updateOne({ _id: id }, { $set: { printedCredits: 1 } });
        const res = await api().post("/api/invitations").set(auth(token)).send({ printed: true, eventType: "wedding" });
        assert.equal(res.status, 403);
        assert.equal(res.body.code, "used_free_card");

    });

    it("giving a free account a paid package by hand replaces its free card", async () => {
        const { id } = await signUp("free");
        const r = await api().patch(`/api/admin/users/${id}`).set(auth(admin.token)).send({ plan: "premium", credits: 1 });
        assert.equal(r.body.user.freeCredits, 0);
        assert.equal(r.body.user.publishCredits, 1);
    });
});
