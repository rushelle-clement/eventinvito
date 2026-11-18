// Christmas party invitations: a party title and its hosts; they keep to Christmas designs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation } = require("./helpers");

describe("Christmas invitations", () => {
    before(startDb);
    after(stopDb);
    const patch = (token, id, body) => api().patch(`/api/invitations/${id}`).set(auth(token)).send(body);

    it("lists the Christmas designs, and makes a Christmas invitation with its own fields", async () => {
        const list = (await api().get("/api/templates")).body.templates.filter((t) => t.eventType === "christmas");
        assert.ok(list.length >= 5);
        assert.ok(list.every((t) => t.supportedFields.includes("eventTitle") && !t.supportedFields.includes("partnerOne")));

        const host = await registerUser("Perera");
        const id = await createInvitation(host.token, {}, "classic-noel");
        let inv = (await api().get(`/api/invitations/${id}`).set(auth(host.token))).body.invitation;
        assert.equal(inv.eventType, "christmas");
        assert.deepEqual(inv.missingForPublish.slice(0, 2), ["companyName", "eventTitle"]);

        const res = await patch(host.token, id, { companyName: "The Pereras", eventTitle: "Christmas Party" });
        assert.equal(res.status, 200);
        inv = res.body.invitation;
        assert.equal(inv.companyName, "The Pereras");
        assert.equal(inv.eventTitle, "Christmas Party");
        // stays a Christmas invitation, and no day plan
        assert.equal((await patch(host.token, id, { eventType: "wedding" })).body.invitation.eventType, "christmas");
        assert.equal((await patch(host.token, id, { agenda: [{ time: "18:00", title: "Dinner" }] })).status, 400);
    });

    it("keeps Christmas invitations to Christmas designs, and the other way round", async () => {
        const host = await registerUser("Perera");
        const id = await createInvitation(host.token, {}, "candy-cane");
        const toWedding = await patch(host.token, id, { templateKey: "pure-elegance" });
        assert.equal(toWedding.status, 400);
        assert.match(toWedding.body.errors.templateKey, /Christmas design/);
        assert.equal((await patch(host.token, id, { templateKey: "silent-night" })).status, 200);

        const wedding = await createInvitation(host.token);
        assert.equal((await patch(host.token, wedding, { templateKey: "golden-star" })).status, 400);
        assert.equal((await patch(host.token, wedding, { eventType: "christmas" })).status, 400);
    });
});
