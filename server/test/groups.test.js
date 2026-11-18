// Guest groups ("Bride's family", "Office", …): set per guest, in bulk and by import; counted per group
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, addGuest } = require("./helpers");

describe("Guest groups", () => {
    before(startDb);
    after(stopDb);
    const list = (token, id) => api().get(`/api/invitations/${id}/guests`).set(auth(token));

    it("saves a group on a guest and reuses the existing spelling", async () => {
        const couple = await registerUser("Couple");
        const id = await createInvitation(couple.token);
        const res = await api().post(`/api/invitations/${id}/guests`).set(auth(couple.token)).send({ name: "Amal", group: "  Bride's   family " });
        assert.equal(res.status, 201);
        assert.equal(res.body.guest.group, "Bride's family");
        const res2 = await api().post(`/api/invitations/${id}/guests`).set(auth(couple.token)).send({ name: "Kamal", group: "BRIDE'S FAMILY" });
        assert.equal(res2.body.guest.group, "Bride's family");

        const tooLong = await api().post(`/api/invitations/${id}/guests`).set(auth(couple.token)).send({ name: "X", group: "x".repeat(41) });
        assert.equal(tooLong.status, 400);
        assert.ok(tooLong.body.errors.group);

        const edit = await api().patch(`/api/invitations/${id}/guests/${res.body.guest.id}`).set(auth(couple.token)).send({ group: "" });
        assert.equal(edit.body.guest.group, "");
    });

    it("counts guests, replies and opens per group, largest first, no-group last", async () => {
        const couple = await registerUser("Couple");
        const id = await createInvitation(couple.token);
        await addGuest(couple.token, id, { name: "A", group: "Office" });
        await addGuest(couple.token, id, { name: "B", group: "Groom's family" });
        await addGuest(couple.token, id, { name: "C", group: "Groom's family" });
        await addGuest(couple.token, id, { name: "D" });
        const s = (await list(couple.token, id)).body.summary;
        assert.deepEqual(
            s.groups.map((g) => [g.name, g.total, g.pending]),
            [["Groom's family", 2, 2], ["Office", 1, 1], ["", 1, 1]]
        );
    });

    it("sets a group for many guests at once, only the couple's own", async () => {
        const couple = await registerUser("Couple");
        const other = await registerUser("Other");
        const id = await createInvitation(couple.token);
        const otherId = await createInvitation(other.token);
        const a = await addGuest(couple.token, id, { name: "A" });
        const b = await addGuest(couple.token, id, { name: "B" });
        const stranger = await addGuest(other.token, otherId, { name: "Z" });

        const res = await api()
            .post(`/api/invitations/${id}/guests/group`)
            .set(auth(couple.token))
            .send({ guestIds: [a.id, b.id, stranger.id], group: "Office friends" });
        assert.equal(res.status, 200);
        assert.equal(res.body.matched, 2);
        const groups = (await list(couple.token, id)).body.guests.map((g) => g.group);
        assert.deepEqual(groups, ["Office friends", "Office friends"]);
        const otherGuests = (await list(other.token, otherId)).body.guests;
        assert.equal(otherGuests[0].group, "");

        assert.equal((await api().post(`/api/invitations/${id}/guests/group`).set(auth(couple.token)).send({ guestIds: [], group: "x" })).status, 400);
        assert.equal((await api().post(`/api/invitations/${id}/guests/group`).set(auth(couple.token)).send({ guestIds: ["nope"], group: "x" })).status, 400);
        assert.equal((await api().post(`/api/invitations/${id}/guests/group`).set(auth(other.token)).send({ guestIds: [a.id], group: "x" })).status, 404);
    });

    it("imports the group column and fills it in on existing guests", async () => {
        const couple = await registerUser("Couple");
        const id = await createInvitation(couple.token);
        await addGuest(couple.token, id, { name: "Amal Perera", group: "Office" });
        const res = await api()
            .post(`/api/invitations/${id}/guests/import`)
            .set(auth(couple.token))
            .send({
                dryRun: false,
                rows: [
                    { name: "Nimal", group: "office" },
                    { name: "Sunil", group: "Bride's friends" },
                    { name: "Amal Perera", group: "School", action: "update" },
                ],
            });
        assert.equal(res.status, 200);
        const byName = Object.fromEntries((await list(couple.token, id)).body.guests.map((g) => [g.name, g.group]));
        assert.deepEqual(byName, { "Amal Perera": "School", Nimal: "Office", Sunil: "Bride's friends" });
    });
});
