/**
 * One-time migration: fix blog scheduledAt timestamps that were stored in UTC
 * as if they were IST (i.e., 5h30m ahead of the correct UTC value).
 *
 * Root cause: frontend sent a naive datetime string ("2026-05-16T10:46") and the
 * UTC server stored it as UTC 10:46, but the user intended IST 10:46 = UTC 05:16.
 *
 * Run on the VPS:
 *   node src/scripts/fixScheduledBlogTimes.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Blog = require("../models/Blog.model");

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5h30m

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB\n");

  const blogs = await Blog.find({ status: "scheduled" });
  console.log(`Found ${blogs.length} scheduled blog(s)\n`);

  if (blogs.length === 0) {
    console.log("Nothing to fix.");
    process.exit(0);
  }

  const now = new Date();
  let published = 0;
  let corrected = 0;

  for (const blog of blogs) {
    const wrong = blog.scheduledAt;
    const correct = new Date(wrong.getTime() - IST_OFFSET_MS);

    console.log(`"${blog.title}"`);
    console.log(`  Stored (wrong) : ${wrong.toISOString()}  →  IST ${wrong.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);
    console.log(`  Correct UTC    : ${correct.toISOString()}  →  IST ${correct.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`);

    if (correct <= now) {
      await Blog.findByIdAndUpdate(blog._id, {
        $set: { status: "published", publishedAt: now, scheduledAt: null },
      });
      console.log(`  Action: published immediately (scheduled time is now in the past)`);
      published++;
    } else {
      await Blog.findByIdAndUpdate(blog._id, { $set: { scheduledAt: correct } });
      console.log(`  Action: timestamp corrected — scheduler will publish at correct IST time`);
      corrected++;
    }
    console.log();
  }

  console.log(`Done — ${published} published, ${corrected} timestamp(s) corrected.`);
  process.exit(0);
})().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
