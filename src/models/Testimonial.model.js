const mongoose = require("mongoose");
const crypto = require("crypto");

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const testimonialSchema = new mongoose.Schema(
  {
    // External-safe identifier (no sequential leakage)
    uuid: {
      type: String,
      unique: true,
      index: true,
    },

    // ── Core person info ───────────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    designation: {
      type: String,
      trim: true,
      default: "",
      maxlength: [150, "Designation cannot exceed 150 characters"],
    },
    companyName: {
      type: String,
      trim: true,
      default: "",
      maxlength: [150, "Company name cannot exceed 150 characters"],
    },
    companyWebsite: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Testimonial content ────────────────────────────────────────────────────
    testimonialText: {
      type: String,
      required: [true, "Testimonial text is required"],
      trim: true,
      minlength: [10, "Testimonial must be at least 10 characters"],
      maxlength: [2000, "Testimonial cannot exceed 2000 characters"],
    },
    shortSummary: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Short summary cannot exceed 300 characters"],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },

    // ── Media ──────────────────────────────────────────────────────────────────
    profileImage: { type: String, default: "" },
    companyLogo: { type: String, default: "" },

    // ── Video support ──────────────────────────────────────────────────────────
    testimonialType: {
      type: String,
      enum: ["text", "video", "image"],
      default: "text",
    },
    videoUrl: { type: String, default: "" },
    videoThumbnail: { type: String, default: "" },

    // ── Contact info (internal only — never exposed in public APIs) ────────────
    location: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phoneNumber: { type: String, trim: true, default: "" },

    // ── Social links ───────────────────────────────────────────────────────────
    socialLinks: {
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      website: { type: String, default: "" },
    },

    // ── Display control ────────────────────────────────────────────────────────
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    isPinned: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0, index: true },
    showOnHomepage: { type: Boolean, default: false, index: true },
    showOnAboutPage: { type: Boolean, default: false },

    // ── Trust & analytics ──────────────────────────────────────────────────────
    source: { type: String, default: "" },
    collectedBy: { type: String, default: "" },
    verifiedStatus: { type: Boolean, default: false },
    likesCount: { type: Number, default: 0, min: 0 },
    impressionsCount: { type: Number, default: 0, min: 0 },
    clicksCount: { type: Number, default: 0, min: 0 },

    // ── SEO ───────────────────────────────────────────────────────────────────
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },

    // ── Categorization ─────────────────────────────────────────────────────────
    tags: [{ type: String, trim: true }],
    category: { type: String, default: "" },
    language: { type: String, default: "en" },

    // ── Attribution ────────────────────────────────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ── Soft delete ────────────────────────────────────────────────────────────
    softDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ── Pre-save: auto-generate UUID and unique slug ───────────────────────────────
testimonialSchema.pre("save", async function () {
  if (!this.uuid) {
    this.uuid = crypto.randomUUID();
  }

  if (!this.slug) {
    const base = slugify(
      this.companyName
        ? `${this.fullName} ${this.companyName}`
        : this.fullName
    ) || `testimonial-${Date.now()}`;

    let candidate = base;
    let counter = 1;

    while (
      await mongoose
        .model("Testimonial")
        .exists({ slug: candidate, _id: { $ne: this._id } })
    ) {
      candidate = `${base}-${counter++}`;
    }

    this.slug = candidate;
  }
});

// ── Indexes ────────────────────────────────────────────────────────────────────
testimonialSchema.index({ softDeleted: 1, isPublished: 1 });
testimonialSchema.index({ softDeleted: 1, isFeatured: 1, isPublished: 1 });
testimonialSchema.index({ softDeleted: 1, showOnHomepage: 1, isPublished: 1 });
testimonialSchema.index({ softDeleted: 1, createdAt: -1 });
testimonialSchema.index({ rating: -1, isPublished: 1, softDeleted: 1 });
testimonialSchema.index({ displayOrder: 1, createdAt: -1 });
testimonialSchema.index(
  { fullName: "text", companyName: "text", testimonialText: "text" },
  { weights: { fullName: 3, companyName: 2, testimonialText: 1 } }
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
