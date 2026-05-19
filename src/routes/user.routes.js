const router = require("express").Router();
const controller = require("../controllers/user.controller");
const { authenticate, authorize, requirePermission } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const { ROLES } = require("../constants/roles");

router.use(authenticate);

router.get("/", requirePermission("users"), controller.getAllUsers);
router.get("/:id", requirePermission("users"), controller.getUserById);
router.post("/", requirePermission("users"), csrfProtection, controller.createUser);
router.patch("/:id", requirePermission("users"), csrfProtection, controller.updateUser);
router.delete("/:id", authorize(ROLES.SUPER_ADMIN), csrfProtection, controller.deleteUser);
router.post("/:id/reset-password", authorize(ROLES.SUPER_ADMIN), csrfProtection, controller.resetUserPassword);

module.exports = router;
