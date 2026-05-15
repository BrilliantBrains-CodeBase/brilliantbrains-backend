const router = require("express").Router();
const {
  getSettings,
  updateSettings,
} = require("../controllers/careerSettings.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.get("/", getSettings);
router.patch(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  updateSettings
);

module.exports = router;
