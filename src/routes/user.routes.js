const router = require("express").Router();
const controller = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const { ROLES } = require("../constants/roles");

// All routes are protected and require Admin/SuperAdmin role
router.use(authenticate);

// LIST USERS
router.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  controller.getAllUsers
);

// GET SINGLE USER
router.get(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  controller.getUserById
);

// CREATE USER
router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  csrfProtection,
  controller.createUser
);

// UPDATE USER
router.patch(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  csrfProtection,
  controller.updateUser
);

// DELETE USER
router.delete(
  "/:id",
  authorize(ROLES.SUPER_ADMIN), // Only Super Admin can delete
  csrfProtection,
  controller.deleteUser
);

module.exports = router;
