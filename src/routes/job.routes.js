const router = require("express").Router();
const {
  getAllJobs,
  getJobBySlug,
  getJobById,
  createJob,
  updateJob,
  publishJob,
  archiveJob,
  duplicateJob,
  deleteJob,
} = require("../controllers/job.controller");
const {
  authenticate,
  authorize,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", optionalAuthenticate, getAllJobs);
router.get("/slug/:slug", getJobBySlug);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  getJobById
);
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  createJob
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  updateJob
);
router.post(
  "/:id/publish",
  authenticate,
  authorize("admin", "super_admin"),
  publishJob
);
router.post(
  "/:id/archive",
  authenticate,
  authorize("admin", "super_admin"),
  archiveJob
);
router.post(
  "/:id/duplicate",
  authenticate,
  authorize("admin", "super_admin"),
  duplicateJob
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  deleteJob
);

module.exports = router;
