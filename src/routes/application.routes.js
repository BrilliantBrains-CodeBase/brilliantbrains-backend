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
const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const resumeUpload = require("../middleware/resumeUpload.middleware");

// ── Public ────────────────────────────────────────────────────────────────────
router.post("/", resumeUpload.single("resume"), submitApplication);

// ── Protected ─────────────────────────────────────────────────────────────────
const careersAccess = [authenticate, requirePermission("careers")];

router.get("/", ...careersAccess, getAllApplications);
router.get("/export", ...careersAccess, exportApplications);
router.get("/job/:jobId", ...careersAccess, getApplicationsByJob);
router.get("/:id", ...careersAccess, getApplicationById);
router.patch("/:id/status", ...careersAccess, updateStatus);
router.patch("/:id/notes", ...careersAccess, updateHRNotes);
router.patch("/:id/shortlist", ...careersAccess, toggleShortlist);
router.delete("/:id", ...careersAccess, deleteApplication);

module.exports = router;
