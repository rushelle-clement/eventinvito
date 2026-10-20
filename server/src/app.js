const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const templateRoutes = require("./routes/templateRoutes");
const invitationRoutes = require("./routes/invitationRoutes");
const publicInviteRoutes = require("./routes/publicInviteRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Behind a hosting provider's proxy (Render, Railway, Nginx…) this lets rate limiting
// see each visitor's real IP address instead of the proxy's. Set TRUST_PROXY=1 there.
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);

// Security headers (NFR-003). The content policy allows only this site's own scripts,
// plus Google Fonts for the typefaces.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                // React sets colours with inline style attributes, so inline styles are allowed (not scripts)
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
                // Photos are served by Cloudinary; uploads go straight from the browser to Cloudinary
                imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
                connectSrc: ["'self'", "https://api.cloudinary.com"],
                // Background music: built-in tracks from this site, the couple's own from Cloudinary
                mediaSrc: ["'self'", "https://res.cloudinary.com"],
                frameAncestors: ["'none'"],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"],
                // Only force https when the site itself runs on https (not when testing locally)
                upgradeInsecureRequests: /^https:/.test(process.env.CLIENT_URL || "") ? [] : null,
            },
        },
        // Guest links carry a private code in the URL — never send it to other sites
        referrerPolicy: { policy: "no-referrer" },
        crossOriginEmbedderPolicy: false,
    })
);

// The site may be on another address than the API (e.g. Vercel + Render): only the site's own
// address(es) may call the API from a browser. ALLOWED_ORIGINS adds more, comma-separated
// (e.g. the www. version of a custom domain).
const allowedOrigins = [process.env.CLIENT_URL || "http://localhost:5173", ...(process.env.ALLOWED_ORIGINS || "").split(",")]
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));

// 1 MB is enough for a 1,000-row guest import and still blocks oversized requests
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "EventInvito API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/invite", publicInviteRoutes);

// Unknown /api/... addresses get a JSON 404
app.use("/api", notFound);

// In production the same server also serves the built React app (client/dist),
// so the whole site runs from one address. Any non-API path returns index.html
// and React Router shows the right page.
const clientDist = path.resolve(__dirname, "../../client/dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(path.join(clientDist, "index.html"))) {
    app.use(
        express.static(clientDist, {
            index: false,
            setHeaders(res, filePath) {
                // Built files have a content hash in their name, so they can be cached for a long time
                if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            },
        })
    );
    app.get("/{*path}", (req, res) => {
        res.setHeader("Cache-Control", "no-cache");
        res.sendFile(path.join(clientDist, "index.html"));
    });
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
