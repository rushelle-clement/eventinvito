const Template = require("../models/Template");
const AppError = require("../utils/AppError");
const { releaseFinishedDesigns } = require("../utils/customDesigns");

// GET /api/templates?eventType=wedding — public gallery: published templates only (FR-012).
// A couple's own custom design is included only for them (signed in) until their event is over.
async function listTemplates(req, res) {
    await releaseFinishedDesigns();
    const filter = { status: "published" };
    if (typeof req.query.eventType === "string" && Template.EVENT_TYPES.includes(req.query.eventType)) {
        filter.eventType = req.query.eventType;
    }
    const templates = await Template.find(filter).sort({ sortOrder: 1, name: 1 });
    const visible = templates.filter((t) => t.isVisibleTo(req.user));
    res.json({ success: true, templates: visible.map((t) => t.toPublicJSON(req.user)) });
}

// GET /api/templates/:key
async function getTemplate(req, res) {
    await releaseFinishedDesigns();
    const template = await Template.findOne({ key: String(req.params.key), status: "published" });
    if (!template || !template.isVisibleTo(req.user)) throw new AppError(404, "Template not found.");
    res.json({ success: true, template: template.toPublicJSON(req.user) });
}

module.exports = { listTemplates, getTemplate };
