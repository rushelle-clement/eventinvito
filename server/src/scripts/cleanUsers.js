// Removes every account except admins, with their invitations, guests and uploaded files
// (photos, own songs, logos on Cloudinary). Use it to clear test data before going live.
//
//   npm run clean-users            – shows what would be removed, changes nothing
//   npm run clean-users -- --yes   – removes it (can't be undone)
//
// Uses MONGODB_URI from server/.env, so check that it points at the database you mean.

require("dotenv").config({ quiet: true });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Invitation = require("../models/Invitation");
const Guest = require("../models/Guest");
const cloudinary = require("../utils/cloudinary");

// The files an invitation has on Cloudinary: [publicId, resourceType]
function filesOf(inv) {
    const files = (inv.photos || []).map((p) => [p.publicId, "image"]);
    if (inv.logo?.publicId) files.push([inv.logo.publicId, "image"]);
    if (inv.customMusic?.publicId) files.push([inv.customMusic.publicId, "video"]); // Cloudinary keeps audio as "video"
    return files.filter(([id]) => id);
}

async function main() {
    const apply = process.argv.includes("--yes");
    await connectDB();
    const db = mongoose.connection.name;

    const admins = await User.find({ role: "admin" }).select("email");
    const users = await User.find({ role: { $ne: "admin" } }).select("email plan createdAt");
    if (!admins.length) {
        console.error("No admin account found, so nothing was removed. Create one first: npm run create-admin");
        process.exit(1);
    }
    const ids = users.map((u) => u._id);
    const invitations = await Invitation.find({ owner: { $in: ids } }).select("photos logo customMusic");
    const guests = await Guest.countDocuments({ owner: { $in: ids } });
    const files = invitations.flatMap(filesOf);

    console.log(`Database: ${db}`);
    console.log(`Keeping ${admins.length} admin account(s): ${admins.map((a) => a.email).join(", ")}`);
    console.log(`To remove: ${users.length} account(s), ${invitations.length} invitation(s), ${guests} guest(s), ${files.length} uploaded file(s)`);
    for (const u of users) console.log(`  - ${u.email} (${u.plan || "free"})`);

    if (!apply) {
        console.log("\nNothing was changed. To remove these, run: npm run clean-users -- --yes");
        return mongoose.disconnect();
    }

    let filesRemoved = 0;
    for (const [publicId, type] of files) {
        await cloudinary
            .deleteResource(publicId, type)
            .then(() => (filesRemoved += 1))
            .catch((err) => console.warn(`  Couldn't remove file ${publicId}: ${err.message}`));
    }
    const g = await Guest.deleteMany({ owner: { $in: ids } });
    const i = await Invitation.deleteMany({ owner: { $in: ids } });
    const u = await User.deleteMany({ _id: { $in: ids }, role: { $ne: "admin" } });
    console.log(`\nRemoved ${u.deletedCount} account(s), ${i.deletedCount} invitation(s), ${g.deletedCount} guest(s), ${filesRemoved} file(s).`);
    await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
