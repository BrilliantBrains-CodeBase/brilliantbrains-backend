const cron = require("node-cron");
const Blog = require("../models/Blog.model");

/**
 * Publish any blogs whose scheduledAt has passed.
 * Called both on server start (to catch any missed windows) and on every cron tick.
 */
const publishDueBlogs = async () => {
  const now = new Date();
  const result = await Blog.updateMany(
    { status: "scheduled", scheduledAt: { $lte: now } },
    { $set: { status: "published", publishedAt: now } }
  );
  if (result.modifiedCount > 0) {
    console.log(`[Scheduler] Published ${result.modifiedCount} scheduled blog(s) at ${now.toISOString()}`);
  }
};

const startScheduler = () => {
  // Catch up any blogs that were missed while the server was offline
  publishDueBlogs().catch((err) =>
    console.error("[Scheduler] Startup catchup error:", err.message)
  );

  // Check every minute
  cron.schedule("* * * * *", () => {
    publishDueBlogs().catch((err) =>
      console.error("[Scheduler] Cron error:", err.message)
    );
  });

  console.log("[Scheduler] Blog scheduler running — checks every minute");
};

module.exports = { startScheduler };
