require("dotenv").config({ quiet: true });

const { checkEnv } = require("./config/env");
checkEnv();

const app = require("./app");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDB();
    // One-off tidy-up for accounts from before the Printed Cards badge was kept (never stops the server)
    require("./utils/printedMembers")
        .markPrintedMembers()
        .then((n) => n && console.log(`Marked ${n} Printed Cards account(s)`))
        .catch((err) => console.error("Printed Cards tidy-up failed:", err.message));

    const server = app.listen(PORT, () => {
        console.log(`EventInvito API running on port ${PORT}`);
    });

    // Finish in-flight requests and close the database cleanly when the host stops the app
    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down…`);
        server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
        setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}

startServer();
