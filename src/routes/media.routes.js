const router = require("express").Router();
const controller = require("../controllers/media.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const upload = require("../middleware/upload.middleware");
const { ROLES } = require("../constants/roles");

// All media routes are protected
router.use(authenticate);

// LIST MEDIA
router.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  controller.getAllMedia
);

// UPLOAD MEDIA
router.post(
  "/upload",
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  csrfProtection,
  upload.array("files", 10), // Allow up to 10 files
  controller.uploadMedia
);

// DELETE MEDIA
router.delete(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  csrfProtection,
  controller.deleteMedia
);

module.exports = router;
