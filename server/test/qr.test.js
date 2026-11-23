// Printed cards: one QR code per invitation; physical-card guests find their name and reply.
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createPublishedInvitation: publishViaApi, createInvitation, addGuest, colomboDay, COMPLETE, models } = require("./helpers");

// FerretDB (used when MongoDB can't be downloaded) can't run the publish route's update,
// so with MONGODB_TEST_URI=…ferret the invitation is marked published directly.
async function createPublishedInvitation(token, fields = {}) {
    if (!process.env.QR_TEST_DIRECT_PUBLISH) return publishViaApi(token, fields);
    const invId = await createInvitation(token, { ...COMPLETE(), ...fields });
    await models.Invitation.updateOne({ _id: invId }, { $set: { status: "published", publishedAt: new Date(), creditUsed: true, creditKind: "premium" } });
    return invId;
}

describe("QR replies for printed cards", () => {
    let owner;
    let id;
    let code;

    before(async () => {
        await startDb();
        owner = await registerUser("QR couple", { plan: "plus" });
        id = await createPublishedInvitation(owner.token);
    });
    after(stopDb);

    const setQr = (token, invId, enabled) => api().patch(`/api/invitations/${invId}/qr`).set(auth(token)).send({ enabled });
    const find = (c, name) => api().post(`/api/qr/${c}/find`).send({ name });
    const reply = (c, guestId, response) => api().post(`/api/qr/${c}/rsvp`).send({ guestId, response });

    it("is part of Premium Plus and Signature only", async () => {
        const premium = await registerUser("Premium couple", { plan: "premium" });
        const pid = await createPublishedInvitation(premium.token);
        const res = await setQr(premium.token, pid, true);
        assert.equal(res.status, 403);
        assert.equal(res.body.code, "needs_plan");
        const g = await api().post(`/api/invitations/${pid}/guests`).set(auth(premium.token)).send({ name: "Paper Guest", cardType: "physical" });
        assert.equal(g.status, 403);
    });

    it("makes one code that stays the same when switched off and on", async () => {
        const on = await setQr(owner.token, id, true);
        assert.equal(on.status, 200);
        assert.equal(on.body.qr.enabled, true);
        code = on.body.qr.code;
        assert.ok(code.length >= 8);
        assert.equal((await setQr(owner.token, id, false)).body.qr.code, code);
        assert.equal((await api().get(`/api/qr/${code}`)).status, 404);
        assert.equal((await setQr(owner.token, id, true)).body.qr.code, code);

        const page = await api().get(`/api/qr/${code}`);
        assert.equal(page.status, 200);
        assert.equal(page.body.invitation.partnerOne, "Amaya");
        assert.equal(page.body.invitation.rsvpOpen, true);
        assert.ok(page.body.invitation.venueName);
        assert.equal(page.body.invitation.address, undefined);
    });

    it("keeps physical-card guests without a phone number and with unique names", async () => {
        const g = await addGuest(owner.token, id, { name: "Amal Perera", phone: "0771234567", cardType: "physical" });
        assert.equal(g.cardType, "physical");
        assert.equal(g.phone, "");

        const dup = await api().post(`/api/invitations/${id}/guests`).set(auth(owner.token)).send({ name: "  amal  PERERA ", cardType: "physical" });
        assert.equal(dup.status, 400);
        assert.match(dup.body.errors.name, /already has a physical card/);

        // The same name as an online guest is fine
        const online = await addGuest(owner.token, id, { name: "Nimal Silva", phone: "0771234568" });
        assert.equal(online.cardType, "online");
        assert.ok((await addGuest(owner.token, id, { name: "Nimal Silva", cardType: "physical" })).id);
        // Switching an online guest with a clashing name to physical is refused
        const sw = await api().patch(`/api/invitations/${id}/guests/${online.id}`).set(auth(owner.token)).send({ cardType: "physical" });
        assert.equal(sw.status, 400);
    });

    it("finds only physical-card guests by part of their name", async () => {
        await addGuest(owner.token, id, { name: "Kamala Fernando", cardType: "physical", displayName: "කමලා" });
        await addGuest(owner.token, id, { name: "Kamal Online" }); // online: never found

        const res = await find(code, "mrs. kamal");
        assert.equal(res.status, 200);
        assert.deepEqual(res.body.matches.map((m) => m.name), ["කමලා"]);

        assert.deepEqual((await find(code, "per amal")).body.matches.map((m) => m.name), ["Amal Perera"]);
        assert.equal((await find(code, "Nobody Here")).body.matches.length, 0);
        assert.equal((await find(code, "a")).status, 400);
    });

    it("says to type the full name when too many guests match", async () => {
        for (let i = 1; i <= 6; i++) await addGuest(owner.token, id, { name: `Saman Guest${i}`, cardType: "physical" });
        const res = await find(code, "Saman");
        assert.equal(res.body.tooMany, true);
        assert.equal((await find(code, "Saman Guest3")).body.matches.length, 1);
    });

    it("saves the reply as coming from the QR code, and lets the guest change it", async () => {
        const [m] = (await find(code, "Amal Perera")).body.matches;
        assert.equal((await reply(code, m.id, "attending")).status, 200);
        const res = await reply(code, m.id, "not_attending");
        assert.equal(res.body.guest.status, "not_attending");

        const list = await api().get(`/api/invitations/${id}/guests`).set(auth(owner.token));
        const row = list.body.guests.find((g) => g.id === m.id);
        assert.equal(row.rsvpStatus, "not_attending");
        assert.equal(row.rsvpVia, "qr");
        assert.equal(list.body.summary.viaQr, 1);
        assert.equal(list.body.summary.byCard.physical.not_attending, 1);
        assert.ok(list.body.summary.byCard.online.total >= 2);
    });

    it("can't be used to answer for an online-card guest", async () => {
        const online = await addGuest(owner.token, id, { name: "Link Only" });
        const res = await reply(code, online.id, "attending");
        assert.equal(res.status, 404);
        assert.equal((await models.Guest.findById(online.id)).rsvpStatus, "pending");
    });

    it("stops taking replies after the deadline", async () => {
        const other = await createPublishedInvitation(owner.token, { rsvpDeadline: colomboDay(1) });
        const c = (await setQr(owner.token, other, true)).body.qr.code;
        const g = await addGuest(owner.token, other, { name: "Late Guest", cardType: "physical" });
        await models.Invitation.updateOne({ _id: other }, { $set: { rsvpDeadline: colomboDay(-1) } });
        assert.equal((await api().get(`/api/qr/${c}`)).body.invitation.rsvpOpen, false);
        assert.equal((await reply(c, g.id, "attending")).status, 403);
    });

    it("imports a separate physical-card file without phones and spots repeated names", async () => {
        const rows = [
            { row: 2, name: "File Guest", phone: "0779999999" },
            { row: 3, name: "file  guest" },
            { row: 4, name: "Kamala Fernando" },
        ];
        const dry = await api().post(`/api/invitations/${id}/guests/import`).set(auth(owner.token)).send({ rows, dryRun: true, cardType: "physical" });
        assert.equal(dry.status, 200);
        const [a, b, c] = dry.body.rows;
        assert.equal(a.values.phone, "");
        assert.equal(a.action, "add");
        assert.equal(b.duplicate.physical, true);
        assert.deepEqual(b.allowedActions, ["skip"]);
        assert.equal(c.duplicate.type, "existing");
        assert.deepEqual(c.allowedActions, ["skip", "update"]);

        const done = await api().post(`/api/invitations/${id}/guests/import`).set(auth(owner.token)).send({ rows, dryRun: false, cardType: "physical" });
        assert.equal(done.body.summary.added, 1);
        const saved = await models.Guest.findOne({ invitation: id, name: "File Guest" });
        assert.equal(saved.cardType, "physical");
        assert.equal(saved.phone, "");
    });

    it("reads the card type of each guest from the file's Card type column", async () => {
        const rows = [
            { row: 2, name: "Column Online", phone: "0770000101", cardType: "Online" },
            { row: 3, name: "Column Paper", phone: "0770000102", cardType: "paper" },
            { row: 4, name: "Column Blank", phone: "0770000103", cardType: "" },
            { row: 5, name: "Column Odd", phone: "0770000104", cardType: "maybe" },
        ];
        const dry = await api().post(`/api/invitations/${id}/guests/import`).set(auth(owner.token)).send({ rows, dryRun: true });
        assert.equal(dry.status, 200);
        const [a, b, c, d] = dry.body.rows;
        assert.equal(a.values.cardType, "online");
        assert.equal(a.values.phone, "0770000101");
        assert.equal(b.values.cardType, "physical");
        assert.equal(b.values.phone, "", "physical cards have no phone");
        assert.equal(c.values.cardType, "online", "empty: the package's usual type (online on Premium Plus)");
        assert.equal(d.values.cardType, "online");
        assert.match(d.warnings.cardType, /isn’t Online or Physical/);
        assert.equal(dry.body.summary.addOnline, 3);
        assert.equal(dry.body.summary.addPhysical, 1);

        // A file without the column: the couple's choice for the whole file
        const plain = rows.map(({ cardType, ...r }) => r);
        const all = await api().post(`/api/invitations/${id}/guests/import`).set(auth(owner.token)).send({ rows: plain, dryRun: true, cardType: "physical" });
        assert.ok(all.body.rows.every((r) => r.values.cardType === "physical"));

        const done = await api().post(`/api/invitations/${id}/guests/import`).set(auth(owner.token)).send({ rows, dryRun: false });
        assert.equal(done.status, 200);
        assert.equal((await models.Guest.findOne({ invitation: id, name: "Column Paper" })).cardType, "physical");
        assert.equal((await models.Guest.findOne({ invitation: id, name: "Column Online" })).cardType, "online");
    });
});
