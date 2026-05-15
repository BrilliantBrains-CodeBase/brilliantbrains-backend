const mongoose = require("mongoose");

const careerSettingsSchema = new mongoose.Schema(
  {
    // Singleton guard — only one document should ever exist
    singleton: { type: String, default: "career_settings", unique: true },

    // ── Page Content ─────────────────────────────────────────────────────────
    pageTitle: { type: String, default: "Careers at Brilliant Brains" },
    pageSubtitle: {
      type: String,
      default: "Join our team of passionate problem-solvers and make an impact.",
    },
    heroBadgeText: { type: String, default: "We're Hiring" },
    ctaText: { type: String, default: "View Open Positions" },
    heroBgColor: { type: String, default: "#111111" },

    // ── Culture & Perks Section ───────────────────────────────────────────────
    cultureHeading: { type: String, default: "Why join us?" },
    cultureDescription: { type: String },
    perks: [
      {
        icon: { type: String },
        title: { type: String },
        description: { type: String },
      },
    ],

    // ── Application Settings ─────────────────────────────────────────────────
    allowDirectApplications: { type: Boolean, default: true },
    requireCoverLetter: { type: Boolean, default: false },
    allowLinkedinApply: { type: Boolean, default: false },
    autoAcknowledgeEmail: { type: Boolean, default: true },
    acknowledgeEmailSubject: {
      type: String,
      default: "We received your application — Brilliant Brains",
    },
    acknowledgeEmailBody: { type: String },

    // ── HR Contact ───────────────────────────────────────────────────────────
    hrEmail: { type: String },
    hrName: { type: String },

    // ── SEO ──────────────────────────────────────────────────────────────────
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareerSettings", careerSettingsSchema);
