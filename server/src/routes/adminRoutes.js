const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const {
    listInvitations,
    updateInvitationLocks,
    listAccounts,
    createUserAccount,
    updateUserAccount,
    activateAccount,
    passwordSuggestion,
    listCustomDesigns,
    updateCustomDesign,
} = require("../controllers/adminController");

const router = express.Router();

// Admins only
router.use(requireAuth, requireRole("admin"));

router.get("/users", listAccounts);
router.post("/users", createUserAccount);
router.patch("/users/:id", updateUserAccount);
router.post("/users/:id/activate", activateAccount); // the couple paid for the package they chose
router.get("/password-suggestion", passwordSuggestion);
router.get("/custom-designs", listCustomDesigns);
router.patch("/custom-designs/:key", updateCustomDesign);
router.get("/invitations", listInvitations); // published invitations and what changed after
router.patch("/invitations/:id", updateInvitationLocks); // allow one name change / a new date

module.exports = router;
