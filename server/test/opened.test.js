// "Opened": the couple can see which guests have opened their invitation
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createPublishedInvitation, addGuest, models } = require("./helpers");

describe("Opened invitations", () => {
    before(startDb);
    after(stopDb);
    const guests = (token, id) => api().get(`/api/invitations/${id}/guests`).set(auth(token));

    it("records when a guest first and last opened it, and counts visits", async () => {
        const couple = await registerUser("Couple");
        const id = await createPublishedInvitation(couple.token);
        const amal = await addGuest(couple.token, id, { name: "Amal" });
        await addGuest(couple.token, id, { name: "Nimal" });

        let list = (await guests(couple.token, id)).body;
        assert.equal(list.guests.find((g) => g.name === "Amal").openedAt, null);
        assert.equal(list.summary.opened, 0);

        assert.equal((await api().get(`/api/invite/${amal.token}`)).status, 200);
        await api().get(`/api/invite/${amal.token}`); // again straight away: same visit
        list = (await guests(couple.token, id)).body;
        const a = list.guests.find((g) => g.name === "Amal");
        assert.ok(a.openedAt);
        assert.equal(a.openCount, 1);
        assert.equal(list.summary.opened, 1);
        assert.equal(list.summary.openedNoReply, 1);

        // a later visit (over 30 minutes after the last) counts again, first-opened stays
        const first = a.openedAt;
        await models.Guest.updateOne({ name: "Amal" }, { $set: { lastOpenedAt: new Date(Date.now() - 60 * 60 * 1000) } });
        await api().get(`/api/invite/${amal.token}`);
        const again = (await guests(couple.token, id)).body.guests.find((g) => g.name === "Amal");
        assert.equal(again.openCount, 2);
        assert.equal(again.openedAt, first);
    });

    it("moves from 'opened, no reply' to replied", async () => {
        const couple = await registerUser("Couple");
        const id = await createPublishedInvitation(couple.token);
        const g = await addGuest(couple.token, id);
        await api().get(`/api/invite/${g.token}`);
        await api().post(`/api/invite/${g.token}/rsvp`).send({ response: "attending" });
        const s = (await guests(couple.token, id)).body.summary;
        assert.equal(s.opened, 1);
        assert.equal(s.openedNoReply, 0);
    });

    it("counts a reply as opened even if the open wasn't recorded", async () => {
        const couple = await registerUser("Couple");
        const id = await createPublishedInvitation(couple.token);
        const g = await addGuest(couple.token, id);
        await api().post(`/api/invite/${g.token}/rsvp`).send({ response: "not_attending" });
        assert.ok((await guests(couple.token, id)).body.guests[0].openedAt);
    });

    it("doesn't count the couple's own visits or link-preview bots", async () => {
        const couple = await registerUser("Couple");
        const id = await createPublishedInvitation(couple.token);
        const g = await addGuest(couple.token, id);
        await api().get(`/api/invite/${g.token}`).set(auth(couple.token));
        await api().get(`/api/invite/${g.token}/share`);
        assert.equal((await guests(couple.token, id)).body.guests[0].openedAt, null);
        // another signed-in account opening it is still a guest
        const friend = await registerUser("Friend");
        await api().get(`/api/invite/${g.token}`).set(auth(friend.token));
        assert.ok((await guests(couple.token, id)).body.guests[0].openedAt);
    });

    it("shows opened counts on the dashboard", async () => {
        const couple = await registerUser("Couple");
        const id = await createPublishedInvitation(couple.token);
        const g = await addGuest(couple.token, id);
        await addGuest(couple.token, id, { name: "Other" });
        await api().get(`/api/invite/${g.token}`);
        const inv = (await api().get("/api/invitations").set(auth(couple.token))).body.invitations.find((i) => i.id === id);
        assert.equal(inv.guestCounts.opened, 1);
        assert.equal(inv.guestCounts.openedNoReply, 1);
        assert.equal(inv.guestCounts.total, 2);
    });

    it("doesn't tell guests anything about it", async () => {
        const couple = await registerUser("Couple");
        const id = await createPublishedInvitation(couple.token);
        const g = await addGuest(couple.token, id);
        const body = JSON.stringify((await api().get(`/api/invite/${g.token}`)).body);
        assert.ok(!/opened|openCount/i.test(body));
    });
});
