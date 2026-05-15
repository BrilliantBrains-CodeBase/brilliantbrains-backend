const cron = require("node-cron");
const path = require("path");
const fs = require("fs");
const Job = require("../models/Job.model");
const JobApplication = require("../models/JobApplication.model");

// ── 1. Resume Cleanup ─────────────────────────────────────────────────────────
// Deletes resume files for applications older than 6 months.
// Candidate data (name, email, status) is preserved; only the file assets are removed.
const cleanupExpiredResumes = async () => {
  const now = new Date();
  const stale = await JobApplication.find({
    resumeUrl: { $exists: true, $ne: null },
    resumeDeletedAt: null,
    expiresAt: { $lte: now },
  }).select("_id resumeUrl");

  if (!stale.length) return;

  let cleaned = 0;
  let errors = 0;

  for (const app of stale) {
    try {
      if (app.resumeUrl) {
        const filePath = path.join(process.cwd(), "public", app.resumeUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await JobApplication.findByIdAndUpdate(app._id, {
        $set: {
          resumeUrl: null,
          resumeFileName: null,
          resumeMimeType: null,
          resumeFileSize: null,
          resumeDeletedAt: now,
        },
      });

      cleaned++;
    } catch (err) {
      errors++;
      console.error(
        `[CareerScheduler] Failed to clean resume for application ${app._id}:`,
        err.message
      );
    }
  }

  if (cleaned > 0 || errors > 0) {
    console.log(
      `[CareerScheduler] Resume cleanup — cleaned: ${cleaned}, errors: ${errors}`
    );
  }
};

// ── 2. Auto-close Expired Job Listings ───────────────────────────────────────
// Closes published jobs whose validTill date has passed.
const autoCloseExpiredJobs = async () => {
  const now = new Date();
  const result = await Job.updateMany(
    { status: "published", validTill: { $lte: now } },
    {
      $set: {
        status: "closed",
        closedAt: now,
        acceptingApplications: false,
      },
    }
  );

  if (result.modifiedCount > 0) {
    console.log(
      `[CareerScheduler] Auto-closed ${result.modifiedCount} expired job listing(s)`
    );
  }
};

// ── 3. Auto-archive Stale Closed Jobs ────────────────────────────────────────
// Archives jobs that have been in the "closed" state for more than 30 days.
const autoArchiveStaleJobs = async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await Job.updateMany(
    { status: "closed", closedAt: { $lte: thirtyDaysAgo } },
    { $set: { status: "archived", archivedAt: new Date() } }
  );

  if (result.modifiedCount > 0) {
    console.log(
      `[CareerScheduler] Auto-archived ${result.modifiedCount} stale job(s)`
    );
  }
};

// ── Run all jobs in sequence with safe error isolation ────────────────────────
const runAll = async () => {
  await cleanupExpiredResumes().catch((e) =>
    console.error("[CareerScheduler] Resume cleanup error:", e.message)
  );
  await autoCloseExpiredJobs().catch((e) =>
    console.error("[CareerScheduler] Auto-close error:", e.message)
  );
  await autoArchiveStaleJobs().catch((e) =>
    console.error("[CareerScheduler] Auto-archive error:", e.message)
  );
};

const startCareerScheduler = () => {
  // Catch up any missed operations on server restart
  runAll();

  // Daily at 02:00 AM server time
  cron.schedule("0 2 * * *", () => {
    console.log("[CareerScheduler] Running daily maintenance jobs...");
    runAll();
  });

  console.log(
    "[CareerScheduler] Career scheduler running — daily at 02:00 AM"
  );
};

module.exports = { startCareerScheduler };
