require("dotenv").config();
const mongoose = require("mongoose");
const Integration = require("../models/Integration.model");

const SEEDS = [
  {
    provider: "google_tag_manager",
    integrationName: "GTM – Production",
    config: { containerId: "GTM-PKPVQ46Z" },
    environment: "production",
    isActive: true,
    isDraft: false,
    tags: ["gtm", "production"],
    notes: "Migrated from hardcoded index.html on initial setup.",
  },
  {
    provider: "google_analytics_4",
    integrationName: "GA4 – Production",
    config: { measurementId: "G-XXXXXXXXXX" },
    environment: "production",
    isActive: false,
    isDraft: true,
    tags: ["analytics", "ga4"],
    notes: "Replace measurementId with real value before publishing.",
  },
  {
    provider: "microsoft_clarity",
    integrationName: "Clarity – All Envs",
    config: { projectId: "xxxxxxxxxx" },
    environment: "all",
    isActive: false,
    isDraft: true,
    tags: ["analytics", "clarity"],
    notes: "Replace projectId with real value before publishing.",
  },
  {
    provider: "meta_pixel",
    integrationName: "Meta Pixel – Production",
    config: { pixelId: "1234567890123456" },
    environment: "production",
    isActive: false,
    isDraft: true,
    tags: ["pixel", "meta"],
    notes: "Replace pixelId with real value before publishing.",
  },
  {
    provider: "google_search_console",
    integrationName: "Search Console Verification",
    config: { verificationContent: "your-verification-code-here" },
    environment: "production",
    isActive: false,
    isDraft: true,
    tags: ["verification", "seo"],
    notes: "Replace verificationContent with code from Google Search Console.",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  let inserted = 0;
  for (const data of SEEDS) {
    const exists = await Integration.findOne({
      provider: data.provider,
      integrationName: data.integrationName,
      softDeleted: { $ne: true },
    });
    if (exists) {
      console.log(`  SKIP  ${data.integrationName} (already exists)`);
      continue;
    }
    await Integration.create(data);
    console.log(`  INSERT ${data.integrationName}`);
    inserted++;
  }

  console.log(`\nDone — ${inserted} inserted, ${SEEDS.length - inserted} skipped.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
