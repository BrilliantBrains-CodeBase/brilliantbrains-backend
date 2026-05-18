const router = require("express").Router();
const {
  getAllTestimonials,
  getTrash,
  getStats,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  softDeleteTestimonial,
  restoreTestimonial,
  permanentDelete,
  bulkDelete,
  bulkPublish,
  bulkFeature,
  bulkRestore,
  bulkPermanentDelete,
  getPublicFeatured,
  getPublicHomepage,
  getPublicWall,
  getPublicStats,
  getPublicLatest,
  getPublicRandom,
  getPublicByCategory,
  getPublicByRating,
} = require("../controllers/testimonial.controller");

const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createTestimonialSchema,
  updateTestimonialSchema,
  bulkActionSchema,
  bulkPublishSchema,
  bulkFeatureSchema,
} = require("../validators/testimonial.validator");

// ── Public routes (no authentication required) ────────────────────────────────
// These must be defined BEFORE any /:id pattern routes to avoid conflicts.
router.get("/public/featured", getPublicFeatured);
router.get("/public/homepage", getPublicHomepage);
router.get("/public/wall", getPublicWall);
router.get("/public/stats", getPublicStats);
router.get("/public/latest", getPublicLatest);
router.get("/public/random", getPublicRandom);
router.get("/public/category/:category", getPublicByCategory);
router.get("/public/rating/:rating", getPublicByRating);

// ── Admin: Bulk actions (before /:id routes to prevent path collision) ────────
router.post(
  "/bulk/delete",
  authenticate, requirePermission("testimonials"),
  validate(bulkActionSchema),
  bulkDelete
);
router.post(
  "/bulk/publish",
  authenticate, requirePermission("testimonials"),
  validate(bulkPublishSchema),
  bulkPublish
);
router.post(
  "/bulk/feature",
  authenticate, requirePermission("testimonials"),
  validate(bulkFeatureSchema),
  bulkFeature
);
router.post(
  "/bulk/restore",
  authenticate, requirePermission("testimonials"),
  validate(bulkActionSchema),
  bulkRestore
);
router.post(
  "/bulk/permanent-delete",
  authenticate, requirePermission("testimonials"),
  validate(bulkActionSchema),
  bulkPermanentDelete
);

// ── Admin: Specific paths (must precede /:id to avoid capture) ────────────────
router.get("/stats", authenticate, requirePermission("testimonials"), getStats);
router.get("/trash", authenticate, requirePermission("testimonials"), getTrash);

// ── Admin: Collection routes ───────────────────────────────────────────────────
router.get("/", authenticate, requirePermission("testimonials"), getAllTestimonials);
router.post(
  "/",
  authenticate, requirePermission("testimonials"),
  validate(createTestimonialSchema),
  createTestimonial
);

// ── Admin: Document-level routes ──────────────────────────────────────────────
router.get("/:id", authenticate, requirePermission("testimonials"), getTestimonialById);
router.patch(
  "/:id",
  authenticate, requirePermission("testimonials"),
  validate(updateTestimonialSchema),
  updateTestimonial
);
router.delete("/:id", authenticate, requirePermission("testimonials"), softDeleteTestimonial);
router.patch("/:id/restore", authenticate, requirePermission("testimonials"), restoreTestimonial);
router.delete("/:id/permanent", authenticate, requirePermission("testimonials"), permanentDelete);

module.exports = router;
