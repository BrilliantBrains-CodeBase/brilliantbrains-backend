const router = require("express").Router();
const {
  submitApplication,
  getAllApplications,
  getApplicationsByJob,
  getApplicationById,
  updateStatus,
  updateHRNotes,
  toggleShortlist,
  deleteApplication,
  exportApplications,
} = require("../controllers/application.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const resumeUpload = require("../middleware/resumeUpload.middleware");

// ── Public ────────────────────────────────────────────────────────────────────
// Resume is optional — applicants may not always upload one
router.post("/", resumeUpload.single("resume"), submitApplication);

// ── Admin ─────────────────────────────────────────────────────────────────────
const adminOnly = [authenticate, authorize("admin", "super_admin")];

router.get("/", ...adminOnly, getAllApplications);
router.get("/export", ...adminOnly, exportApplications);
router.get("/job/:jobId", ...adminOnly, getApplicationsByJob);
router.get("/:id", ...adminOnly, getApplicationById);
router.patch("/:id/status", ...adminOnly, updateStatus);
router.patch("/:id/notes", ...adminOnly, updateHRNotes);
router.patch("/:id/shortlist", ...adminOnly, toggleShortlist);
router.delete("/:id", ...adminOnly, deleteApplication);

module.exports = router;
