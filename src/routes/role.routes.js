const router = require("express").Router();
const controller = require("../controllers/role.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const { ROLES } = require("../constants/roles");

router.use(authenticate);

// Admin + SuperAdmin can list roles (needed for UserDialog)
router.get("/", authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN), controller.getAllRoles);
router.get("/permissions", authorize(ROLES.SUPER_ADMIN), controller.getPermissions);

// Only SuperAdmin can create/edit/delete
router.post("/", authorize(ROLES.SUPER_ADMIN), csrfProtection, controller.createRole);
router.patch("/:id", authorize(ROLES.SUPER_ADMIN), csrfProtection, controller.updateRole);
router.delete("/:id", authorize(ROLES.SUPER_ADMIN), csrfProtection, controller.deleteRole);

module.exports = router;
