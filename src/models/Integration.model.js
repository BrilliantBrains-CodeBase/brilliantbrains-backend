const mongoose = require("mongoose");
const crypto = require("crypto");

// ── Provider → Category mapping (single source of truth) ──────────────────────
const PROVIDER_CATEGORIES = {
  // Analytics
  google_analytics_4:     "analytics",
  google_tag_manager:     "analytics",
  microsoft_clarity:      "analytics",
  hotjar:                 "analytics",
  // Pixels
  meta_pixel:             "pixel",
  tiktok_pixel:           "pixel",
  linkedin_insight:       "pixel",
  twitter_pixel:          "pixel",
  pinterest_pixel:        "pixel",
  // Ads
  google_ads:             "ads",
  // Verification
  google_search_console:  "verification",
  bing_webmaster:         "verification",
  meta_verification:      "verification",
  pinterest_verification: "verification",
  // Custom
  custom_script:          "custom_script",
};

const PROVIDERS    = Object.keys(PROVIDER_CATEGORIES);
const CATEGORIES   = ["analytics", "pixel", "ads", "verification", "custom_script"];
const ENVIRONMENTS = ["all", "production", "development", "test"];
const PLACEMENTS   = ["head", "body", "footer"];

const schema = new mongoose.Schema(
  {
    uuid: { type: String, unique: true, sparse: true },

    // ── Core ────────────────────────────────────────────────────────────────────
    provider: {
      type: String,
      enum: PROVIDERS,
      required: true,
      index: true,
    },
    // Auto-derived from provider in pre-save — never set manually
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
      index: true,
    },
    // Human-readable display name override (e.g. "Main GTM Container")
    integrationName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    // ── Config ──────────────────────────────────────────────────────────────────
    // Provider-specific structured config (GA4: measurementId, GTM: containerId…)
    // Validated at the controller/validator layer via per-provider Zod schemas
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Only used when provider === "custom_script"
    scriptContent: {
      type: String,
      default: "",
      maxlength: 100000,
    },
    // Where to inject (head | body | footer) — used by frontend injection system
    placement: {
      type: String,
      enum: PLACEMENTS,
      default: "head",
    },

    // ── Environment targeting ────────────────────────────────────────────────────
    environment: {
      type: String,
      enum: ENVIRONMENTS,
      default: "all",
      index: true,
    },

    // ── Status ──────────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDraft: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Whether the integration's tracking ID has been externally verified
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ── Versioning ───────────────────────────────────────────────────────────────
    // Incremented each time a custom_script is published — others stay at 1
    version: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ── Metadata ─────────────────────────────────────────────────────────────────
    tags:  [{ type: String, trim: true, maxlength: 50 }],
    notes: { type: String, trim: true, default: "", maxlength: 2000 },

    // ── Audit ────────────────────────────────────────────────────────────────────
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    publishedAt: { type: Date, default: null },

    // ── Soft delete ──────────────────────────────────────────────────────────────
    softDeleted: { type: Boolean, default: false, index: true },
    deletedAt:   { type: Date, default: null },
    deletedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// ── Pre-validate: generate UUID + auto-derive category from provider ─────────
// Must run before validate (not pre-save) so required: true on category passes.
schema.pre("validate", function (next) {
  if (!this.uuid) this.uuid = crypto.randomUUID();
  if (this.provider && PROVIDER_CATEGORIES[this.provider]) {
    this.category = PROVIDER_CATEGORIES[this.provider];
  }
  next();
});

// ── Compound indexes ──────────────────────────────────────────────────────────
schema.index({ provider: 1, softDeleted: 1 });
schema.index({ category: 1, softDeleted: 1 });
schema.index({ isActive: 1, isDraft: 1, softDeleted: 1 });
schema.index({ environment: 1, isActive: 1, isDraft: 1 });
schema.index({ createdAt: -1, softDeleted: 1 });

const Integration = mongoose.model("Integration", schema);

module.exports = Integration;
module.exports.PROVIDERS = PROVIDERS;
module.exports.CATEGORIES = CATEGORIES;
module.exports.ENVIRONMENTS = ENVIRONMENTS;
module.exports.PLACEMENTS = PLACEMENTS;
module.exports.PROVIDER_CATEGORIES = PROVIDER_CATEGORIES;
