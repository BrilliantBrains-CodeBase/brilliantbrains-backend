const router = require("express").Router();

router.use("/health", require("./health.routes"));
router.use("/csrf", require("./csrf.routes"));   // ✅ ADD THIS
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/media", require("./media.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/settings", require("./settings.routes"));

module.exports = router;
