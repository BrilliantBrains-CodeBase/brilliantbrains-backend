const mongoose = require("mongoose");
const crypto = require("crypto");

const STATUSES = ["subscribed", "unsubscribed", "bounced", "blocked", "pending"];
const SOURCES = [
  "website", "referral", "social_media", "email_campaign",
  "phone", "event", "partner", "linkedin", "import", "other",
];
const UNSUBSCRIBE_REASONS = [
  "too_many_emails", "not_relevant", "spam", "no_longer_interested", "other",
];

const schema = new mongoose.Schema(
  {
    // UUID doubles as the unsubscribe token — cryptographically random and non-guessable
    uuid: { type: String, unique: true, index: true },

    // ── Identity ─────────────────────────────────────────────────────────────────
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    fullName:    { type: String, trim: true, default: "", maxlength: 100 },
    phoneNumber: { type: String, trim: true, default: "" },

    // ── Subscription status ───────────────────────────────────────────────────────
    status: {
      type: String,
      enum: STATUSES,
      default: "subscribed",
      index: true,
    },
    subscribedAt: { type: Date, default: Date.now },

    // ── UTM & source tracking ────────────────────────────────────────────────────
    source:      { type: String, enum: SOURCES, default: "website", index: true },
    referrer:    { type: String, trim: true, default: "" },
    landingPage: { type: String, trim: true, default: "" },
    utmSource:   { type: String, trim: true, default: "" },
    utmMedium:   { type: String, trim: true, default: "" },
    utmCampaign: { type: String, trim: true, default: "" },
    utmContent:  { type: String, trim: true, default: "" },
    utmTerm:     { type: String, trim: true, default: "" },

    // ── Device & geo data ─────────────────────────────────────────────────────────
    ipAddress: { type: String, default: "" },
    browser:   { type: String, default: "" },
    os:        { type: String, default: "" },
    device:    { type: String, default: "" },
    country:   { type: String, default: "" },
    city:      { type: String, default: "" },

    // ── Email engagement ──────────────────────────────────────────────────────────
    openCount:     { type: Number, default: 0, min: 0 },
    clickCount:    { type: Number, default: 0, min: 0 },
    lastOpenedAt:  { type: Date, default: null },
    lastClickedAt: { type: Date, default: null },

    // ── Unsubscribe ───────────────────────────────────────────────────────────────
    unsubscribedAt:      { type: Date, default: null },
    unsubscribeReason:   { type: String, enum: [...UNSUBSCRIBE_REASONS, ""], default: "" },
    unsubscribeFeedback: { type: String, trim: true, default: "" },

    // ── Metadata ──────────────────────────────────────────────────────────────────
    tags:  { type: [String], default: [] },
    notes: { type: String, trim: true, default: "" },

    // ── Soft delete ───────────────────────────────────────────────────────────────
    softDeleted: { type: Boolean, default: false, index: true },
    deletedAt:   { type: Date, default: null },
    deletedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

// Pre-save: generate UUID on first creation
schema.pre("save", function (next) {
  if (!this.uuid) this.uuid = crypto.randomUUID();
  next();
});

// Compound indexes
schema.index({ email: 1, softDeleted: 1 });
schema.index({ status: 1, softDeleted: 1 });
schema.index({ source: 1, softDeleted: 1 });
schema.index({ subscribedAt: -1, softDeleted: 1 });
schema.index({ createdAt: -1 });
schema.index({ tags: 1 });
schema.index({ softDeleted: 1, status: 1, subscribedAt: -1 });

// Engagement score virtual: opens×1 + clicks×2, capped at 100
schema.virtual("engagementScore").get(function () {
  return Math.min(100, this.openCount + this.clickCount * 2);
});

schema.set("toJSON", { virtuals: true });
schema.set("toObject", { virtuals: true });

module.exports = mongoose.model("NewsletterSubscriber", schema);
module.exports.STATUSES = STATUSES;
module.exports.SOURCES = SOURCES;
module.exports.UNSUBSCRIBE_REASONS = UNSUBSCRIBE_REASONS;
