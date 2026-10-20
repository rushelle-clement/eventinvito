const Template = require("../models/Template");
const AppError = require("../utils/AppError");

// GET /api/templates?eventType=wedding — public gallery: published templates only (FR-012)
async function listTemplates(req, res) {
    const filter = { status: "published" };
    if (typeof req.query.eventType === "string" && Template.EVENT_TYPES.includes(req.query.eventType)) {
        filter.eventType = req.query.eventType;
    }
    const templates = await Template.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, templates: templates.map((t) => t.toPublicJSON()) });
}

// GET /api/templates/:key
async function getTemplate(req, res) {
    const template = await Template.findOne({ key: String(req.params.key), status: "published" });
    if (!template) throw new AppError(404, "Template not found.");
    res.json({ success: true, template: template.toPublicJSON() });
}

module.exports = { listTemplates, getTemplate };
