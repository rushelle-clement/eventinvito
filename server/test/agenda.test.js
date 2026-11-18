// The wedding day agenda ("day plan"): a timed list of what happens on the day.
// Premium Plus and Signature only; guests see it only when the couple switches it on.
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, addGuest, colomboDay } = require("./helpers");

const PLAN = [
    { time: "17:00", title: "Reception dinner", place: "Ballroom" },
    { time: "10:30", endTime: "11:30", title: "Poruwa ceremony", place: "Main lawn", note: "Please be seated by 10:15" },
    { time: "12:00", title: "Lunch" },
];

describe("Wedding day agenda", () => {
    before(startDb);
    after(stopDb);

    const patch = (token, id, body) => api().patch(`/api/invitations/${id}`).set(auth(token)).send(body);
    const view = (guestToken) => api().get(`/api/invite/${guestToken}`);

    it("saves the plan in time order and returns it to the couple", async () => {
        const couple = await registerUser("Plus couple", { plan: "plus" });
        const id = await createInvitation(couple.token);
        const res = await patch(couple.token, id, { agenda: PLAN, agendaVisible: true });
        assert.equal(res.status, 200);
        const inv = res.body.invitation;
        assert.deepEqual(
            inv.agenda.map((a) => a.title),
            ["Poruwa ceremony", "Lunch", "Reception dinner"]
        );
        assert.equal(inv.agenda[0].endTime, "11:30");
        assert.equal(inv.agenda[0].note, "Please be seated by 10:15");
        assert.equal(inv.agendaVisible, true);
        assert.equal(inv.limits.agenda, true);
    });

    it("checks each item", async () => {
        const couple = await registerUser("Plus couple", { plan: "plus" });
        const id = await createInvitation(couple.token);
        for (const [item, message] of [
            [{ time: "10:00", title: "" }, /say what happens/],
            [{ time: "", title: "Photos" }, /start time/],
            [{ time: "25:99x", title: "Photos" }, /start time/],
            [{ time: "10:00", endTime: "late", title: "Photos" }, /end must be a time/],
            [{ time: "10:00", title: "Photos", date: "2026-02-30" }, /not a real date/],
            [{ time: "10:00", title: "x".repeat(81) }, /80 characters/],
        ]) {
            const res = await patch(couple.token, id, { agenda: [item] });
            assert.equal(res.status, 400, JSON.stringify(item));
            assert.match(res.body.errors.agenda, message);
        }
        const tooMany = await patch(couple.token, id, { agenda: Array.from({ length: 31 }, (_, i) => ({ time: "10:00", title: `Item ${i}` })) });
        assert.equal(tooMany.status, 400);
        assert.equal((await patch(couple.token, id, { agendaVisible: "yes" })).status, 400);
    });

    it("is part of Premium Plus and Signature only", async () => {
        const premium = await registerUser("Premium couple", { plan: "premium" });
        const id = await createInvitation(premium.token);
        const res = await patch(premium.token, id, { agenda: PLAN });
        assert.equal(res.status, 403);
        assert.equal(res.body.code, "needs_plus");
        assert.equal((await patch(premium.token, id, { agendaVisible: true })).status, 403);
        // Clearing it or switching it off is always fine
        assert.equal((await patch(premium.token, id, { agenda: [], agendaVisible: false })).status, 200);

        const signature = await registerUser("Signature couple", { plan: "signature" });
        const sid = await createInvitation(signature.token);
        assert.equal((await patch(signature.token, sid, { agenda: PLAN })).status, 200);
    });

    it("shows guests the plan only when the couple switches it on", async () => {
        const couple = await registerUser("Plus couple", { plan: "plus" });
        const id = await createPublishedInvitation(couple.token, { agenda: PLAN });
        const guest = await addGuest(couple.token, id);

        let inv = (await view(guest.token)).body.invitation;
        assert.deepEqual(inv.agenda, [], "hidden until switched on");

        await patch(couple.token, id, { agendaVisible: true });
        inv = (await view(guest.token)).body.invitation;
        assert.equal(inv.agenda.length, 3);
        assert.deepEqual(Object.keys(inv.agenda[0]).sort(), ["date", "endTime", "note", "place", "time", "title"]);

        await patch(couple.token, id, { agendaVisible: false });
        assert.deepEqual((await view(guest.token)).body.invitation.agenda, []);
    });

    it("is for wedding invitations, not birthdays", async () => {
        const couple = await registerUser("Plus parents", { plan: "plus" });
        const id = await createInvitation(couple.token, {}, "balloon-bash");
        const res = await patch(couple.token, id, { agenda: PLAN });
        assert.equal(res.status, 400);
        assert.match(res.body.errors.agenda, /birthday/);
        assert.equal((await patch(couple.token, id, { agendaVisible: true })).status, 400);
    });

    it("hides the plan from guests if the package no longer includes it", async () => {
        const { models } = require("./helpers");
        const couple = await registerUser("Plus couple", { plan: "plus" });
        const id = await createPublishedInvitation(couple.token, { agenda: PLAN, agendaVisible: true, eventDate: colomboDay(40) });
        const guest = await addGuest(couple.token, id);
        assert.equal((await view(guest.token)).body.invitation.agenda.length, 3);
        await models.User.updateOne({ email: couple.email }, { $set: { plan: "premium" } });
        assert.deepEqual((await view(guest.token)).body.invitation.agenda, []);
    });
});
