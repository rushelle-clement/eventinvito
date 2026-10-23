// Makes an admin account (or turns an existing account into an admin), so you can use the
// admin page. Run once, from the server folder:
//
//   npm run create-admin -- you@example.com "Your Name" "a-strong-password"
//
// For an existing account the name and password are optional; a password given here replaces
// the old one. Uses MONGODB_URI from server/.env.

require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

async function main() {
    const [emailArg, name, password] = process.argv.slice(2);
    const email = (emailArg || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        console.error('Usage: npm run create-admin -- you@example.com "Your Name" "a-strong-password"');
        process.exit(1);
    }
    if (password && password.length < 12) {
        console.error("Use a password of at least 12 characters for an admin account.");
        process.exit(1);
    }

    await connectDB();
    let user = await User.findOne({ email });
    if (user) {
        user.role = "admin";
        user.disabled = false;
        if (name) user.name = name.trim();
        if (password) user.passwordHash = await bcrypt.hash(password, 12);
        await user.save();
        console.log(`${email} is now an admin.${password ? " Password updated." : ""}`);
    } else {
        if (!name || !password) {
            console.error("No account with that email yet: give a name and a password too.");
            process.exit(1);
        }
        user = await User.create({ name: name.trim(), email, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
        console.log(`Admin account created for ${email}. Sign in and open "Admin" from your account menu.`);
    }
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
