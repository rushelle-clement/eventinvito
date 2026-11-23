// The Printed Cards package: paper cards only, guests reply with the QR code (no online invitation).
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, colomboDay, models } = require("./helpers");

describe("Printed Cards package", () => {
    let couple;
    let id;
    let code;

    before(async () => {
        await startDb();
        couple = await registerUser("Printed couple", { plan: "free" });
        await models.User.updateOne({ email: couple.email }, { $set: { printedCredits: 1, publishCredits: 0 } });
    });
    after(stopDb);

    const details = { partnerOne: "Amaya", partnerTwo: "Nuwan", eventDate: colomboDay(60), eventTime: "16:00", venueName: "Cinnamon Grand", rsvpDeadline: colomboDay(40) };
    const create = (token, body) => api().post("/api/invitations").set(auth(token)).send(body);

    it("starts a printed-cards invitation with its QR code already on", async () => {
        const res = await create(couple.token, { printed: true, eventType: "wedding" });
        assert.equal(res.status, 201);
        const inv = res.body.invitation;
        assert.equal(inv.printed, true);
        assert.equal(inv.qr.enabled, true);
        assert.ok(inv.qr.code);
        assert.equal(inv.limits.plan, "printed");
        assert.equal(inv.limits.planName, "Printed Cards");
        assert.equal(inv.limits.guests, 150);
        assert.equal(inv.limits.onlineCards, false);
        assert.equal(inv.limits.qrRsvp, true);
        id = inv.id;
        code = inv.qr.code;
        assert.equal((await create(couple.token, { printed: true, eventType: "party" })).status, 400);
    });

    it("is only for accounts with the Printed Cards package, and not Premium Plus or Signature", async () => {
        const free = await registerUser("No package", { plan: "free" });
        const refused = await create(free.token, { printed: true, eventType: "wedding" });
        assert.equal(refused.status, 403);
        assert.equal(refused.body.code, "needs_printed");
        for (const plan of ["plus", "signature"]) {
            const u = await registerUser(`${plan} couple`, { plan });
            await models.User.updateOne({ email: u.email }, { $set: { printedCredits: 1 } });
            const res = await create(u.token, { printed: true, eventType: "wedding" });
            assert.equal(res.status, 403);
            assert.equal(res.body.code, "has_qr");
        }
    });

    it("needs a reply-by date and publishes with a printed-cards credit, not a Premium one", async () => {
        await api().patch(`/api/invitations/${id}`).set(auth(couple.token)).send({ ...details, rsvpDeadline: "" });
        const missing = await api().post(`/api/invitations/${id}/publish`).set(auth(couple.token));
        assert.equal(missing.status, 400);
        assert.ok(missing.body.errors.rsvpDeadline);

        await api().patch(`/api/invitations/${id}`).set(auth(couple.token)).send(details);
        const pub = await api().post(`/api/invitations/${id}/publish`).set(auth(couple.token));
        assert.equal(pub.status, 200);
        assert.equal(pub.body.user.printedCredits, 0);
        assert.equal(pub.body.user.printedMember, true, "still a Printed Cards member after the credit is used");
        assert.equal(pub.body.invitation.paidKind, "printed");

        // A second one has no credit left
        const second = (await create(couple.token, { printed: true, eventType: "birthday" })).body.invitation.id;
        await api().patch(`/api/invitations/${second}`).set(auth(couple.token)).send({ celebrant: "Kavindi", age: 5, eventDate: colomboDay(30), eventTime: "10:00", venueName: "Home", rsvpDeadline: colomboDay(20) });
        const none = await api().post(`/api/invitations/${second}/publish`).set(auth(couple.token));
        assert.equal(none.status, 403);
        assert.equal(none.body.code, "needs_printed");

        // Unpublishing and publishing again is free
        await api().post(`/api/invitations/${id}/unpublish`).set(auth(couple.token));
        assert.equal((await api().post(`/api/invitations/${id}/publish`).set(auth(couple.token))).status, 200);
    });

    it("gives every guest a physical card, with no phone, and replies come by QR", async () => {
        const add = await api().post(`/api/invitations/${id}/guests`).set(auth(couple.token)).send({ name: "Amal Perera", phone: "0771234567", cardType: "online" });
        assert.equal(add.status, 201);
        assert.equal(add.body.guest.cardType, "physical");
        assert.equal(add.body.guest.phone, "");

        const edit = await api().patch(`/api/invitations/${id}/guests/${add.body.guest.id}`).set(auth(couple.token)).send({ cardType: "online", phone: "0771234567" });
        assert.equal(edit.body.guest.cardType, "physical");
        assert.equal(edit.body.guest.phone, "");

        const imp = await api().post(`/api/invitations/${id}/guests/import`).set(auth(couple.token)).send({ rows: [{ row: 2, name: "Kamala Fernando", phone: "0712345678" }], dryRun: false, cardType: "online" });
        assert.equal(imp.status, 200);
        assert.equal(imp.body.cardType, "physical");
        const saved = await models.Guest.findOne({ invitation: id, name: "Kamala Fernando" });
        assert.equal(saved.cardType, "physical");
        assert.equal(saved.phone, "");

        // The personal link doesn't open anything for printed cards
        const token = add.body.guest.link.split("/i/")[1];
        assert.equal((await api().get(`/api/invite/${token}`)).status, 404);

        const [m] = (await api().post(`/api/qr/${code}/find`).send({ name: "amal" })).body.matches;
        assert.equal((await api().post(`/api/qr/${code}/rsvp`).send({ guestId: m.id, response: "attending" })).status, 200);
    });

    it("allows 150 guests", async () => {
        const rows = Array.from({ length: 149 }, (_, i) => ({ row: i + 2, name: `Guest ${i + 1}` }));
        const over = await api().post(`/api/invitations/${id}/guests/import`).set(auth(couple.token)).send({ rows, dryRun: true });
        assert.equal(over.status, 403);
        assert.equal(over.body.code, "guest_limit");
        assert.equal((await api().post(`/api/invitations/${id}/guests/import`).set(auth(couple.token)).send({ rows: rows.slice(0, 148), dryRun: true })).status, 200);
    });

    it("can give some guests the free online card in the same guest list (up to 50)", async () => {
        const patch = (body) => api().patch(`/api/invitations/${id}`).set(auth(couple.token)).send(body);
        const on = await patch({ onlineCard: true });
        assert.equal(on.status, 200);
        assert.equal(on.body.invitation.onlineCard, true);
        assert.equal(on.body.invitation.printed, true);
        assert.equal(on.body.invitation.limits.onlineCards, true);
        assert.equal(on.body.invitation.limits.onlineGuests, 50);

        const add = (body) => api().post(`/api/invitations/${id}/guests`).set(auth(couple.token)).send(body);
        const online = (await add({ name: "Online Cousin", phone: "0771112233", cardType: "online" })).body.guest;
        assert.equal(online.cardType, "online");
        assert.equal(online.phone, "0771112233");
        assert.equal((await add({ name: "No Type Given" })).body.guest.cardType, "physical", "printed cards default to paper");

        // The online guest's link opens; paper guests' links still don't
        assert.equal((await api().get(`/api/invite/${online.link.split("/i/")[1]}`)).status, 200);
        const paper = await models.Guest.findOne({ invitation: id, cardType: "physical" });
        assert.ok(paper);

        // Another free design only changes the online card's look: still printed
        const free = await patch({ templateKey: "modern-monochrome" });
        assert.equal(free.status, 200);
        assert.equal(free.body.invitation.printed, true);
        assert.equal(free.body.invitation.templateKey, "modern-monochrome");

        // Up to 50 online guests
        const rows = (n, from) => Array.from({ length: n }, (_, i) => ({ row: i + 2, name: `Online ${from + i}` }));
        const fits = await api().post(`/api/invitations/${id}/guests/import`).set(auth(couple.token)).send({ rows: rows(49, 1), dryRun: true, cardType: "online" });
        assert.equal(fits.status, 200);
        const over = await api().post(`/api/invitations/${id}/guests/import`).set(auth(couple.token)).send({ rows: rows(50, 1), dryRun: true, cardType: "online" });
        assert.equal(over.status, 403);
        assert.equal(over.body.code, "online_limit");

        // Can't switch it off while someone has the online card
        const off = await patch({ onlineCard: false });
        assert.equal(off.status, 400);
        assert.equal(off.body.code, "online_guests");
    });

    it("moves to online invitations with a Premium credit after upgrading, keeping the QR code", async () => {
        const choose = () => api().patch(`/api/invitations/${id}`).set(auth(couple.token)).send({ templateKey: "pure-elegance", address: "77 Galle Road, Colombo 3" });
        const no = await choose();
        assert.equal(no.status, 403);
        assert.match(no.body.message, /Premium Plus/);

        await models.User.updateOne({ email: couple.email }, { $set: { plan: "plus", publishCredits: 1 } });
        const yes = await choose();
        assert.equal(yes.status, 200);
        assert.equal(yes.body.invitation.printed, false);
        assert.equal(yes.body.invitation.paidKind, "premium");
        assert.equal(yes.body.invitation.limits.plan, "plus");
        assert.equal(yes.body.invitation.qr.code, code);
        assert.equal(yes.body.user.publishCredits, 0);
        assert.equal((await api().get(`/api/qr/${code}`)).status, 200);
    });

    it("lets the admin give printed-cards credits", async () => {
        const admin = await registerUser("Admin");
        await models.User.updateOne({ email: admin.email }, { $set: { role: "admin" } });
        const target = await registerUser("Someone", { plan: "free" });
        const res = await api().patch(`/api/admin/users/${target.user.id}`).set(auth(admin.token)).send({ printedCredits: 2 });
        assert.equal(res.status, 200);
        assert.equal(res.body.user.printedCredits, 2);
    });
});
