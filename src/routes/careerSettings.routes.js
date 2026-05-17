const router = require("express").Router();
const {
  getSettings,
  updateSettings,
} = require("../controllers/careerSettings.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.get("/", getSettings);
router.patch("/", authenticate, requirePermission("careers"), updateSettings);

module.exports = router;
