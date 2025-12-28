const router = require("express").Router();
const controller = require("../controllers/auth.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");

const {
  loginSchema,
  refreshSchema,
  logoutSchema
} = require("../validators/auth.validator");

// 🔐 CSRF token endpoint
router.get("/csrf-token", (req, res) => {
  res.json({
    csrfToken: req.csrfToken(),
  });
});

// LOGIN
router.post(
  "/login",
  // createRateLimiter({ max: 100 }),
  validate(loginSchema),
  controller.login
);

// REFRESH
router.post(
  "/refresh",
  createRateLimiter({ max: 10 }),
  validate(refreshSchema),
  controller.refresh
);

// LOGOUT
router.post(
  "/logout",
  authenticate,
  csrfProtection,
  validate(logoutSchema),
  controller.logout
);

// ME
router.get(
  "/me",
  authenticate,
  controller.me
);

module.exports = router;
