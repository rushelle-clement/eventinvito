const express = require("express");
const { listTemplates, getTemplate } = require("../controllers/templateController");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Public: anyone can browse published templates. Signed in, a couple also sees their own custom design.
router.get("/", optionalAuth, listTemplates);
router.get("/:key", optionalAuth, getTemplate);

module.exports = router;
