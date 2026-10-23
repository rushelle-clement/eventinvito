// Accounts and publishing: sign-up closed, admin-made accounts, one credit per published
// invitation, and accounts closing when their invitation has ended.
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { startDb, stopDb, api, auth, registerUser, createInvitation, COMPLETE, colomboDay, models } = require("./helpers");

describe("Accounts and publish credits", () => {
    let admin;

    before(async () => {
        await startDb();
        const passwordHash = await bcrypt.hash("Admin-Password-123", 4);
        await models.User.create({ name: "Admin", email: "admin@test.local", passwordHash, role: "admin" });
        const res = await api().post("/api/auth/login").send({ email: "admin@test.local", password: "Admin-Password-123" });
        admin = res.body.token;
    });
    after(async () => {
        process.env.ALLOW_SIGNUP = "true";
        await stopDb();
    });

    const signIn = (email, password) => api().post("/api/auth/login").send({ email, password });
    const makeAccount = (body) => api().post("/api/admin/users").set(auth(admin)).send({ password: "Password123", credits: 1, ...body });

    it("keeps sign-up closed unless ALLOW_SIGNUP is true, and the site can tell", async () => {
        process.env.ALLOW_SIGNUP = "false";
        const res = await api().post("/api/auth/register").send({ name: "Self", email: "self@test.local", password: "Password123" });
        assert.equal(res.status, 403);
        assert.equal(res.body.code, "signup_closed");
        assert.equal((await api().get("/api/config")).body.signupOpen, false);
        process.env.ALLOW_SIGNUP = "true";
        assert.equal((await api().get("/api/config")).body.signupOpen, true);
    });

    it("lets only admins use the admin page", async () => {
        const customer = await registerUser("Customer");
        assert.equal((await api().get("/api/admin/users").set(auth(customer.token))).status, 403);
        assert.equal((await api().get("/api/admin/users")).status, 401);
        assert.equal((await api().get("/api/admin/users").set(auth(admin))).status, 200);
    });

    it("creates an account with one credit; it can publish one invitation, and republish it freely", async () => {
        const created = await makeAccount({ name: "Amaya", email: "amaya@test.local" });
        assert.equal(created.status, 201);
        assert.equal(created.body.user.publishCredits, 1);
        assert.equal(created.body.user.role, "customer");
        const token = (await signIn("amaya@test.local", "Password123")).body.token;

        const first = await createInvitation(token, COMPLETE());
        const second = await createInvitation(token, COMPLETE()); // drafts are free
        const pub = await api().post(`/api/invitations/${first}/publish`).set(auth(token));
        assert.equal(pub.status, 200);
        assert.equal(pub.body.user.publishCredits, 0);
        assert.equal(pub.body.invitation.paid, true);

        // Its free card can't pay for an animated design
        const refused = await api().post(`/api/invitations/${second}/publish`).set(auth(token));
        assert.equal(refused.status, 403);
        assert.equal(refused.body.code, "needs_premium");

        // Unpublish and publish the paid one again: no credit needed
        await api().post(`/api/invitations/${first}/unpublish`).set(auth(token));
        assert.equal((await api().post(`/api/invitations/${first}/publish`).set(auth(token))).status, 200);

        // One more credit from the admin page: the second one can go live too
        const id = created.body.user.id;
        await api().patch(`/api/admin/users/${id}`).set(auth(admin)).send({ credits: 1 });
        assert.equal((await api().post(`/api/invitations/${second}/publish`).set(auth(token))).status, 200);
        const list = await api().get("/api/admin/users").set(auth(admin)).query({ q: "amaya@" });
        assert.equal(list.body.users[0].invitations.length, 2);
        assert.equal(list.body.users[0].publishCredits, 0);
    });

    it("keeps accounts open after the event by default", async () => {
        await makeAccount({ name: "Open", email: "open@test.local" });
        const token = (await signIn("open@test.local", "Password123")).body.token;
        const id = await createInvitation(token, COMPLETE());
        await api().post(`/api/invitations/${id}/publish`).set(auth(token));
        await models.Invitation.updateOne({ _id: id }, { $set: { eventDate: colomboDay(-2), rsvpDeadline: colomboDay(-3) } });
        assert.equal((await signIn("open@test.local", "Password123")).status, 200);
    });

    it("with LOCK_AFTER_EVENT=true, closes the account when its invitation has ended; an admin can keep it open", async () => {
        process.env.LOCK_AFTER_EVENT = "true";
        const created = await makeAccount({ name: "Nuwan", email: "nuwan@test.local" });
        const token = (await signIn("nuwan@test.local", "Password123")).body.token;
        const id = await createInvitation(token, COMPLETE());
        await api().post(`/api/invitations/${id}/publish`).set(auth(token));

        // Two days after the event: the invitation has ended, so the account is closed
        await models.Invitation.updateOne({ _id: id }, { $set: { eventDate: colomboDay(-2), rsvpDeadline: colomboDay(-3) } });
        const login = await signIn("nuwan@test.local", "Password123");
        assert.equal(login.status, 403);
        assert.equal(login.body.code, "account_ended");
        assert.equal((await api().get("/api/auth/me").set(auth(token))).status, 403, "an old session is closed too");
        // A wrong password still says only "incorrect", so closed accounts can't be discovered
        assert.equal((await signIn("nuwan@test.local", "wrong-password")).status, 401);

        const listed = await api().get("/api/admin/users").set(auth(admin)).query({ q: "nuwan@" });
        assert.equal(listed.body.users[0].status, "ended");

        await api().patch(`/api/admin/users/${created.body.user.id}`).set(auth(admin)).send({ keepAccess: true });
        assert.equal((await signIn("nuwan@test.local", "Password123")).status, 200);
        delete process.env.LOCK_AFTER_EVENT;
    });

    it("gives a self-signed-up account one free card: free designs only, then a premium credit to upgrade", async () => {
        process.env.SIGNUP_CREDITS = "0";
        const reg = await api().post("/api/auth/register").send({ name: "Free", email: "free@test.local", password: "Password123" });
        process.env.SIGNUP_CREDITS = "50";
        assert.equal(reg.status, 201);
        assert.equal(reg.body.user.freeCredits, 1);
        assert.equal(reg.body.user.publishCredits, 0);
        const token = reg.body.token;
        const make = async (templateKey) => {
            const res = await api().post("/api/invitations").set(auth(token)).send({ templateKey });
            await api().patch(`/api/invitations/${res.body.invitation.id}`).set(auth(token)).send(COMPLETE());
            return res.body.invitation.id;
        };
        const publish = (id) => api().post(`/api/invitations/${id}/publish`).set(auth(token));

        const animated = await make("crimson-love");
        const premiumTry = await publish(animated);
        assert.equal(premiumTry.status, 403);
        assert.equal(premiumTry.body.code, "needs_premium");

        const card = await make("ivory-classic");
        const ok = await publish(card);
        assert.equal(ok.status, 200);
        assert.equal(ok.body.invitation.paidKind, "free");
        assert.equal(ok.body.user.freeCredits, 0);

        const another = await make("simple-lotus");
        const second = await publish(another);
        assert.equal(second.status, 403);
        assert.equal(second.body.code, "no_credit");

        // The live free card can't switch to an animated design without a premium credit
        const sw = await api().patch(`/api/invitations/${card}`).set(auth(token)).send({ templateKey: "noir-rouge" });
        assert.equal(sw.status, 403);
        assert.equal(sw.body.code, "needs_premium");

        // After paying: the admin adds a premium credit, and the switch uses it
        const me = await api().get("/api/auth/me").set(auth(token));
        await api().patch(`/api/admin/users/${me.body.user.id}`).set(auth(admin)).send({ credits: 1 });
        const upgraded = await api().patch(`/api/invitations/${card}`).set(auth(token)).send({ templateKey: "noir-rouge" });
        assert.equal(upgraded.status, 200);
        assert.equal(upgraded.body.invitation.paidKind, "premium");
        assert.equal(upgraded.body.user.publishCredits, 0);
        // Unpublish and publish again: free
        await api().post(`/api/invitations/${card}/unpublish`).set(auth(token));
        assert.equal((await publish(card)).status, 200);
    });

    it("an admin can turn an account off and on, and set a new password", async () => {
        const created = await makeAccount({ name: "Kasun", email: "kasun@test.local", credits: 0 });
        const id = created.body.user.id;
        await api().patch(`/api/admin/users/${id}`).set(auth(admin)).send({ disabled: true });
        const off = await signIn("kasun@test.local", "Password123");
        assert.equal(off.status, 403);
        assert.equal(off.body.code, "account_disabled");
        await api().patch(`/api/admin/users/${id}`).set(auth(admin)).send({ disabled: false, password: "New-Password-1" });
        assert.equal((await signIn("kasun@test.local", "New-Password-1")).status, 200);
        assert.equal((await api().patch(`/api/admin/users/${id}`).set(auth(admin)).send({ credits: 999 })).status, 400);
    });

    it("an admin can't turn off their own account, and admin accounts never close", async () => {
        const me = await api().get("/api/auth/me").set(auth(admin));
        const res = await api().patch(`/api/admin/users/${me.body.user.id}`).set(auth(admin)).send({ disabled: true });
        assert.equal(res.status, 400);
    });

    it("lists accounts a page at a time, newest first", async () => {
        for (let n = 0; n < 12; n++) await makeAccount({ name: `Page Test ${n}`, email: `page${n}@test.local`, credits: 0 });
        const first = await api().get("/api/admin/users").set(auth(admin)).query({ q: "page", limit: 10 });
        assert.equal(first.body.total, 12);
        assert.equal(first.body.pages, 2);
        assert.equal(first.body.users.length, 10);
        assert.equal(first.body.users[0].email, "page11@test.local");
        const second = await api().get("/api/admin/users").set(auth(admin)).query({ q: "page", limit: 10, page: 2 });
        assert.equal(second.body.page, 2);
        assert.equal(second.body.users.length, 2);
        const beyond = await api().get("/api/admin/users").set(auth(admin)).query({ q: "page", limit: 10, page: 99 });
        assert.equal(beyond.body.page, 2, "a page past the end shows the last page");
    });
});
