const Blog = require("../models/Blog.model");

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
  // Catch up any blogs missed while the server was offline
  publishDueBlogs().catch((err) =>
    console.error("[Scheduler] Startup catchup error:", err.message)
  );

  // Poll every 60 seconds — setInterval avoids node-cron's missed-tick warnings
  setInterval(() => {
    publishDueBlogs().catch((err) =>
      console.error("[Scheduler] Poll error:", err.message)
    );
  }, 60_000);

  console.log("[Scheduler] Blog scheduler running — checks every minute");
};

module.exports = { startScheduler };
