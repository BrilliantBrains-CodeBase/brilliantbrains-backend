const router = require("express").Router();
const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const { getDashboard } = require("../controllers/dashboard.controller");

router.get("/dashboard", authenticate, requirePermission("dashboard"), getDashboard);

module.exports = router;
