const router = require("express").Router();
const ctrl = require("../controllers/emailRoutingRule.controller");
const { authenticate, requirePermission } = require("../../../middleware/auth.middleware");
const { csrfProtection } = require("../../../middleware/csrf.middleware");

const adminOnly = [authenticate, requirePermission("settings")];
const withCsrf = [...adminOnly, csrfProtection];

router.get("/", ...adminOnly, ctrl.list);
router.post("/", ...withCsrf, ctrl.create);
router.put("/:id", ...withCsrf, ctrl.update);
router.delete("/:id", ...withCsrf, ctrl.remove);
router.patch("/:id/status", ...withCsrf, ctrl.toggleStatus);

module.exports = router;
