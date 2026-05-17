const router = require("express").Router();
const ctrl = require("../controllers/emailTemplate.controller");
const { authenticate, requirePermission } = require("../../../middleware/auth.middleware");
const { csrfProtection } = require("../../../middleware/csrf.middleware");

const adminOnly = [authenticate, requirePermission("settings")];
const withCsrf = [...adminOnly, csrfProtection];

router.get("/", ...adminOnly, ctrl.list);
router.get("/:id", ...adminOnly, ctrl.getOne);
router.post("/", ...withCsrf, ctrl.create);
router.put("/:id", ...withCsrf, ctrl.update);
router.delete("/:id", ...withCsrf, ctrl.remove);
router.patch("/:id/status", ...withCsrf, ctrl.toggleStatus);
router.post("/:id/preview", ...adminOnly, ctrl.preview);
router.post("/:id/test", ...withCsrf, ctrl.sendTest);

module.exports = router;
