const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      index: true,
    },

    // ── Job Reference ────────────────────────────────────────────────────────
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    jobId: { type: String, index: true }, // human-readable reference (JOB-xxx)

    // ── Candidate ────────────────────────────────────────────────────────────
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true },
    currentLocation: { type: String, trim: true },
    experience: { type: Number }, // years
    currentCompany: { type: String, trim: true },

    // ── Compensation ─────────────────────────────────────────────────────────
    currentCTC: { type: Number },
    expectedCTC: { type: Number },
    noticePeriod: { type: Number }, // days

    // ── Links ────────────────────────────────────────────────────────────────
    portfolio: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },

    // ── Content ──────────────────────────────────────────────────────────────
    coverLetter: { type: String },
    skills: [{ type: String }],

    // ── Resume (file reference only — binary lives on disk) ──────────────────
    resumeUrl: { type: String },
    resumeFileName: { type: String },
    resumeMimeType: { type: String },
    resumeFileSize: { type: Number },
    resumeDeletedAt: { type: Date }, // set when resume is auto-cleaned

    // ── Workflow ─────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: [
        "applied",
        "screening",
        "shortlisted",
        "interview_scheduled",
        "interviewed",
        "selected",
        "rejected",
        "on_hold",
      ],
      default: "applied",
      index: true,
    },

    // ── Admin ────────────────────────────────────────────────────────────────
    hrNotes: { type: String },
    rejectionReason: { type: String },
    shortlisted: { type: Boolean, default: false, index: true },
    interviewDate: { type: Date },
    interviewNotes: { type: String },

    // ── Attribution Tracking ─────────────────────────────────────────────────
    source: { type: String, trim: true },
    utmSource: { type: String, trim: true },
    utmCampaign: { type: String, trim: true },

    // ── Dates ────────────────────────────────────────────────────────────────
    appliedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date }, // resume auto-cleanup 6 months from appliedAt
  },
  { timestamps: true }
);

// Auto-generate applicationId + set expiresAt on first save
applicationSchema.pre("save", function (next) {
  if (!this.applicationId) {
    const ts = Math.floor(Date.now() / 1000);
    const rand = Math.floor(Math.random() * 9000) + 1000;
    this.applicationId = `APP-${ts}-${rand}`;
  }
  if (!this.expiresAt) {
    const d = new Date(this.appliedAt || Date.now());
    d.setMonth(d.getMonth() + 6);
    this.expiresAt = d;
  }
  next();
});

// Indexes for common query patterns
applicationSchema.index({ job: 1, status: 1, appliedAt: -1 });
applicationSchema.index({ email: 1, job: 1 }, { unique: true }); // prevent duplicate applications
applicationSchema.index({ expiresAt: 1 });                        // for cron cleanup
applicationSchema.index({ shortlisted: 1, status: 1 });

module.exports = mongoose.model("JobApplication", applicationSchema);
