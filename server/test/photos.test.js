// Photos: FR-022, NFR-011. Cloudinary is simulated here, so these tests run offline.
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, addGuest, models } = require("./helpers");
const cloudinary = require("../src/utils/cloudinary");

const SETTINGS = { CLOUDINARY_CLOUD_NAME: "testcloud", CLOUDINARY_API_KEY: "123456", CLOUDINARY_API_SECRET: "test-secret" };

// A pretend Cloudinary: remembers "uploaded" files and answers the two API calls we make
const fakeCloud = {
    files: new Map(),
    deleted: [],
    upload(publicId, info = {}) {
        const version = 1700000000 + this.files.size;
        this.files.set(publicId, { public_id: publicId, version, format: "jpg", bytes: 200_000, width: 2400, height: 1600, ...info });
        // Cloudinary signs its reply with public_id + version
        return { publicId, version, signature: cloudinary.sign({ public_id: publicId, version }, SETTINGS.CLOUDINARY_API_SECRET) };
    },
};
const realFetch = global.fetch;

describe("Invitation photos", () => {
    let owner;
    let other;

    before(async () => {
        await startDb();
        owner = await registerUser("Owner");
        other = await registerUser("Someone Else");
        global.fetch = async (url, opts = {}) => {
            const u = String(url);
            if (u.includes("/resources/image/upload/")) {
                const id = decodeURIComponent(u.split("/resources/image/upload/")[1]);
                const f = fakeCloud.files.get(id);
                return new Response(JSON.stringify(f || { error: "not found" }), { status: f ? 200 : 404 });
            }
            if (u.endsWith("/image/destroy")) {
                const id = new URLSearchParams(opts.body).get("public_id");
                fakeCloud.deleted.push(id);
                fakeCloud.files.delete(id);
                return new Response(JSON.stringify({ result: "ok" }), { status: 200 });
            }
            return realFetch(url, opts);
        };
    });
    after(async () => {
        global.fetch = realFetch;
        await stopDb();
    });
    beforeEach(() => Object.assign(process.env, SETTINGS));

    const sig = (id, token = owner.token) => api().post(`/api/invitations/${id}/photos/signature`).set(auth(token));
    const attach = (id, body, token = owner.token) => api().post(`/api/invitations/${id}/photos`).set(auth(token)).send(body);

    it("switches uploads off cleanly when Cloudinary isn't configured", async () => {
        const id = await createInvitation(owner.token);
        delete process.env.CLOUDINARY_API_SECRET;
        const res = await sig(id);
        assert.equal(res.status, 503);
        assert.equal(res.body.code, "uploads_disabled");
    });

    it("signs uploads only for this invitation's own folder, images only, resized", async () => {
        const id = await createInvitation(owner.token);
        const res = await sig(id);
        assert.equal(res.status, 200);
        const { params, signature, cloudName, apiKey } = res.body.upload;
        assert.equal(cloudName, "testcloud");
        assert.equal(apiKey, "123456");
        assert.match(params.folder, new RegExp(`/${id}$`));
        assert.match(params.allowed_formats, /jpg/);
        assert.match(params.transformation, /c_limit/);
        assert.equal(signature, cloudinary.sign(params, SETTINGS.CLOUDINARY_API_SECRET));
        assert.ok(!JSON.stringify(res.body).includes("test-secret"), "the secret must never be sent");
        assert.equal((await sig(id, other.token)).status, 404, "other users get no permission");
    });

    it("saves a genuine upload and returns optimised image links", async () => {
        const id = await createInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        const res = await attach(id, fakeCloud.upload(`${folder}/couple`));
        assert.equal(res.status, 201);
        assert.equal(res.body.photos.length, 1);
        assert.match(res.body.photos[0].url, /^https:\/\/res\.cloudinary\.com\/testcloud\/image\/upload\/f_auto,q_auto,c_limit,w_1600\/v\d+\/eventinvito\//);
        assert.match(res.body.photos[0].thumb, /w_480/);
    });

    it("rejects forged replies and photos from another invitation's folder", async () => {
        const id = await createInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        const real = fakeCloud.upload(`${folder}/real`);
        assert.equal((await attach(id, { ...real, signature: "0".repeat(40) })).status, 400);
        const otherId = await createInvitation(owner.token);
        const otherFolder = (await sig(otherId)).body.upload.params.folder;
        assert.equal((await attach(id, fakeCloud.upload(`${otherFolder}/sneaky`))).status, 403);
        assert.equal((await attach(id, real, other.token)).status, 404);
    });

    it("deletes and refuses files that are too large or not images", async () => {
        const id = await createInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        const big = fakeCloud.upload(`${folder}/huge`, { bytes: 25 * 1024 * 1024 });
        assert.equal((await attach(id, big)).status, 400);
        assert.ok(fakeCloud.deleted.includes(`${folder}/huge`));
        const pdf = fakeCloud.upload(`${folder}/doc`, { format: "pdf" });
        assert.equal((await attach(id, pdf)).status, 400);
    });

    it("allows up to 6 photos on Signature, reorders them, and deletes from Cloudinary on removal", async () => {
        const id = await createInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        let photos;
        for (let i = 0; i < 6; i += 1) photos = (await attach(id, fakeCloud.upload(`${folder}/p${i}`))).body.photos;
        assert.equal(photos.length, 6);
        const seventh = await sig(id);
        assert.equal(seventh.status, 403, "no 7th upload permission");
        assert.equal(seventh.body.code, "photo_limit");
        assert.equal((await attach(id, fakeCloud.upload(`${folder}/extra`))).status, 403);
        assert.ok(fakeCloud.deleted.includes(`${folder}/extra`), "an upload over the limit is removed from Cloudinary");

        const reversed = photos.map((p) => p.id).reverse();
        const re = await api().put(`/api/invitations/${id}/photos/order`).set(auth(owner.token)).send({ ids: reversed });
        assert.deepEqual(re.body.photos.map((p) => p.id), reversed);
        const bad = await api().put(`/api/invitations/${id}/photos/order`).set(auth(owner.token)).send({ ids: reversed.slice(1) });
        assert.equal(bad.status, 400);

        const del = await api().delete(`/api/invitations/${id}/photos/${reversed[0]}`).set(auth(owner.token));
        assert.equal(del.body.photos.length, 5);
        assert.ok(fakeCloud.deleted.includes(`${folder}/p5`));
        assert.equal((await api().delete(`/api/invitations/${id}/photos/${reversed[1]}`).set(auth(other.token))).status, 404);
    });

    it("allows 3 photos on Premium and none on a free card", async () => {
        const premium = await registerUser("Premium couple", { plan: "premium" });
        const id = await createInvitation(premium.token);
        const folder = (await sig(id, premium.token)).body.upload.params.folder;
        for (let i = 0; i < 3; i += 1) assert.equal((await attach(id, fakeCloud.upload(`${folder}/q${i}`), premium.token)).status, 201);
        const fourth = await sig(id, premium.token);
        assert.equal(fourth.status, 403);
        assert.match(fourth.body.message, /Premium includes up to 3 photos.*Premium Plus includes up to 6/);

        const free = await registerUser("Free couple", { plan: "free" });
        const card = await createInvitation(free.token, {}, "ivory-classic");
        assert.equal((await sig(card, free.token)).status, 403);
    });

    it("shows the photos to guests (links only, no storage details)", async () => {
        const id = await createPublishedInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        await attach(id, fakeCloud.upload(`${folder}/cover`));
        const g = await addGuest(owner.token, id);
        const view = await api().get(`/api/invite/${g.token}`);
        assert.equal(view.body.invitation.photos.length, 1);
        assert.ok(view.body.invitation.photos[0].url.startsWith("https://res.cloudinary.com/"));
        assert.ok(!("publicId" in view.body.invitation.photos[0]));
    });

    it("has no photos on corporate and Christmas designs, even ones uploaded before", async () => {
        for (const key of ["black-tie-gala", "christmas-elegance"]) {
            const id = await createInvitation(owner.token, {}, key);
            const res = await sig(id);
            assert.equal(res.status, 403);
            assert.equal(res.body.code, "no_photos");
        }
        // An older corporate invitation with a photo saved still shows none to guests
        const id = await createPublishedInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        await attach(id, fakeCloud.upload(`${folder}/cover`));
        await models.Invitation.updateOne({ _id: id }, { $set: { eventType: "corporate" } });
        const g = await addGuest(owner.token, id);
        assert.equal((await api().get(`/api/invite/${g.token}`)).body.invitation.photos.length, 0);
    });
});
