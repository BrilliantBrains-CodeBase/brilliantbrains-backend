const router = require("express").Router();
const { getDashboardStats } = require("../controllers/careerDashboard.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.get("/", authenticate, requirePermission("careers"), getDashboardStats);

module.exports = router;
