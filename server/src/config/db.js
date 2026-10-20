// Use public DNS so the mongodb+srv lookup works on networks whose DNS rejects SRV queries
require("node:dns").setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log("EventInvito MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

module.exports = connectDB;