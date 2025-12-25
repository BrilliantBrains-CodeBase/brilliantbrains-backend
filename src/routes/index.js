const router = require("express").Router();

router.use("/health", require("./health.routes"));
router.use("/csrf", require("./csrf.routes"));   // ✅ ADD THIS
router.use("/auth", require("./auth.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
