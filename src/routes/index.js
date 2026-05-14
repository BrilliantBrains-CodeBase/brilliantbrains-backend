const router = require("express").Router();

router.use("/health", require("./health.routes"));
router.use("/csrf", require("./csrf.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/media", require("./media.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/blogs", require("./blog.routes"));
router.use("/categories", require("./category.routes"));
router.use("/tags", require("./tag.routes"));

module.exports = router;
