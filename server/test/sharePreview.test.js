// Link previews: the page WhatsApp and other chat apps read when a guest's link is shared
const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startDb, stopDb, api, auth, registerUser, createPublishedInvitation, createInvitation, addGuest, colomboDay, models } = require("./helpers");

const meta = (html, prop) => {
    const m = html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]*)"`));
    return m && m[1];
};

describe("Link previews", () => {
    before(() => {
        process.env.CLIENT_URL = "https://eventinvito.lk";
        return startDb();
    });
    after(stopDb);
    const share = (token) => api().get(`/api/invite/${token}/share`);

    it("shows the couple, the date, the venue and a picture — never the guest's name", async () => {
        const couple = await registerUser("Couple");
        // A date 60 days ahead (the reply-by date is 30 days ahead), so the test never goes stale
        const eventDate = colomboDay(60);
        const id = await createPublishedInvitation(couple.token, { eventDate });
        const guest = await addGuest(couple.token, id, { name: "Kasun Fernando" });
        const res = await share(guest.token);
        assert.equal(res.status, 200);
        assert.match(res.headers["content-type"], /text\/html/);
        const html = res.text;
        assert.equal(meta(html, "og:title"), "Amaya &amp; Nuwan · Wedding invitation");
        const day = new Date(`${eventDate}T12:00:00Z`);
        const weekday = day.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
        const date = day.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
        assert.match(meta(html, "og:description"), new RegExp(`${weekday},? ${date} · Mount Lavinia Hotel\\. Tap to open your invitation\\.`));
        assert.equal(meta(html, "og:image"), "https://eventinvito.lk/share/invite-wedding.jpg");
        assert.equal(meta(html, "og:url"), `https://eventinvito.lk/i/${guest.token}`);
        assert.equal(meta(html, "twitter:card"), "summary_large_image");
        assert.ok(!html.includes("Kasun"), "the guest's name is not in the preview");
        assert.match(html, /http-equiv="refresh" content="0; url=https:\/\/eventinvito.lk\/i\//);
    });

    it("uses the cover photo when there is one, cropped to 1200 × 630", async () => {
        process.env.CLOUDINARY_CLOUD_NAME = "testcloud";
        const couple = await registerUser("Photo couple");
        const id = await createPublishedInvitation(couple.token);
        await models.Invitation.updateOne({ _id: id }, { $set: { photos: [{ publicId: "eventinvito/abc", version: 7 }] } });
        const guest = await addGuest(couple.token, id);
        const img = meta((await share(guest.token)).text, "og:image");
        assert.equal(img, "https://res.cloudinary.com/testcloud/image/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto:good/v7/eventinvito/abc");
        delete process.env.CLOUDINARY_CLOUD_NAME;
    });

    it("previews birthdays and Sinhala invitations in their own words", async () => {
        const parents = await registerUser("Parents");
        const bid = await createInvitation(parents.token, { celebrant: "Kavin", age: "6", eventDate: colomboDay(30), eventTime: "15:00", venueName: "Our home", address: "Colombo", rsvpDeadline: colomboDay(20) }, "balloon-bash");
        await api().post(`/api/invitations/${bid}/publish`).set(auth(parents.token));
        const g = await addGuest(parents.token, bid);
        const html = (await share(g.token)).text;
        assert.equal(meta(html, "og:title"), "Kavin&#39;s 6th birthday · Invitation");
        assert.equal(meta(html, "og:image"), "https://eventinvito.lk/share/invite-birthday.jpg");

        const couple = await registerUser("Sinhala couple");
        const sid = await createPublishedInvitation(couple.token, { language: "si", partnerOne: "අමායා", partnerTwo: "නුවන්" });
        const sg = await addGuest(couple.token, sid);
        const sh = (await share(sg.token)).text;
        assert.equal(meta(sh, "og:title"), "අමායා සහ නුවන් · විවාහ ආරාධනාව");
        assert.match(sh, /<html lang="si">/);
    });

    it("gives a plain preview for links that aren't valid or live", async () => {
        const plain = (await share("A".repeat(32))).text;
        assert.equal(meta(plain, "og:title"), "You&#39;re invited · EventInvito");
        const couple = await registerUser("Draft couple");
        const id = await createInvitation(couple.token, { partnerOne: "Secret", partnerTwo: "Names" });
        const g = await addGuest(couple.token, id);
        const draft = (await share(g.token)).text;
        assert.ok(!draft.includes("Secret"), "a draft's names aren't shown");
    });

    it("escapes the couple's text", async () => {
        const couple = await registerUser("Tricky");
        const id = await createPublishedInvitation(couple.token, { partnerOne: '"><script>alert(1)</script>', venueName: "A & B <Hall>" });
        const g = await addGuest(couple.token, id);
        const html = (await share(g.token)).text;
        assert.ok(!html.includes("<script>"));
        assert.match(html, /A &amp; B &lt;Hall&gt;/);
    });
});
