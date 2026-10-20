// General API safety: NFR-003, NFR-013
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api } = require("./helpers");

describe("API safety", () => {
    before(startDb);
    after(stopDb);

    it("sends security headers and hides the framework name", async () => {
        const res = await api().get("/api/health");
        assert.equal(res.status, 200);
        assert.ok(res.headers["content-security-policy"]);
        assert.equal(res.headers["x-content-type-options"], "nosniff");
        assert.equal(res.headers["referrer-policy"], "no-referrer");
        assert.equal(res.headers["x-powered-by"], undefined);
    });

    it("answers unknown API addresses with a JSON 404", async () => {
        const res = await api().get("/api/does-not-exist");
        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
    });

    it("rejects broken JSON with a clear 400", async () => {
        const res = await api().post("/api/auth/login").set("Content-Type", "application/json").send("{bad json");
        assert.equal(res.status, 400);
    });

    it("rejects request bodies over 1 MB", async () => {
        const res = await api()
            .post("/api/auth/login")
            .set("Content-Type", "application/json")
            .send(JSON.stringify({ email: "a@b.c", password: "x".repeat(1_100_000) }));
        assert.equal(res.status, 413);
    });
});
