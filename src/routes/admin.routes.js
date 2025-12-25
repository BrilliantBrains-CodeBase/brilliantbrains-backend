const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { ROLES } = require("../constants/roles");

router.get(
  "/dashboard",
  authenticate,
  authorize(ROLES.ADMIN),
  (_, res) => res.json({ success: true })
);

module.exports = router;
