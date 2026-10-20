// Adds (or updates) the built-in invitation templates in MongoDB.
// Run from the server folder:  npm run seed:templates
//
// Safe to run more than once: existing templates are matched by `key` and updated,
// never duplicated. Invitations already using a template are not touched.

require("node:dns").setServers(["8.8.8.8", "1.1.1.1"]);
require("dotenv").config();

const mongoose = require("mongoose");
const Template = require("../models/Template");
const templates = require("../data/templates");

async function main() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });

    for (const t of templates) {
        const result = await Template.updateOne({ key: t.key }, { $set: t }, { upsert: true, runValidators: true });
        const action = result.upsertedCount ? "added" : result.modifiedCount ? "updated" : "unchanged";
        console.log(`  ${t.name.padEnd(16)} ${action}`);
    }

    const published = await Template.countDocuments({ status: "published" });
    console.log(`Done. ${published} published template(s).`);
}

main()
    .catch((err) => {
        console.error("Seeding failed:", err.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
