// The couple's own music file (Cloudinary is simulated, so these tests run offline)
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createInvitation, createPublishedInvitation, addGuest } = require("./helpers");
const cloudinary = require("../src/utils/cloudinary");

const SETTINGS = { CLOUDINARY_CLOUD_NAME: "testcloud", CLOUDINARY_API_KEY: "123456", CLOUDINARY_API_SECRET: "test-secret" };
const files = new Map();
const deleted = [];
function upload(publicId, info = {}) {
    const version = 1700000000 + files.size;
    files.set(publicId, { public_id: publicId, version, format: "mp3", bytes: 4_000_000, duration: 210, ...info });
    return { publicId, version, signature: cloudinary.sign({ public_id: publicId, version }, SETTINGS.CLOUDINARY_API_SECRET) };
}
const realFetch = global.fetch;

describe("Couple's own music", () => {
    let owner;
    let other;

    before(async () => {
        await startDb();
        owner = await registerUser("Owner");
        other = await registerUser("Someone Else");
        global.fetch = async (url, opts = {}) => {
            const u = String(url);
            if (u.includes("/resources/video/upload/")) {
                const f = files.get(decodeURIComponent(u.split("/resources/video/upload/")[1]));
                return new Response(JSON.stringify(f || {}), { status: f ? 200 : 404 });
            }
            if (u.endsWith("/video/destroy")) {
                const id = new URLSearchParams(opts.body).get("public_id");
                deleted.push(id);
                files.delete(id);
                return new Response("{}", { status: 200 });
            }
            return realFetch(url, opts);
        };
    });
    after(async () => {
        global.fetch = realFetch;
        await stopDb();
    });
    beforeEach(() => Object.assign(process.env, SETTINGS));

    const sig = (id, body = { rightsConfirmed: true }, token = owner.token) => api().post(`/api/invitations/${id}/music/signature`).set(auth(token)).send(body);
    const set = (id, body, token = owner.token) => api().post(`/api/invitations/${id}/music`).set(auth(token)).send({ rightsConfirmed: true, ...body });

    it("requires the couple to confirm they may use the music", async () => {
        const id = await createInvitation(owner.token);
        assert.equal((await sig(id, {})).status, 400);
        assert.equal((await set(id, { rightsConfirmed: false, publicId: "x", version: 1, signature: "x" })).status, 400);
    });

    it("signs an audio upload into the invitation's music folder", async () => {
        const id = await createInvitation(owner.token);
        const res = await sig(id);
        assert.equal(res.status, 200);
        assert.match(res.body.upload.uploadUrl, /\/video\/upload$/);
        assert.match(res.body.upload.params.folder, new RegExp(`/${id}/music$`));
        assert.match(res.body.upload.params.allowed_formats, /mp3/);
        assert.equal((await sig(id, undefined, other.token)).status, 404);
    });

    it("saves the music, switches the invitation to it, and gives guests an MP3 link", async () => {
        const id = await createPublishedInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        const res = await set(id, { ...upload(`${folder}/our-song`), title: "Our song" });
        assert.equal(res.status, 201);
        assert.equal(res.body.invitation.musicTrack, "custom");
        assert.equal(res.body.invitation.customMusic.title, "Our song");
        assert.match(res.body.invitation.customMusic.url, /^https:\/\/res\.cloudinary\.com\/testcloud\/video\/upload\/br_128k\/v\d+\/.+\.mp3$/);

        const g = await addGuest(owner.token, id);
        const view = await api().get(`/api/invite/${g.token}`);
        assert.equal(view.body.invitation.musicTrack, "custom");
        assert.match(view.body.invitation.musicUrl, /\.mp3$/);
        assert.ok(!("customMusic" in view.body.invitation), "guests don't get storage details");
    });

    it("rejects videos, very long files, forged replies and other folders", async () => {
        const id = await createInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        assert.equal((await set(id, upload(`${folder}/video`, { format: "mp4", width: 1920, height: 1080 }))).status, 400);
        assert.ok(deleted.includes(`${folder}/video`));
        assert.equal((await set(id, upload(`${folder}/long`, { duration: 3600 }))).status, 400);
        assert.equal((await set(id, { ...upload(`${folder}/fake`), signature: "f".repeat(40) })).status, 400);
        const otherFolder = (await sig(await createInvitation(owner.token))).body.upload.params.folder;
        assert.equal((await set(id, upload(`${otherFolder}/x`))).status, 403);
    });

    it("replaces the old file when a new one is uploaded, and removes it cleanly", async () => {
        const id = await createInvitation(owner.token);
        const folder = (await sig(id)).body.upload.params.folder;
        await set(id, upload(`${folder}/first`));
        await set(id, upload(`${folder}/second`));
        assert.ok(deleted.includes(`${folder}/first`), "old file deleted from Cloudinary");

        const res = await api().delete(`/api/invitations/${id}/music`).set(auth(owner.token));
        assert.equal(res.body.invitation.musicTrack, "");
        assert.equal(res.body.invitation.customMusic, null);
        assert.ok(deleted.includes(`${folder}/second`));
    });
});
