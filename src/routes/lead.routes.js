const router = require("express").Router();
const multer = require("multer");
const {
  submitLead,
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  softDeleteLead,
  restoreLead,
  assignLead,
  validateLead,
  convertLead,
  markLeadLost,
  archiveLead,
  addNote,
  getActivities,
  getStats,
  getAnalytics,
  getTrash,
  exportLeads,
  importLeads,
  bulkDelete,
  bulkRestore,
  bulkAssign,
  bulkStatusChange,
  getAssignableUsers,
} = require("../controllers/lead.controller");

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "text/csv" || file.originalname.toLowerCase().endsWith(".csv");
    cb(ok ? null : new Error("Only .csv files are accepted"), ok);
  },
}).single("csv");

const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createRateLimiter } = require("../middleware/rateLimit.middleware");
const {
  submitLeadSchema,
  createLeadSchema,
  updateLeadSchema,
  assignLeadSchema,
  validateLeadSchema,
  convertLeadSchema,
  lostLeadSchema,
  addNoteSchema,
  bulkIdsSchema,
  bulkAssignSchema,
  bulkStatusSchema,
} = require("../validators/lead.validator");

// Rate limiter for the public lead submission form (5 submissions / 15 min per IP)
const submitRateLimiter = createRateLimiter({ max: 5 });

const CRM = "crm";
const auth = [authenticate, requirePermission(CRM)];

// ── Public: Website form submission ──────────────────────────────────────────
// CSRF is bypassed for this endpoint in csrf.middleware.js
router.post("/submit", submitRateLimiter, validate(submitLeadSchema), submitLead);

// ── Admin: Bulk actions (before /:id to prevent capture) ─────────────────────
router.post("/bulk/delete",  ...auth, validate(bulkIdsSchema),    bulkDelete);
router.post("/bulk/restore", ...auth, validate(bulkIdsSchema),    bulkRestore);
router.post("/bulk/assign",  ...auth, validate(bulkAssignSchema), bulkAssign);
router.post("/bulk/status",  ...auth, validate(bulkStatusSchema), bulkStatusChange);

// ── Admin: Named paths (before /:id to prevent capture) ──────────────────────
router.get("/stats",            ...auth, getStats);
router.get("/analytics",        ...auth, getAnalytics);
router.get("/export",           ...auth, exportLeads);
router.post("/import",          ...auth, csvUpload, importLeads);
router.get("/trash",            ...auth, getTrash);
router.get("/assignable-users", ...auth, getAssignableUsers);

// ── Admin: Collection routes ──────────────────────────────────────────────────
router.get("/",  ...auth, getAllLeads);
router.post("/", ...auth, validate(createLeadSchema), createLead);

// ── Admin: Document-level routes ─────────────────────────────────────────────
router.get("/:id",    ...auth, getLeadById);
router.patch("/:id",  ...auth, validate(updateLeadSchema), updateLead);
router.delete("/:id", ...auth, softDeleteLead);

// ── Admin: Lead lifecycle ─────────────────────────────────────────────────────
router.patch("/:id/assign",   ...auth, validate(assignLeadSchema),   assignLead);
router.patch("/:id/validate", ...auth, validate(validateLeadSchema), validateLead);
router.patch("/:id/convert",  ...auth, validate(convertLeadSchema),  convertLead);
router.patch("/:id/lost",     ...auth, validate(lostLeadSchema),     markLeadLost);
router.patch("/:id/archive",  ...auth, archiveLead);
router.patch("/:id/restore",  ...auth, restoreLead);

// ── Admin: Notes & activity ───────────────────────────────────────────────────
router.post("/:id/notes",       ...auth, validate(addNoteSchema), addNote);
router.get("/:id/activities",   ...auth, getActivities);

module.exports = router;
