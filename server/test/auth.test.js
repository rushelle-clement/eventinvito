// Accounts: FR-001, FR-002, NFR-003
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, models } = require("./helpers");

describe("Accounts and sign-in", () => {
    before(startDb);
    after(stopDb);

    it("rejects invalid sign-up details with a message per field", async () => {
        const res = await api().post("/api/auth/register").send({ name: "", email: "not-an-email", password: "short" });
        assert.equal(res.status, 400);
        assert.ok(res.body.errors.name);
        assert.ok(res.body.errors.email);
        assert.ok(res.body.errors.password);
    });

    it("creates an account, stores only a hash of the password, and never returns it", async () => {
        const res = await api().post("/api/auth/register").send({ name: "Amaya", email: "Amaya@Example.com", password: "Password123" });
        assert.equal(res.status, 201);
        assert.ok(res.body.token);
        assert.equal(res.body.user.email, "amaya@example.com");
        assert.ok(!JSON.stringify(res.body).includes("passwordHash"));

        const stored = await models.User.findOne({ email: "amaya@example.com" }).select("+passwordHash");
        assert.notEqual(stored.passwordHash, "Password123");
        assert.match(stored.passwordHash, /^\$2[aby]\$/);
    });

    it("rejects a second account with the same email, whatever the letter case", async () => {
        const res = await api().post("/api/auth/register").send({ name: "Copy", email: "AMAYA@example.com", password: "Password123" });
        assert.equal(res.status, 409);
    });

    it("ignores an attempt to sign up as an admin", async () => {
        const res = await api().post("/api/auth/register").send({ name: "Sneaky", email: "sneaky@example.com", password: "Password123", role: "admin" });
        assert.equal(res.status, 201);
        assert.equal(res.body.user.role, "customer");
    });

    it("gives the same message for a wrong password and an unknown email", async () => {
        const wrong = await api().post("/api/auth/login").send({ email: "amaya@example.com", password: "WrongPassword" });
        const unknown = await api().post("/api/auth/login").send({ email: "nobody@example.com", password: "Password123" });
        assert.equal(wrong.status, 401);
        assert.equal(unknown.status, 401);
        assert.equal(wrong.body.message, unknown.body.message);
    });

    it("checks the sign-in fields before looking up the account", async () => {
        const empty = await api().post("/api/auth/login").send({});
        assert.equal(empty.status, 400);
        assert.ok(empty.body.errors.email);
        assert.ok(empty.body.errors.password);
        const bad = await api().post("/api/auth/login").send({ email: "not-an-email", password: "Password123" });
        assert.equal(bad.status, 400);
        assert.ok(bad.body.errors.email);
        const long = await api().post("/api/auth/login").send({ email: "amaya@example.com", password: "x".repeat(129) });
        assert.equal(long.status, 400);
        assert.ok(long.body.errors.password);
    });

    it("signs in with any letter case in the email", async () => {
        const res = await api().post("/api/auth/login").send({ email: "AMAYA@EXAMPLE.COM", password: "Password123" });
        assert.equal(res.status, 200);
        assert.ok(res.body.token);
    });

    it("rejects database operators sent instead of an email (NoSQL injection)", async () => {
        const res = await api().post("/api/auth/login").send({ email: { $gt: "" }, password: { $gt: "" } });
        assert.ok([400, 401].includes(res.status));
        assert.ok(!res.body.token);
    });

    it("protects /me: no token, a fake token, and a valid token", async () => {
        assert.equal((await api().get("/api/auth/me")).status, 401);
        assert.equal((await api().get("/api/auth/me").set(auth("not.a.token"))).status, 401);
        const { token, email } = await registerUser("Kasun");
        const me = await api().get("/api/auth/me").set(auth(token));
        assert.equal(me.status, 200);
        assert.equal(me.body.user.email, email);
    });

    it("stops accepting a token once the account is deleted", async () => {
        const { token, user } = await registerUser("Temporary");
        await models.User.deleteOne({ _id: user.id });
        assert.equal((await api().get("/api/auth/me").set(auth(token))).status, 401);
    });
});
