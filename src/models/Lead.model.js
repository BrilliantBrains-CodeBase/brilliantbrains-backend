const mongoose = require("mongoose");
const crypto = require("crypto");

const LEAD_STATUSES = ["new", "valid", "invalid", "converted", "lost", "archived"];
const LEAD_PRIORITIES = ["low", "medium", "high", "urgent"];
const LEAD_SOURCES = [
  "website", "referral", "social_media", "email_campaign",
  "phone", "event", "partner", "linkedin", "other",
];
const BUDGET_RANGES = [
  "under_10k", "10k_50k", "50k_100k", "100k_500k", "above_500k", "undisclosed",
];

const leadSchema = new mongoose.Schema(
  {
    uuid: { type: String, unique: true, index: true },

    // ── Core contact ────────────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },
    phoneNumber: { type: String, trim: true, default: "" },
    companyName: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    message: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    serviceInterest: { type: String, trim: true, default: "" },
    budgetRange: {
      type: String,
      enum: BUDGET_RANGES,
      default: "undisclosed",
    },

    // ── UTM & Source tracking ───────────────────────────────────────────────────
    source: { type: String, enum: LEAD_SOURCES, default: "website", index: true },
    referrer: { type: String, default: "" },
    landingPage: { type: String, default: "" },
    utmSource: { type: String, default: "" },
    utmMedium: { type: String, default: "" },
    utmCampaign: { type: String, default: "" },
    utmContent: { type: String, default: "" },
    utmTerm: { type: String, default: "" },

    // ── Lead lifecycle ──────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: "new",
      index: true,
    },
    priority: {
      type: String,
      enum: LEAD_PRIORITIES,
      default: "medium",
      index: true,
    },

    // ── Validation ─────────────────────────────────────────────────────────────
    validationNotes: { type: String, default: "" },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    validatedAt: { type: Date, default: null },

    // ── Conversion ─────────────────────────────────────────────────────────────
    convertedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    convertedAt: { type: Date, default: null },
    conversionValue: { type: Number, default: 0, min: 0 },
    conversionNotes: { type: String, default: "" },

    // ── Lost ───────────────────────────────────────────────────────────────────
    lostReason: { type: String, default: "" },
    lostNotes: { type: String, default: "" },
    lostAt: { type: Date, default: null },
    lostBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Assignment ─────────────────────────────────────────────────────────────
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedAt: { type: Date, default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Device & geo ───────────────────────────────────────────────────────────
    ipAddress: { type: String, default: "" },
    browser: { type: String, default: "" },
    os: { type: String, default: "" },
    device: { type: String, default: "" },
    country: { type: String, default: "" },
    city: { type: String, default: "" },

    // ── Internal ───────────────────────────────────────────────────────────────
    tags: [{ type: String, trim: true }],
    internalNotes: { type: String, default: "" },

    // ── Attribution ────────────────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── Soft delete ────────────────────────────────────────────────────────────
    softDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

leadSchema.pre("save", async function () {
  if (!this.uuid) {
    this.uuid = crypto.randomUUID();
  }
});

// ── Indexes ────────────────────────────────────────────────────────────────────
leadSchema.index({ softDeleted: 1, status: 1 });
leadSchema.index({ softDeleted: 1, status: 1, createdAt: -1 });
leadSchema.index({ softDeleted: 1, assignedTo: 1, status: 1 });
leadSchema.index({ softDeleted: 1, source: 1, createdAt: -1 });
leadSchema.index({ softDeleted: 1, createdAt: -1 });
leadSchema.index({ utmCampaign: 1, status: 1 });
leadSchema.index(
  { fullName: "text", email: "text", companyName: "text", message: "text" },
  { weights: { fullName: 3, email: 2, companyName: 2, message: 1 } }
);

module.exports = mongoose.model("Lead", leadSchema);
module.exports.LEAD_STATUSES = LEAD_STATUSES;
module.exports.LEAD_PRIORITIES = LEAD_PRIORITIES;
module.exports.LEAD_SOURCES = LEAD_SOURCES;
module.exports.BUDGET_RANGES = BUDGET_RANGES;
