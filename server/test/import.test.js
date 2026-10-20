// Bulk guest import: PRD section 6.10
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, addGuest, models } = require("./helpers");

describe("Guest import", () => {
    let owner;
    let other;
    let id;

    before(async () => {
        await startDb();
        owner = await registerUser("Owner");
        other = await registerUser("Someone Else");
        id = await createInvitation(owner.token);
        await addGuest(owner.token, id, { name: "Amal Perera", phone: "0771234567" });
        await addGuest(owner.token, id, { name: "Kamala Silva", email: "kamala@example.com" });
    });
    after(stopDb);

    const send = (rows, dryRun, token = owner.token, invitationId = id) =>
        api().post(`/api/invitations/${invitationId}/guests/import`).set(auth(token)).send({ rows, dryRun });

    const ROWS = [
        { row: 2, name: "  Nimal   Fernando ", phone: "771112222", email: "NIMAL@example.com", notes: "Groom's side" },
        { row: 3, name: "", email: "noname@example.com" },
        { row: 4, name: "Julian", email: "julian@bad", phone: "abc" },
        { row: 5, name: "A. Perera", phone: "+94 77 123 4567", notes: "New number" },
        { row: 6, name: "kamala   silva" },
        { row: 7, name: "Nimal Fernando", phone: "0771112222" },
    ];

    it("is only available to the invitation's owner", async () => {
        assert.equal((await send(ROWS, true, other.token)).status, 404);
    });

    it("rejects empty and oversized imports", async () => {
        assert.equal((await send([], true)).status, 400);
        assert.equal((await send(Array.from({ length: 1001 }, (_, i) => ({ name: `G${i}` })), true)).status, 400);
    });

    it("previews without saving anything, flagging problems and duplicates", async () => {
        const before = await models.Guest.countDocuments({ invitation: id });
        const res = await send(ROWS, true);
        assert.equal(res.status, 200);
        assert.equal(await models.Guest.countDocuments({ invitation: id }), before);

        const r = Object.fromEntries(res.body.rows.map((x) => [x.row, x]));
        // tidied: spaces, lower-case email, Excel-stripped leading 0 restored
        assert.deepEqual(r[2].values, { name: "Nimal Fernando", displayName: "", phone: "0771112222", email: "nimal@example.com", notes: "Groom's side" });
        assert.equal(r[2].action, "add");
        assert.ok(r[3].errors.name);
        assert.equal(r[3].action, "exclude");
        assert.ok(r[4].warnings.email && r[4].warnings.phone);
        assert.equal(r[4].action, "add");
        assert.equal(r[5].duplicate.type, "existing");
        assert.equal(r[5].duplicate.on, "phone");
        assert.equal(r[5].action, "skip");
        assert.equal(r[6].duplicate.on, "name");
        assert.equal(r[7].duplicate.type, "file");
        assert.equal(r[7].duplicate.row, 2);
        assert.deepEqual(
            { total: res.body.summary.total, invalid: res.body.summary.invalid, duplicates: res.body.summary.duplicates, add: res.body.summary.add },
            { total: 6, invalid: 1, duplicates: 3, add: 2 }
        );
    });

    it("applies the couple's choices, but never forces in a row with errors", async () => {
        const rows = ROWS.map((r) => ({ ...r }));
        rows[1].action = "add"; // has no name — must stay out
        rows[3].action = "update"; // update Amal with the new number
        rows[0].action = "update"; // not a duplicate — update isn't allowed, falls back to add
        const res = await send(rows, false);
        assert.equal(res.status, 200);
        assert.equal(res.body.summary.added, 2);
        assert.equal(res.body.summary.updated, 1);

        assert.equal(await models.Guest.countDocuments({ invitation: id, email: "noname@example.com" }), 0);
        const amal = await models.Guest.findOne({ invitation: id, name: "Amal Perera" });
        assert.equal(amal.phone, "+94771234567");
        assert.equal(amal.notes, "New number");
        const kamala = await models.Guest.findOne({ invitation: id, name: "Kamala Silva" });
        assert.equal(kamala.email, "kamala@example.com", "skipped duplicate left untouched");
    });

    it("gives every imported guest a working personal link", async () => {
        const list = await api().get(`/api/invitations/${id}/guests`).set(auth(owner.token));
        assert.ok(list.body.guests.every((g) => /\/i\/[A-Za-z0-9_-]{32}$/.test(g.link)));
        assert.equal(new Set(list.body.guests.map((g) => g.link)).size, list.body.guests.length);
    });

    it("imports the name on the invitation, and fills it in on an existing guest", async () => {
        const post = (rows) => api().post(`/api/invitations/${id}/guests/import`).set(auth(owner.token)).send({ rows, dryRun: false });
        const res = await post([{ row: 2, name: "Sunethra Bandara", displayName: "සුනේත්‍රා  බණ්ඩාර මහත්මිය", phone: "0779998887" }]);
        assert.equal(res.status, 200);
        const list = await api().get(`/api/invitations/${id}/guests`).set(auth(owner.token));
        const g = list.body.guests.find((x) => x.name === "Sunethra Bandara");
        assert.equal(g.displayName, "සුනේත්‍රා බණ්ඩාර මහත්මිය");
        await post([{ row: 2, name: "Sunethra Bandara", displayName: "සුනේත්‍රා බණ්ඩාර", action: "update" }]);
        const again = await api().get(`/api/invitations/${id}/guests`).set(auth(owner.token));
        assert.equal(again.body.guests.find((x) => x.id === g.id).displayName, "සුනේත්‍රා බණ්ඩාර");
    });
});
