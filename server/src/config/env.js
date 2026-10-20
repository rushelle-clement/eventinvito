// Checks the settings in .env (or the hosting provider's environment variables) when the
// server starts, so a missing or weak value fails loudly instead of causing odd errors later.

function checkEnv() {
    const problems = [];
    const isProd = process.env.NODE_ENV === "production";

    if (!process.env.MONGODB_URI) problems.push("MONGODB_URI is missing (your MongoDB Atlas connection string).");

    const secret = process.env.JWT_SECRET || "";
    if (!secret) problems.push("JWT_SECRET is missing.");
    else if (secret.length < 32) problems.push("JWT_SECRET is too short. Use at least 32 random characters.");

    if (isProd) {
        const url = process.env.CLIENT_URL || "";
        if (!/^https:\/\//.test(url)) {
            problems.push("CLIENT_URL must be your site's https:// address in production (guest links are built from it).");
        }
    }

    if (problems.length) {
        console.error("\nThe server can't start because of its settings:\n");
        for (const p of problems) console.error("  • " + p);
        console.error("\nSee server/.env.example for every setting.\n");
        process.exit(1);
    }
}

module.exports = { checkEnv };
