const router = require("express").Router();

router.use("/health", require("./health.routes"));
router.use("/csrf", require("./csrf.routes"));
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/media", require("./media.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/settings", require("./settings.routes"));
router.use("/blogs", require("./blog.routes"));
router.use("/categories", require("./category.routes"));
router.use("/tags", require("./tag.routes"));

// ── Careers & Recruitment ─────────────────────────────────────────────────────
router.use("/jobs", require("./job.routes"));
router.use("/applications", require("./application.routes"));
router.use("/career-settings", require("./careerSettings.routes"));
router.use("/career-dashboard", require("./careerDashboard.routes"));

// ── Email & SMTP ──────────────────────────────────────────────────────────────
router.use("/email", require("../modules/email/routes"));

// ── Roles & RBAC ──────────────────────────────────────────────────────────────
router.use("/roles", require("./role.routes"));

// ── Testimonials ───────────────────────────────────────────────────────────────
router.use("/testimonials", require("./testimonial.routes"));

// ── CRM / Lead Management ──────────────────────────────────────────────────────
router.use("/leads", require("./lead.routes"));

// ── Newsletter Subscription Management ────────────────────────────────────────
router.use("/newsletter", require("./newsletter.routes"));

module.exports = router;
