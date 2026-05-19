const router = require("express").Router();
const multer = require("multer");
const ctrl = require("../controllers/newsletter.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");
const {
  subscribeSchema,
  processUnsubscribeSchema,
  updateSubscriberSchema,
  bulkActionSchema,
  updateSettingsSchema,
} = require("../validators/newsletter.validator");

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    cb(ok ? null : new Error("Only .csv files are accepted"), ok);
  },
}).single("csv");

// 5 subscribe attempts per 15 min per IP
const subscribeRateLimiter = createRateLimiter({ max: 5 });

const auth = [authenticate, requirePermission("newsletter")];

// ── Public (CSRF-exempt — see csrf.middleware.js) ─────────────────────────────
router.post("/subscribe",             subscribeRateLimiter, validate(subscribeSchema), ctrl.subscribe);
router.get( "/unsubscribe/:token",    ctrl.getUnsubscribeInfo);
router.post("/unsubscribe/:token",    validate(processUnsubscribeSchema), ctrl.processUnsubscribe);

// ── Admin: Analytics ──────────────────────────────────────────────────────────
router.get("/stats",      ...auth, ctrl.getStats);
router.get("/analytics",  ...auth, ctrl.getAnalytics);
router.get("/email-logs", ...auth, ctrl.getEmailLogs);

// ── Admin: Import / export ────────────────────────────────────────────────────
router.get( "/export", ...auth,          ctrl.exportSubscribers);
router.post("/import", ...auth, csvUpload, ctrl.importSubscribers);

// ── Admin: Bulk ───────────────────────────────────────────────────────────────
router.post("/bulk", ...auth, csrfProtection, validate(bulkActionSchema), ctrl.bulkAction);

// ── Admin: Settings ───────────────────────────────────────────────────────────
router.get(   "/settings", ...auth,                                     ctrl.getSettings);
router.patch( "/settings", ...auth, csrfProtection, validate(updateSettingsSchema), ctrl.updateSettings);

// ── Admin: Subscribers CRUD ───────────────────────────────────────────────────
router.get(    "/subscribers",     ...auth,                                           ctrl.getAllSubscribers);
router.get(    "/subscribers/:id", ...auth,                                           ctrl.getSubscriberById);
router.patch(  "/subscribers/:id", ...auth, csrfProtection, validate(updateSubscriberSchema), ctrl.updateSubscriber);
router.delete( "/subscribers/:id", ...auth, csrfProtection,                           ctrl.softDeleteSubscriber);

module.exports = router;
