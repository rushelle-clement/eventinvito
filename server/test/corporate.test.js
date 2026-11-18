// Corporate invitations: company, event title, anniversary years and logo; they keep to corporate designs
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, addGuest, colomboDay } = require("./helpers");

describe("Corporate invitations", () => {
    before(startDb);
    after(stopDb);
    const patch = (token, id, body) => api().patch(`/api/invitations/${id}`).set(auth(token)).send(body);

    it("makes a corporate invitation from a corporate design, with its own fields", async () => {
        const host = await registerUser("Acme");
        const id = await createInvitation(host.token, {}, "black-tie-gala");
        let inv = (await api().get(`/api/invitations/${id}`).set(auth(host.token))).body.invitation;
        assert.equal(inv.eventType, "corporate");
        assert.deepEqual(inv.missingForPublish.slice(0, 2), ["companyName", "eventTitle"]);

        const res = await patch(host.token, id, { companyName: " Acme Holdings ", eventTitle: "Annual Awards Night", milestone: "25" });
        assert.equal(res.status, 200);
        inv = res.body.invitation;
        assert.equal(inv.companyName, "Acme Holdings");
        assert.equal(inv.eventTitle, "Annual Awards Night");
        assert.equal(inv.milestone, 25);
        assert.equal(inv.logo, null);
        assert.equal(inv.logoStyle, "original");
        assert.equal((await patch(host.token, id, { logoStyle: "mono" })).body.invitation.logoStyle, "mono");
        assert.equal((await patch(host.token, id, { logoStyle: "rainbow" })).status, 400);
        assert.equal((await patch(host.token, id, { milestone: "0" })).status, 400);
        assert.equal((await patch(host.token, id, { companyName: "x".repeat(81) })).status, 400);
        // the event type stays corporate
        assert.equal((await patch(host.token, id, { eventType: "wedding" })).body.invitation.eventType, "corporate");
    });

    it("keeps corporate invitations to corporate designs, and the other way round", async () => {
        const host = await registerUser("Acme");
        const id = await createInvitation(host.token, {}, "modern-business");
        const toWedding = await patch(host.token, id, { templateKey: "pure-elegance" });
        assert.equal(toWedding.status, 400);
        assert.match(toWedding.body.errors.templateKey, /corporate design/);
        assert.equal((await patch(host.token, id, { templateKey: "black-tie-gala" })).status, 200);

        const wedding = await createInvitation(host.token);
        assert.equal((await patch(host.token, wedding, { templateKey: "black-tie-gala" })).status, 400);
        assert.equal((await patch(host.token, wedding, { eventType: "corporate" })).status, 400);
    });

    it("sends the company, title and logo to guests, and allows the day plan on Plus", async () => {
        const host = await registerUser("Acme", { plan: "plus" });
        const id = await createInvitation(host.token, {}, "tech-innovation");
        await patch(host.token, id, {
            companyName: "Acme",
            eventTitle: "Launch Summit",
            eventDate: colomboDay(40),
            eventTime: "09:00",
            venueName: "BMICH",
            address: "Colombo 7",
            rsvpDeadline: colomboDay(30),
        });
        const plan = await patch(host.token, id, { agenda: [{ time: "09:00", title: "Registration" }], agendaVisible: true });
        assert.equal(plan.status, 200);
        assert.equal((await api().post(`/api/invitations/${id}/publish`).set(auth(host.token))).status, 200);
        const g = await addGuest(host.token, id, { name: "Ruwan" });
        const view = (await api().get(`/api/invite/${g.token}`)).body;
        assert.equal(view.invitation.companyName, "Acme");
        assert.equal(view.invitation.eventTitle, "Launch Summit");
        assert.equal(view.invitation.agenda.length, 1);
        const list = (await api().get("/api/invitations").set(auth(host.token))).body.invitations;
        assert.ok(list.some((i) => i.companyName === "Acme"));
    });

    it("only takes a logo on corporate invitations, and can remove it", async () => {
        const host = await registerUser("Acme");
        const id = await createInvitation(host.token, {}, "corporate-elegance");
        const removed = await api().delete(`/api/invitations/${id}/logo`).set(auth(host.token));
        assert.equal(removed.status, 200);
        assert.equal(removed.body.logo, null);
        // without Cloudinary settings, uploads are switched off
        assert.equal((await api().post(`/api/invitations/${id}/logo/signature`).set(auth(host.token))).status, 503);
    });
});
