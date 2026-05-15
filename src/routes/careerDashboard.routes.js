const router = require("express").Router();
const { getDashboardStats } = require("../controllers/careerDashboard.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.get(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  getDashboardStats
);

module.exports = router;
