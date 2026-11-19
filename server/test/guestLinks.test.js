// Guests and personal links: FR-040 – FR-046, BR-005 – BR-007, BR-013, NFR-004, NFR-005
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, addGuest, models } = require("./helpers");

describe("Guests and personal links", () => {
    let owner;
    let other;
    let invitationId;

    before(async () => {
        await startDb();
        owner = await registerUser("Owner");
        other = await registerUser("Someone Else");
        invitationId = await createPublishedInvitation(owner.token);
    });
    after(stopDb);

    it("gives every guest a different, long random link — even guests with the same name", async () => {
        const a = await addGuest(owner.token, invitationId, { name: "Amal Perera" });
        const b = await addGuest(owner.token, invitationId, { name: "Amal Perera" });
        assert.notEqual(a.token, b.token);
        assert.match(a.token, /^[A-Za-z0-9_-]{32}$/);
        assert.ok(!a.link.includes(a.id), "the database ID must not be part of the link");
    });

    it("never stores the link itself in the database", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Kamala Silva" });
        const stored = (await models.Guest.findById(g.id)).toObject();
        assert.ok(!JSON.stringify(stored).includes(g.token));
    });

    it("shows the guest their own name and only the invitation content", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Ruwan Fernando", phone: "0771234567", email: "ruwan@example.com" });
        const res = await api().get(`/api/invite/${g.token}`);
        assert.equal(res.status, 200);
        assert.equal(res.body.guest.name, "Ruwan Fernando");
        assert.equal(res.body.invitation.partnerOne, "Amaya");
        assert.equal(res.body.invitation.eventType, "wedding"); // the occasion picks the wording
        assert.ok("musicTrack" in res.body.invitation, "the guest page needs the music setting");
        assert.equal(res.headers["cache-control"], "no-store", "personal pages must not be cached");
        const text = JSON.stringify(res.body);
        for (const secret of ["0771234567", "ruwan@example.com", "owner", "shareMessage", "tokenHash", "guestCounts"]) {
            assert.ok(!text.includes(secret), `guest view must not include ${secret}`);
        }
    });

    it("shows the guest the name written for the invitation, when the couple adds one", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Nimal Jayasinghe", displayName: " නිමල් ජයසිංහ මහතා " });
        const res = await api().get(`/api/invite/${g.token}`);
        assert.equal(res.body.guest.name, "නිමල් ජයසිංහ මහතා");
        const list = await api().get(`/api/invitations/${invitationId}/guests`).set(auth(owner.token));
        const mine = list.body.guests.find((x) => x.id === g.id);
        assert.equal(mine.name, "Nimal Jayasinghe");
        assert.equal(mine.displayName, "නිමල් ජයසිංහ මහතා");
        const tooLong = await api().patch(`/api/invitations/${invitationId}/guests/${g.id}`).set(auth(owner.token)).send({ displayName: "x".repeat(101) });
        assert.equal(tooLong.status, 400);
        const cleared = await api().patch(`/api/invitations/${invitationId}/guests/${g.id}`).set(auth(owner.token)).send({ displayName: "" });
        assert.equal(cleared.body.guest.displayName, "");
        assert.equal((await api().get(`/api/invite/${g.token}`)).body.guest.name, "Nimal Jayasinghe");
    });

    it("treats changed, malformed or database-ID links as invalid", async () => {
        const g = await addGuest(owner.token, invitationId);
        const altered = g.token.slice(0, -1) + (g.token.endsWith("A") ? "B" : "A");
        for (const bad of [altered, "abc", g.id, `${g.token}x`]) {
            const res = await api().get(`/api/invite/${encodeURIComponent(bad)}`);
            assert.equal(res.status, 404, bad);
            assert.equal(res.body.code, "invalid_link");
        }
    });

    it("stops the old link working after a reset, and the new one works", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Nimal" });
        const reset = await api().post(`/api/invitations/${invitationId}/guests/${g.id}/reset-link`).set(auth(owner.token));
        const newToken = reset.body.guest.link.split("/i/")[1];
        assert.notEqual(newToken, g.token);
        assert.equal((await api().get(`/api/invite/${g.token}`)).status, 404);
        assert.equal((await api().get(`/api/invite/${newToken}`)).status, 200);
    });

    it("stops a removed guest's link working", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "To Remove" });
        assert.equal((await api().delete(`/api/invitations/${invitationId}/guests/${g.id}`).set(auth(owner.token))).status, 200);
        assert.equal((await api().get(`/api/invite/${g.token}`)).status, 404);
    });

    it("pauses links while the invitation is a draft or unpublished, and kills them when archived", async () => {
        const draftId = await createInvitation(owner.token);
        const d = await addGuest(owner.token, draftId);
        const draft = await api().get(`/api/invite/${d.token}`);
        assert.equal(draft.status, 403);
        assert.equal(draft.body.code, "not_published");

        const liveId = await createPublishedInvitation(owner.token);
        const g = await addGuest(owner.token, liveId);
        await api().post(`/api/invitations/${liveId}/unpublish`).set(auth(owner.token));
        assert.equal((await api().get(`/api/invite/${g.token}`)).status, 403);
        await api().post(`/api/invitations/${liveId}/publish`).set(auth(owner.token));
        assert.equal((await api().get(`/api/invite/${g.token}`)).status, 200);
        await api().delete(`/api/invitations/${liveId}`).set(auth(owner.token));
        assert.equal((await api().get(`/api/invite/${g.token}`)).status, 404);
    });

    it("keeps other users away from the guest list", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Private" });
        const as = auth(other.token);
        assert.equal((await api().get(`/api/invitations/${invitationId}/guests`).set(as)).status, 404);
        assert.equal((await api().post(`/api/invitations/${invitationId}/guests`).set(as).send({ name: "Intruder" })).status, 404);
        assert.equal((await api().patch(`/api/invitations/${invitationId}/guests/${g.id}`).set(as).send({ name: "X" })).status, 404);
        assert.equal((await api().post(`/api/invitations/${invitationId}/guests/${g.id}/reset-link`).set(as)).status, 404);

        // Their own invitation can't reach this guest by ID either
        const theirs = await createInvitation(other.token);
        assert.equal((await api().delete(`/api/invitations/${theirs}/guests/${g.id}`).set(as)).status, 404);
        assert.ok(await models.Guest.findById(g.id));
    });

    it("validates and tidies guest details", async () => {
        const post = (body) => api().post(`/api/invitations/${invitationId}/guests`).set(auth(owner.token)).send(body);
        assert.equal((await post({ name: "" })).status, 400);
        assert.equal((await post({ name: "X", email: "bad" })).status, 400);
        assert.equal((await post({ name: "X", phone: "abc" })).status, 400);
        const ok = await post({ name: "Tidy", phone: "077 123 4567", email: "TIDY@Example.com" });
        assert.equal(ok.body.guest.phone, "0771234567");
        assert.equal(ok.body.guest.email, "tidy@example.com");
    });

    it("counts guests and replies on the dashboard", async () => {
        const res = await api().get("/api/invitations").set(auth(owner.token));
        const inv = res.body.invitations.find((i) => i.id === invitationId);
        const list = await api().get(`/api/invitations/${invitationId}/guests`).set(auth(owner.token));
        assert.equal(inv.guestCounts.total, list.body.guests.length);
        assert.equal(inv.guestCounts.pending, list.body.guests.length);
    });

    it("marks a guest as shared, and takes the mark off again", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Shared Guest" });
        const url = `/api/invitations/${invitationId}/guests/${g.id}/mark-shared`;
        const on = await api().post(url).set(auth(owner.token)).send({});
        assert.ok(on.body.guest.sharedAt);
        const off = await api().post(url).set(auth(owner.token)).send({ shared: false });
        assert.equal(off.status, 200);
        assert.equal(off.body.guest.sharedAt, undefined);
        assert.equal((await models.Guest.findById(g.id)).sharedAt, undefined);
    });
});
