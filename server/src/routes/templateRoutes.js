const express = require("express");
const { listTemplates, getTemplate } = require("../controllers/templateController");

const router = express.Router();

// Public: anyone can browse published templates
router.get("/", listTemplates);
router.get("/:key", getTemplate);

module.exports = router;
