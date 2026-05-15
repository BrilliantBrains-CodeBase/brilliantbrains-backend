const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ── Organizational ──────────────────────────────────────────────────────
    department: { type: String, trim: true },
    team: { type: String, trim: true },
    location: { type: String, trim: true },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship", "freelance"],
      default: "full-time",
    },
    workplaceType: {
      type: String,
      enum: ["remote", "hybrid", "onsite"],
      default: "onsite",
    },
    openings: { type: Number, default: 1, min: 1 },

    // ── Experience ──────────────────────────────────────────────────────────
    minExperience: { type: Number, default: 0 },
    maxExperience: { type: Number },
    experienceLabel: { type: String, trim: true },

    // ── Content ─────────────────────────────────────────────────────────────
    shortDescription: { type: String, trim: true },
    jobDescription: { type: String },
    keyResponsibilities: [{ type: String }],
    requirements: [{ type: String }],
    preferredSkills: [{ type: String }],
    qualifications: [{ type: String }],
    benefits: [{ type: String }],
    techStack: [{ type: String }],

    // ── Compensation ────────────────────────────────────────────────────────
    salaryMin: { type: Number },
    salaryMax: { type: Number },
    currency: { type: String, default: "INR" },
    hideSalary: { type: Boolean, default: true },

    // ── SEO ─────────────────────────────────────────────────────────────────
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
    },

    // ── Status ──────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "published", "closed", "archived"],
      default: "draft",
      index: true,
    },

    // ── Application Control ─────────────────────────────────────────────────
    acceptingApplications: { type: Boolean, default: true },
    maxApplications: { type: Number },

    // ── Analytics ───────────────────────────────────────────────────────────
    viewsCount: { type: Number, default: 0 },
    applicationsCount: { type: Number, default: 0 },
    shortlistedCount: { type: Number, default: 0 },

    // ── Dates ────────────────────────────────────────────────────────────────
    postedAt: { type: Date },
    validTill: { type: Date, index: true },
    closedAt: { type: Date },
    archivedAt: { type: Date },

    // ── Metadata ─────────────────────────────────────────────────────────────
    tags: [{ type: String }],
    featured: { type: Boolean, default: false, index: true },
    priority: { type: Number, default: 0 },
    hiringManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // ── Lightweight recent applicants snapshot (max 5) ───────────────────────
    recentApplicants: [
      {
        applicantId: { type: mongoose.Schema.Types.ObjectId, ref: "JobApplication" },
        name: { type: String },
        email: { type: String },
        appliedAt: { type: Date },
        status: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate jobId: JOB-{unix-seconds}-{4-digit-rand}
jobSchema.pre("save", async function () {
  if (!this.jobId) {
    const ts = Math.floor(Date.now() / 1000);
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.jobId = `JOB-${ts}-${rand}`;
  }
});

// Compound + text indexes for search performance
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ featured: 1, status: 1 });
jobSchema.index({ department: 1, status: 1 });
jobSchema.index({ title: "text", shortDescription: "text", department: "text", location: "text" });

module.exports = mongoose.model("Job", jobSchema);
