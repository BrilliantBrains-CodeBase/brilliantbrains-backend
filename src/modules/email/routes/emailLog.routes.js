const router = require("express").Router();
const ctrl = require("../controllers/emailLog.controller");
const { authenticate, requirePermission } = require("../../../middleware/auth.middleware");
const { csrfProtection } = require("../../../middleware/csrf.middleware");

const adminOnly = [authenticate, requirePermission("settings")];
const withCsrf = [...adminOnly, csrfProtection];

router.get("/", ...adminOnly, ctrl.list);
router.get("/stats", ...adminOnly, ctrl.stats);
router.get("/:id", ...adminOnly, ctrl.getOne);
router.post("/:id/retry", ...withCsrf, ctrl.retry);
router.delete("/clear", ...withCsrf, ctrl.clearLogs);

module.exports = router;
