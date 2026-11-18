// RSVP: FR-050 – FR-057, BR-007 – BR-009, BR-013
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, addGuest, colomboDay, COMPLETE, models } = require("./helpers");

describe("RSVP", () => {
    let owner;
    let invitationId;

    before(async () => {
        await startDb();
        owner = await registerUser("Owner");
        invitationId = await createPublishedInvitation(owner.token);
    });
    after(stopDb);

    const rsvp = (token, response, extra = {}) => api().post(`/api/invite/${token}/rsvp`).send({ response, ...extra });

    it("starts as pending with replies open", async () => {
        const g = await addGuest(owner.token, invitationId);
        const res = await api().get(`/api/invite/${g.token}`);
        assert.equal(res.body.rsvp.status, "pending");
        assert.equal(res.body.rsvp.open, true);
    });

    it("only accepts attending or not attending", async () => {
        const g = await addGuest(owner.token, invitationId);
        assert.equal((await rsvp(g.token, "maybe")).status, 400);
        assert.equal((await rsvp(g.token, undefined)).status, 400);
    });

    it("saves the reply on the right guest and shows it to the couple with a time", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Replying Guest" });
        const res = await rsvp(g.token, "attending");
        assert.equal(res.status, 200);
        assert.equal(res.body.rsvp.status, "attending");
        const list = await api().get(`/api/invitations/${invitationId}/guests`).set(auth(owner.token));
        const row = list.body.guests.find((x) => x.id === g.id);
        assert.equal(row.rsvpStatus, "attending");
        assert.ok(row.respondedAt);
    });

    it("lets a guest change their mind; the latest answer wins and no duplicate is created", async () => {
        const g = await addGuest(owner.token, invitationId, { name: "Undecided" });
        await rsvp(g.token, "attending");
        await rsvp(g.token, "not_attending");
        const stored = await models.Guest.find({ invitation: invitationId, name: "Undecided" });
        assert.equal(stored.length, 1);
        assert.equal(stored[0].rsvpStatus, "not_attending");
    });

    it("ignores attempts to answer for another guest or add plus-ones", async () => {
        const a = await addGuest(owner.token, invitationId, { name: "Guest A" });
        const b = await addGuest(owner.token, invitationId, { name: "Guest B" });
        await rsvp(a.token, "attending", { guestId: b.id, name: "Changed", plusOnes: 3 });
        const [ga, gb] = await Promise.all([models.Guest.findById(a.id), models.Guest.findById(b.id)]);
        assert.equal(ga.rsvpStatus, "attending");
        assert.equal(ga.name, "Guest A");
        assert.equal(gb.rsvpStatus, "pending");
    });

    it("accepts replies on the deadline day itself (Sri Lanka time)", async () => {
        const id = await createPublishedInvitation(owner.token, { rsvpDeadline: colomboDay(0) });
        const g = await addGuest(owner.token, id);
        assert.equal((await rsvp(g.token, "attending")).status, 200);
    });

    it("blocks replies after the deadline — on the server, not just the page", async () => {
        const id = await createPublishedInvitation(owner.token);
        const g = await addGuest(owner.token, id);
        await rsvp(g.token, "attending");
        // Move the deadline into the past directly in the database (the API won't allow it)
        await models.Invitation.updateOne({ _id: id }, { $set: { rsvpDeadline: colomboDay(-1) } });

        const view = await api().get(`/api/invite/${g.token}`);
        assert.equal(view.body.rsvp.open, false);
        const res = await rsvp(g.token, "not_attending");
        assert.equal(res.status, 403);
        assert.equal(res.body.code, "rsvp_closed");
        assert.equal((await models.Guest.findById(g.id)).rsvpStatus, "attending");
    });

    it("blocks replies through a reset or removed link", async () => {
        const g = await addGuest(owner.token, invitationId);
        await api().post(`/api/invitations/${invitationId}/guests/${g.id}/reset-link`).set(auth(owner.token));
        assert.equal((await rsvp(g.token, "attending")).status, 404);
        assert.equal((await models.Guest.findById(g.id)).rsvpStatus, "pending");

        const h = await addGuest(owner.token, invitationId);
        await api().delete(`/api/invitations/${invitationId}/guests/${h.id}`).set(auth(owner.token));
        assert.equal((await rsvp(h.token, "attending")).status, 404);
    });

    it("blocks replies while the invitation is unpublished", async () => {
        const id = await createPublishedInvitation(owner.token);
        const g = await addGuest(owner.token, id);
        await api().post(`/api/invitations/${id}/unpublish`).set(auth(owner.token));
        assert.equal((await rsvp(g.token, "attending")).status, 403);
    });

    it("free designs take replies with no deadline, and send no music or photos to guests", async () => {
        const { rsvpDeadline, ...fields } = COMPLETE();
        void rsvpDeadline;
        const id = await createInvitation(owner.token, { ...fields, musicTrack: "piano-romance" }, "ivory-classic");
        assert.equal((await api().post(`/api/invitations/${id}/publish`).set(auth(owner.token))).status, 200);
        const g = await addGuest(owner.token, id);
        const view = await api().get(`/api/invite/${g.token}`);
        assert.equal(view.status, 200);
        assert.equal(view.body.rsvp.available, true);
        assert.equal(view.body.rsvp.open, true);
        assert.equal(view.body.invitation.rsvpDeadline, "");
        assert.equal(view.body.invitation.musicTrack, "");
        assert.deepEqual(view.body.invitation.photos, []);
        const res = await rsvp(g.token, "attending");
        assert.equal(res.status, 200);
        assert.equal((await models.Guest.findById(g.id)).rsvpStatus, "attending");
    });
    it("keeps the invitation online until the day after the last event, then shows only a short note", async () => {
        const id = await createPublishedInvitation(owner.token, {
            ceremonies: [
                { name: "Poruwa ceremony", date: colomboDay(60), time: "09:00", venue: "", note: "" },
                { name: "Homecoming", date: colomboDay(65), time: "18:00", venue: "", note: "" },
            ],
        });
        const own = await api().get(`/api/invitations/${id}`).set(auth(owner.token));
        assert.equal(own.body.invitation.onlineUntil, colomboDay(66), "the day after the last ceremony");
        assert.equal(own.body.invitation.ended, false);

        const g = await addGuest(owner.token, id);
        assert.equal((await api().get(`/api/invite/${g.token}`)).status, 200);

        // The day after the last event is still open...
        await models.Invitation.updateOne({ _id: id }, { $set: { eventDate: colomboDay(-1), rsvpDeadline: colomboDay(-3), ceremonies: [] } });
        assert.equal((await api().get(`/api/invite/${g.token}`)).status, 200);

        // ...the day after that, the link shows that it has ended, with no details
        await models.Invitation.updateOne({ _id: id }, { $set: { eventDate: colomboDay(-2) } });
        const ended = await api().get(`/api/invite/${g.token}`);
        assert.equal(ended.status, 410);
        assert.equal(ended.body.code, "ended");
        assert.equal(ended.body.ended.partnerOne, "Amaya");
        assert.ok(!("venueName" in ended.body.ended) && !ended.body.invitation, "no event details once it has ended");
        assert.equal((await rsvp(g.token, "attending")).status, 410);

        const after = await api().get(`/api/invitations/${id}`).set(auth(owner.token));
        assert.equal(after.body.invitation.ended, true);
        const republish = await api().post(`/api/invitations/${id}/publish`).set(auth(owner.token));
        assert.equal(republish.status, 400);
    });
});
