const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
    listInvitations,
    createInvitation,
    getInvitation,
    updateInvitation,
    publishInvitation,
    unpublishInvitation,
    archiveInvitation,
} = require("../controllers/invitationController");
const { importGuests } = require("../controllers/guestImportController");
const { setQr } = require("../controllers/qrController");
const { photoSignature, addPhoto, removePhoto, reorderPhotos } = require("../controllers/photoController");
const { musicSignature, setMusic, removeMusic } = require("../controllers/musicController");
const { logoSignature, setLogo, removeLogo } = require("../controllers/logoController");
const { listGuests, addGuest, updateGuest, removeGuest, removeGuests, resetGuestLink, markGuestShared, setGuestsGroup } = require("../controllers/guestController");

const router = express.Router();

// Every invitation route needs a signed-in user
router.use(requireAuth);

router.get("/", listInvitations);
router.post("/", createInvitation);
router.get("/:id", getInvitation);
router.patch("/:id", updateInvitation);
router.delete("/:id", archiveInvitation);
router.post("/:id/publish", publishInvitation);
router.post("/:id/unpublish", unpublishInvitation);

// Photos (stored in Cloudinary)
router.post("/:id/photos/signature", photoSignature);
router.post("/:id/photos", addPhoto);
router.put("/:id/photos/order", reorderPhotos);
router.delete("/:id/photos/:photoId", removePhoto);

// The couple's own music file (also Cloudinary)
router.post("/:id/music/signature", musicSignature);
router.post("/:id/music", setMusic);
router.delete("/:id/music", removeMusic);

// Corporate events: the company logo
router.post("/:id/logo/signature", logoSignature);
router.post("/:id/logo", setLogo);
router.delete("/:id/logo", removeLogo);

// Guest list for one invitation
router.patch("/:id/qr", setQr); // printed cards QR code on/off
router.get("/:id/guests", listGuests);
router.post("/:id/guests", addGuest);
router.post("/:id/guests/import", importGuests); // bulk import from a spreadsheet (dry run or apply)
router.post("/:id/guests/group", setGuestsGroup); // put many guests in a group at once
router.post("/:id/guests/remove", removeGuests); // remove many guests at once
router.patch("/:id/guests/:guestId", updateGuest);
router.delete("/:id/guests/:guestId", removeGuest);
router.post("/:id/guests/:guestId/reset-link", resetGuestLink);
router.post("/:id/guests/:guestId/mark-shared", markGuestShared);

module.exports = router;
