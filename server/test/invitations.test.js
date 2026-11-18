// Invitations: FR-003 (ownership), FR-012, FR-020 – FR-027, BR-001, BR-002
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, COMPLETE, colomboDay } = require("./helpers");

describe("Invitations", () => {
    let owner;
    let other;

    before(async () => {
        await startDb();
        owner = await registerUser("Owner");
        other = await registerUser("Someone Else");
    });
    after(stopDb);

    it("lists only published templates in the gallery", async () => {
        const res = await api().get("/api/templates");
        assert.equal(res.status, 200);
        assert.ok(res.body.templates.length >= 4);
        assert.ok(!res.body.templates.some((t) => t.key === "secret-draft"));
    });

    it("does not let anyone create an invitation from an unpublished template", async () => {
        const res = await api().post("/api/invitations").set(auth(owner.token)).send({ templateKey: "secret-draft" });
        assert.equal(res.status, 400);
    });

    it("requires sign-in for every invitation route", async () => {
        assert.equal((await api().get("/api/invitations")).status, 401);
        assert.equal((await api().post("/api/invitations").send({ templateKey: "pure-elegance" })).status, 401);
    });

    it("creates a draft owned by the signed-in user, ignoring owner/status sent in the request", async () => {
        const res = await api()
            .post("/api/invitations")
            .set(auth(owner.token))
            .send({ templateKey: "pure-elegance", owner: other.user.id, status: "published" });
        assert.equal(res.status, 201);
        assert.equal(res.body.invitation.status, "draft");
        const mine = await api().get("/api/invitations").set(auth(owner.token));
        assert.ok(mine.body.invitations.some((i) => i.id === res.body.invitation.id));
        const theirs = await api().get("/api/invitations").set(auth(other.token));
        assert.ok(!theirs.body.invitations.some((i) => i.id === res.body.invitation.id));
    });

    it("hides an invitation from other users: read, edit, publish and archive all give 404", async () => {
        const id = await createInvitation(owner.token, COMPLETE());
        const asOther = auth(other.token);
        assert.equal((await api().get(`/api/invitations/${id}`).set(asOther)).status, 404);
        assert.equal((await api().patch(`/api/invitations/${id}`).set(asOther).send({ partnerOne: "Hacked" })).status, 404);
        assert.equal((await api().post(`/api/invitations/${id}/publish`).set(asOther)).status, 404);
        assert.equal((await api().delete(`/api/invitations/${id}`).set(asOther)).status, 404);
        const still = await api().get(`/api/invitations/${id}`).set(auth(owner.token));
        assert.equal(still.body.invitation.partnerOne, "Amaya");
        assert.equal(still.body.invitation.status, "draft");
    });

    it("validates edits: real dates, http(s) map links, known languages, deadline not after the event", async () => {
        const id = await createInvitation(owner.token);
        const patch = (body) => api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send(body);
        assert.equal((await patch({ eventDate: "2026-02-30" })).status, 400);
        assert.equal((await patch({ mapUrl: "javascript:alert(1)" })).status, 400);
        assert.equal((await patch({ language: "fr" })).status, 400);
        assert.equal((await patch({ partnerOne: { $ne: "" } })).status, 400);
        const ok = await patch({ eventDate: colomboDay(30), rsvpDeadline: colomboDay(20) });
        assert.equal(ok.status, 200);
        assert.equal((await patch({ rsvpDeadline: colomboDay(40) })).status, 400);
    });

    it("lets the couple choose wedding, engagement or homecoming, defaulting to a wedding", async () => {
        const created = await api().post("/api/invitations").set(auth(owner.token)).send({ templateKey: "pure-elegance", eventType: "engagement" });
        assert.equal(created.status, 201);
        assert.equal(created.body.invitation.eventType, "engagement");
        const id = await createInvitation(owner.token);
        const patch = (body) => api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send(body);
        assert.equal((await api().get(`/api/invitations/${id}`).set(auth(owner.token))).body.invitation.eventType, "wedding");
        assert.equal((await patch({ eventType: "homecoming" })).body.invitation.eventType, "homecoming");
        assert.equal((await patch({ eventType: "corporate" })).status, 400);
        assert.equal((await patch({ eventType: "" })).status, 400);
        const bad = await api().post("/api/invitations").set(auth(owner.token)).send({ templateKey: "pure-elegance", eventType: "funeral" });
        assert.equal(bad.status, 400);
    });

    it("stores the music choice, accepting only simple track ids", async () => {
        const id = await createInvitation(owner.token);
        const patch = (body) => api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send(body);
        const ok = await patch({ musicTrack: "canon-music-box" });
        assert.equal(ok.status, 200);
        assert.equal(ok.body.invitation.musicTrack, "canon-music-box");
        assert.equal((await patch({ musicTrack: "../../etc/passwd" })).status, 400);
        assert.equal((await patch({ musicTrack: "" })).body.invitation.musicTrack, "");
    });

    it("stores an optional blessing and a list of ceremonies, validating each one", async () => {
        const id = await createInvitation(owner.token);
        const patch = (body) => api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send(body);
        const ok = await patch({
            blessing: "॥ श्री गणेशाय नमः ॥",
            ceremonies: [
                { name: "Mehendi", date: colomboDay(40), time: "18:00", venue: "Family home" },
                { name: "  Wedding ceremony ", date: colomboDay(41), time: "09:30", venue: "Temple", note: "Traditional attire" },
            ],
        });
        assert.equal(ok.status, 200);
        assert.equal(ok.body.invitation.blessing, "॥ श्री गणेशाय नमः ॥");
        assert.equal(ok.body.invitation.ceremonies.length, 2);
        assert.equal(ok.body.invitation.ceremonies[1].name, "Wedding ceremony");
        assert.equal((await patch({ ceremonies: [{ name: "" }] })).status, 400);
        assert.equal((await patch({ ceremonies: [{ name: "X", date: "2026-02-30" }] })).status, 400);
        assert.equal((await patch({ ceremonies: Array.from({ length: 9 }, (_, i) => ({ name: `C${i}` })) })).status, 400);
        assert.equal((await patch({ ceremonies: "Mehendi" })).status, 400);
        assert.equal((await patch({ ceremonies: [] })).body.invitation.ceremonies.length, 0);
    });

    it("stores optional parents' lines and a closing line for the guest, with length limits", async () => {
        const id = await createInvitation(owner.token);
        const patch = (body) => api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send(body);
        const ok = await patch({
            partnerOneParents: " සුනිල් පෙරේරා මහතා සහ කමලා පෙරේරා මැතිනියගේ ආදරණීය දියණිය ",
            partnerTwoParents: "රංජිත් සිල්වා මහතා සහ නිලන්ති සිල්වා මැතිනියගේ ආදරණීය පුත්",
            inviteLine: "{name} ඔබට කෙරෙන සුහද ඇරයුමයි මේ.",
        });
        assert.equal(ok.status, 200);
        assert.equal(ok.body.invitation.partnerOneParents, "සුනිල් පෙරේරා මහතා සහ කමලා පෙරේරා මැතිනියගේ ආදරණීය දියණිය");
        assert.equal(ok.body.invitation.partnerTwoParents, "රංජිත් සිල්වා මහතා සහ නිලන්ති සිල්වා මැතිනියගේ ආදරණීය පුත්");
        assert.equal(ok.body.invitation.inviteLine, "{name} ඔබට කෙරෙන සුහද ඇරයුමයි මේ.");
        for (const field of ["partnerOneParents", "partnerTwoParents", "inviteLine"]) {
            assert.equal((await patch({ [field]: "x".repeat(201) })).status, 400, field);
        }
    });

    it("labels designs free or premium, and lets a free design publish without an RSVP deadline", async () => {
        const list = await api().get("/api/templates");
        const tiers = Object.fromEntries(list.body.templates.map((t) => [t.key, t.tier]));
        assert.equal(tiers["pure-elegance"], "premium");
        assert.equal(tiers["ivory-classic"], "free");
        assert.equal(tiers["midnight-rose"], "free");
        assert.equal(tiers["noir-rouge"], "premium");
        assert.equal(list.body.templates.filter((t) => t.tier === "free").length, 22, "7 couple cards, 5 birthday cards, 5 corporate cards and 5 Christmas cards");

        const { rsvpDeadline, ...rest } = COMPLETE();
        assert.ok(rsvpDeadline);
        const id = await createInvitation(owner.token, rest, "ivory-classic");
        const got = await api().get(`/api/invitations/${id}`).set(auth(owner.token));
        assert.equal(got.body.invitation.tier, "free");
        assert.deepEqual(got.body.invitation.missingForPublish, []);
        const pub = await api().post(`/api/invitations/${id}/publish`).set(auth(owner.token));
        assert.equal(pub.status, 200);

        // switching a free invitation to a premium design needs the deadline again
        const sw = await api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send({ templateKey: "pure-elegance" });
        assert.equal(sw.status, 400);
        assert.ok(sw.body.errors.rsvpDeadline);
    });

    it("refuses to publish until required details are filled in, listing what is missing", async () => {
        const id = await createInvitation(owner.token, { partnerOne: "Amaya" });
        const res = await api().post(`/api/invitations/${id}/publish`).set(auth(owner.token));
        assert.equal(res.status, 400);
        for (const f of ["partnerTwo", "eventDate", "eventTime", "venueName", "address", "rsvpDeadline"]) assert.ok(res.body.errors[f], f);
    });

    it("publishes a complete invitation and then keeps required fields from being emptied", async () => {
        const id = await createPublishedInvitation(owner.token);
        const res = await api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send({ venueName: "" });
        assert.equal(res.status, 400);
        const edit = await api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send({ venueName: "Galle Face Hotel" });
        assert.equal(edit.status, 200);
        assert.equal(edit.body.invitation.status, "published");
    });

    it("can switch template, but only to a published one", async () => {
        const id = await createInvitation(owner.token);
        const ok = await api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send({ templateKey: "royal-red" });
        assert.equal(ok.body.invitation.templateKey, "royal-red");
        const bad = await api().patch(`/api/invitations/${id}`).set(auth(owner.token)).send({ templateKey: "secret-draft" });
        assert.equal(bad.status, 400);
    });

    it("archives instead of deleting, and archived invitations disappear from the dashboard", async () => {
        const id = await createInvitation(owner.token);
        assert.equal((await api().delete(`/api/invitations/${id}`).set(auth(owner.token))).status, 200);
        assert.equal((await api().get(`/api/invitations/${id}`).set(auth(owner.token))).status, 404);
        const list = await api().get("/api/invitations").set(auth(owner.token));
        assert.ok(!list.body.invitations.some((i) => i.id === id));
    });
});
