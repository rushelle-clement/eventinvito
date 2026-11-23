// A paid invitation stays the same event: names only take small fixes, an ended event can't be
// moved to a new date, and changes after publishing are recorded for the admin.
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createPublishedInvitation, models } = require("./helpers");
const { isSmallFix } = require("../src/utils/publishedLocks");

describe("Published invitations stay the same event", () => {
    let couple;
    let admin;
    let id;

    before(async () => {
        await startDb();
        couple = await registerUser("Couple");
        admin = await registerUser("Admin");
        await models.User.updateOne({ email: admin.email }, { $set: { role: "admin" } });
        id = await createPublishedInvitation(couple.token);
    });
    after(stopDb);

    const patch = (body, token = couple.token) => api().patch(`/api/invitations/${id}`).set(auth(token)).send(body);

    it("tells a spelling fix from a different name", () => {
        assert.equal(isSmallFix("Nuwan", "Nuwaan"), true);
        assert.equal(isSmallFix("Amaya", "amaya "), true);
        assert.equal(isSmallFix("Amaya", "Nimali"), false);
        assert.equal(isSmallFix("", "Anything"), true, "wasn't filled in when published");
    });

    it("allows small fixes but not new names, measured from the published names", async () => {
        assert.equal((await patch({ partnerTwo: "Nuwaan" })).status, 200);
        const big = await patch({ partnerOne: "Dilini" });
        assert.equal(big.status, 403);
        assert.equal(big.body.code, "names_locked");
        assert.ok(big.body.errors.partnerOne);
        // Small steps don't add up to a new name
        assert.equal((await patch({ partnerTwo: "Nuwaanx" })).status, 200);
        assert.equal((await patch({ partnerTwo: "Kasun" })).status, 403);
        // Other details are free to change
        assert.equal((await patch({ venueName: "Galle Face Hotel", eventTime: "18:00" })).status, 200);
        const me = (await api().get(`/api/invitations/${id}`).set(auth(couple.token))).body.invitation;
        assert.equal(me.namesLocked, true);
    });

    it("lets the admin allow one real name change", async () => {
        const unlock = await api().patch(`/api/admin/invitations/${id}`).set(auth(admin.token)).send({ namesUnlocked: true });
        assert.equal(unlock.status, 200);
        assert.equal((await patch({ partnerOne: "Dilini" })).status, 200);
        assert.equal((await patch({ partnerOne: "Amaya" })).status, 403, "locked again, now to the new name");
    });

    it("keeps an ended event's date unless the admin allows it", async () => {
        await models.Invitation.updateOne({ _id: id }, { $set: { eventDate: "2024-01-10", rsvpDeadline: "2024-01-01", ceremonies: [] } });
        const move = await patch({ eventDate: "2030-06-01", rsvpDeadline: "2030-05-01" });
        assert.equal(move.status, 403);
        assert.equal(move.body.code, "event_ended");
        await api().patch(`/api/admin/invitations/${id}`).set(auth(admin.token)).send({ datesUnlocked: true });
        assert.equal((await patch({ eventDate: "2030-06-01", rsvpDeadline: "2030-05-01" })).status, 200);
    });

    it("records changes after publishing for the admin page", async () => {
        const list = await api().get("/api/admin/users").set(auth(admin.token));
        const account = list.body.users.find((u) => u.email === couple.email);
        const changes = account.invitations.find((i) => i.id === id).changes;
        const fields = changes.map((c) => c.field);
        assert.ok(fields.includes("partnerOne"));
        assert.ok(fields.includes("venueName"));
        assert.ok(fields.includes("eventDate"));
        assert.ok(changes.find((c) => c.field === "partnerOne" && c.from === "Amaya" && c.to === "Dilini"));
    });

    it("lists published invitations with their changes for the admin", async () => {
        const all = await api().get("/api/admin/invitations").set(auth(admin.token));
        assert.equal(all.status, 200);
        const mine = all.body.invitations.find((i) => i.id === id);
        assert.ok(mine.changeCount >= 3);
        assert.equal(mine.owner.email, couple.email);
        const found = await api().get(`/api/admin/invitations?q=${encodeURIComponent(couple.email)}&changed=1`).set(auth(admin.token));
        assert.ok(found.body.invitations.some((i) => i.id === id));
        assert.equal((await api().get("/api/admin/invitations").set(auth(couple.token))).status, 403);
    });

    it("leaves drafts that were never published alone", async () => {
        const draft = (await api().post("/api/invitations").set(auth(couple.token)).send({ templateKey: "pure-elegance" })).body.invitation.id;
        const res = await api().patch(`/api/invitations/${draft}`).set(auth(couple.token)).send({ partnerOne: "A", partnerTwo: "B" });
        assert.equal(res.status, 200);
        assert.equal((await api().patch(`/api/invitations/${draft}`).set(auth(couple.token)).send({ partnerOne: "Completely Different" })).status, 200);
    });
});
