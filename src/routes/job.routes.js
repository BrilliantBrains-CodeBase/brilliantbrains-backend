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
  requirePermission,
  optionalAuthenticate,
} = require("../middleware/auth.middleware");

// ── Public ────────────────────────────────────────────────────────────────────
router.get("/", optionalAuthenticate, getAllJobs);
router.get("/slug/:slug", getJobBySlug);

// ── Protected ─────────────────────────────────────────────────────────────────
router.get("/:id", authenticate, requirePermission("careers"), getJobById);
router.post("/", authenticate, requirePermission("careers"), createJob);
router.patch("/:id", authenticate, requirePermission("careers"), updateJob);
router.post("/:id/publish", authenticate, requirePermission("careers"), publishJob);
router.post("/:id/archive", authenticate, requirePermission("careers"), archiveJob);
router.post("/:id/duplicate", authenticate, requirePermission("careers"), duplicateJob);
router.delete("/:id", authenticate, requirePermission("careers"), deleteJob);

module.exports = router;
