// Birthday invitations: one person (celebrant) and their age instead of a couple
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, addGuest, COMPLETE } = require("./helpers");

describe("Birthdays", () => {
    let owner;
    before(async () => {
        await startDb();
        owner = await registerUser("Parent");
    });
    after(stopDb);

    const patch = (id, body) => api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send(body);
    const get = async (id) => (await api().get(`/api/invitations/${id}`).set(auth(owner.token))).body.invitation;
    const { partnerOne, partnerTwo, ...EVENT } = COMPLETE();

    it("lists the birthday designs under birthday", async () => {
        const list = (await api().get("/api/templates")).body.templates.filter((t) => t.eventType === "birthday");
        assert.deepEqual(
            list.map((t) => t.key),
            ["balloon-bash", "ocean-adventure", "fairy-garden", "midnight-gala", "rose-wish", "confetti-pop", "little-star", "blush-bloom", "black-gold", "rose-bubbles"]
        );
        assert.ok(list.every((t) => t.supportedFields.includes("age") && !t.supportedFields.includes("partnerOne")));
    });

    it("makes a birthday invitation from a birthday design, needing a name instead of two", async () => {
        const id = await createInvitation(owner.token, {}, "confetti-pop");
        const inv = await get(id);
        assert.equal(inv.eventType, "birthday");
        assert.ok(inv.missingForPublish.includes("celebrant"));
        assert.ok(!inv.missingForPublish.includes("partnerOne"));

        assert.equal((await patch(id, { ...EVENT, celebrant: "Kavindi", age: 5 })).status, 200);
        const done = await get(id);
        assert.equal(done.celebrant, "Kavindi");
        assert.equal(done.age, 5);
        assert.deepEqual(done.missingForPublish, []);
        assert.equal((await api().post(`/api/invitations/${id}/publish`).set(auth(owner.token))).status, 200);

        const g = await addGuest(owner.token, id);
        const view = (await api().get(`/api/invite/${g.token}`)).body.invitation;
        assert.equal(view.celebrant, "Kavindi");
        assert.equal(view.age, 5);
        assert.equal(view.eventType, "birthday");
    });

    it("checks the age and lets it be left out", async () => {
        const id = await createInvitation(owner.token, {}, "black-gold");
        for (const bad of [-1, 121, 2.5, "ten", "1e2"]) assert.equal((await patch(id, { age: bad })).status, 400, `age ${bad}`);
        assert.equal((await patch(id, { age: "30" })).status, 200);
        assert.equal((await get(id)).age, 30);
        assert.equal((await patch(id, { age: "" })).status, 200);
        assert.equal((await get(id)).age, null);
    });

    it("keeps birthdays and couple invitations to their own designs", async () => {
        const bday = await createInvitation(owner.token, {}, "little-star");
        const res = await patch(bday, { templateKey: "ivory-classic" });
        assert.equal(res.status, 400);
        assert.match(res.body.errors.templateKey, /birthday design/);
        assert.equal((await patch(bday, { templateKey: "blush-bloom" })).status, 200);
        assert.equal((await patch(bday, { eventType: "wedding" })).status, 200);
        assert.equal((await get(bday)).eventType, "birthday", "a birthday stays a birthday");

        const wedding = await createInvitation(owner.token);
        assert.equal((await patch(wedding, { templateKey: "confetti-pop" })).status, 400);
        assert.equal((await patch(wedding, { eventType: "birthday" })).status, 400);
        const made = await api().post("/api/invitations").set(auth(owner.token)).send({ templateKey: "ivory-classic", eventType: "birthday" });
        assert.equal(made.status, 400);
    });
});
