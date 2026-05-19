const { Router } = require("express");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createIntegrationSchema,
  updateIntegrationSchema,
  toggleActiveSchema,
  updateSettingsSchema,
} = require("../validators/integration.validator");
const ctrl = require("../controllers/integration.controller");

const router = Router();

// ── Auth middleware shorthand ─────────────────────────────────────────────────
const auth = [authenticate, requirePermission("integrations")];

// ── Public (no auth) ──────────────────────────────────────────────────────────
// Frontend fetches this on every page load to inject active tracking scripts.
// Returns only active, published integrations. GET → no CSRF needed.
router.get("/active", ctrl.getPublicActive);

// ── Admin — read-only ─────────────────────────────────────────────────────────
router.get("/stats",       ...auth, ctrl.getStats);
router.get("/settings",    ...auth, ctrl.getSettings);
router.get("/",            ...auth, ctrl.getAllIntegrations);
router.get("/:id",         ...auth, ctrl.getIntegrationById);
router.get("/:id/revisions", ...auth, ctrl.getRevisions);

// ── Admin — state mutations (require CSRF) ────────────────────────────────────
router.post(
  "/",
  ...auth, csrfProtection,
  validate(createIntegrationSchema),
  ctrl.createIntegration,
);

router.patch(
  "/settings",
  ...auth, csrfProtection,
  validate(updateSettingsSchema),
  ctrl.updateSettings,
);

router.patch(
  "/:id",
  ...auth, csrfProtection,
  validate(updateIntegrationSchema),
  ctrl.updateIntegration,
);

router.patch(
  "/:id/toggle",
  ...auth, csrfProtection,
  validate(toggleActiveSchema),
  ctrl.toggleActive,
);

router.patch(
  "/:id/publish",
  ...auth, csrfProtection,
  ctrl.publishIntegration,
);

router.delete(
  "/:id",
  ...auth, csrfProtection,
  ctrl.softDeleteIntegration,
);

module.exports = router;
