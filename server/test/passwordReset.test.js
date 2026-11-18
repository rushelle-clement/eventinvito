// Forgot password: a one-time link sent by email (through Brevo's web API, faked here).
const { describe, it, before, after, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, models } = require("./helpers");

describe("Forgot password", () => {
    let sent = [];
    const realFetch = global.fetch;
    before(startDb);
    after(stopDb);
    beforeEach(() => {
        sent = [];
        process.env.BREVO_API_KEY = "test-key";
        process.env.EMAIL_FROM = "hello@eventinvito.test";
        global.fetch = async (url, opts) => {
            sent.push({ url, headers: opts.headers, body: JSON.parse(opts.body) });
            return new Response(JSON.stringify({ messageId: "x" }), { status: 201 });
        };
    });
    afterEach(() => {
        global.fetch = realFetch;
        delete process.env.BREVO_API_KEY;
        delete process.env.EMAIL_FROM;
    });

    const forgot = (email) => api().post("/api/auth/forgot-password").send({ email });
    const reset = (token, password) => api().post("/api/auth/reset-password").send({ token, password });
    const linkFrom = (mail) => mail.body.textContent.match(/\/reset-password\/([A-Za-z0-9_-]+)/)[1];

    it("emails a one-time link through Brevo", async () => {
        const couple = await registerUser("Amaya Perera");
        const res = await forgot(couple.email.toUpperCase());
        assert.equal(res.status, 200);
        assert.match(res.body.message, /If there's an account/);
        assert.equal(sent.length, 1);
        const mail = sent[0];
        assert.equal(mail.url, "https://api.brevo.com/v3/smtp/email");
        assert.equal(mail.headers["api-key"], "test-key");
        assert.deepEqual(mail.body.to, [{ email: couple.email, name: "Amaya Perera" }]);
        assert.equal(mail.body.sender.email, "hello@eventinvito.test");
        assert.match(mail.body.subject, /Reset your EventInvito password/);
        assert.match(mail.body.htmlContent, /Choose a new password/);
        assert.match(mail.body.textContent, /^Hi Amaya,/);
        // only a hash of the secret is stored
        const stored = await models.User.findOne({ email: couple.email }).select("+resetTokenHash");
        assert.ok(stored.resetTokenHash);
        assert.notEqual(stored.resetTokenHash, linkFrom(mail));
    });

    it("gives the same answer for an unknown email, and sends nothing", async () => {
        const known = await registerUser("Known");
        const a = await forgot(known.email);
        const b = await forgot("nobody-here@test.local");
        assert.equal(b.status, 200);
        assert.equal(b.body.message, a.body.message);
        assert.equal(sent.length, 1);
        assert.equal((await forgot("not an email")).status, 400);
    });

    it("sets the new password, signs in, and works only once", async () => {
        const couple = await registerUser("Reset me");
        await forgot(couple.email);
        const token = linkFrom(sent[0]);

        assert.equal((await reset(token, "short")).status, 400);
        const ok = await reset(token, "NewPassword456");
        assert.equal(ok.status, 200);
        assert.ok(ok.body.token);
        assert.equal(ok.body.user.email, couple.email);

        assert.equal((await api().post("/api/auth/login").send({ email: couple.email, password: "Password123" })).status, 401);
        assert.equal((await api().post("/api/auth/login").send({ email: couple.email, password: "NewPassword456" })).status, 200);
        const again = await reset(token, "AnotherPass789");
        assert.equal(again.status, 400);
        assert.equal(again.body.code, "reset_invalid");
    });

    it("signs out sessions from before the reset, but not the new one", async () => {
        const couple = await registerUser("Old session");
        assert.equal((await api().get("/api/auth/me").set(auth(couple.token))).status, 200);
        await new Promise((r) => setTimeout(r, 1100)); // tokens are timed to the second
        await forgot(couple.email);
        const done = await reset(linkFrom(sent[0]), "NewPassword456");
        assert.equal((await api().get("/api/auth/me").set(auth(couple.token))).status, 401);
        assert.equal((await api().get("/api/auth/me").set(auth(done.body.token))).status, 200);
    });

    it("refuses expired, made-up and replaced links", async () => {
        const couple = await registerUser("Expired");
        await forgot(couple.email);
        const first = linkFrom(sent[0]);
        await forgot(couple.email); // a newer link replaces the older one
        assert.equal((await reset(first, "NewPassword456")).status, 400);
        const second = linkFrom(sent[1]);
        await models.User.updateOne({ email: couple.email }, { $set: { resetTokenExpires: new Date(Date.now() - 1000) } });
        assert.equal((await reset(second, "NewPassword456")).status, 400);
        assert.equal((await reset("A".repeat(43), "NewPassword456")).status, 400);
        assert.equal((await reset("../../etc", "NewPassword456")).status, 400);
    });

    it("sends nothing to a turned-off account", async () => {
        const couple = await registerUser("Disabled");
        await models.User.updateOne({ email: couple.email }, { $set: { disabled: true } });
        assert.equal((await forgot(couple.email)).status, 200);
        assert.equal(sent.length, 0);
    });

    it("still answers when email isn't set up or Brevo fails", async () => {
        const couple = await registerUser("No email");
        delete process.env.BREVO_API_KEY;
        assert.equal((await forgot(couple.email)).status, 200);
        assert.equal(sent.length, 0);
        process.env.BREVO_API_KEY = "test-key";
        const err = console.error;
        console.error = () => {};
        global.fetch = async () => new Response("bad key", { status: 401 });
        assert.equal((await forgot(couple.email)).status, 200);
        console.error = err;
    });
});
