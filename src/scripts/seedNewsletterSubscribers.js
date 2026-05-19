/**
 * Seed 50 realistic newsletter subscribers for development/testing.
 * Run: node src/scripts/seedNewsletterSubscribers.js
 *
 * ⚠️  Clears all existing subscribers before seeding.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const NewsletterSubscriber = require("../models/NewsletterSubscriber.model");

// ── Helpers ────────────────────────────────────────────────────────────────────
const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const rand  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const randomDate = (maxDaysAgo = 180) => {
  const fraction = Math.pow(Math.random(), 1.6);
  return new Date(Date.now() - fraction * maxDaysAgo * 86400000);
};

// ── Data pools ─────────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Arjun", "Priya", "Rahul", "Neha", "Vikram", "Anjali", "Rohan", "Kavya",
  "Amit", "Sneha", "Deepak", "Pooja", "Suresh", "Meena", "Karan", "Divya",
  "James", "Sarah", "Michael", "Emily", "David", "Jessica", "Chris", "Ashley",
  "Yusuf", "Fatima", "Omar", "Layla", "Hassan", "Nour", "Siddharth", "Ritika",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Mehta", "Gupta", "Singh", "Kumar", "Joshi", "Shah",
  "Reddy", "Nair", "Iyer", "Verma", "Rao", "Malhotra", "Kapoor",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis",
  "Khan", "Ahmed", "Ali", "Hassan", "Ibrahim",
];

const TAGS_POOL = [
  "ecommerce", "marketing", "startup", "b2b", "saas", "influencer",
  "brand", "d2c", "enterprise", "sme", "fintech", "edtech", "vip",
];

const UTM_CAMPAIGNS   = ["spring_launch", "google_brand", "meta_retarget", "linkedin_outreach", "blog_seo", "webinar_followup", ""];
const UTM_SOURCES     = ["google", "facebook", "linkedin", "instagram", "email", "organic", ""];
const UTM_MEDIUMS     = ["cpc", "social", "email", "referral", "organic", ""];
const LANDING_PAGES   = ["/", "/services", "/blog", "/contact", "/pricing", "/portfolio"];
const REFERRERS       = ["https://google.com", "https://linkedin.com", "https://instagram.com", "https://facebook.com", ""];
const BROWSERS        = ["Chrome", "Safari", "Firefox", "Edge"];
const OS_LIST         = ["Windows", "macOS", "iOS", "Android"];
const DEVICES         = ["desktop", "mobile", "tablet"];
const COUNTRIES       = ["India", "India", "India", "United States", "United Kingdom", "UAE", "Singapore", "Australia"];
const CITIES          = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "New York", "London", "Dubai", "Singapore"];
const UNSUBSCRIBE_REASONS = ["too_many_emails", "not_relevant", "spam", "no_longer_interested", "other"];

// ── Status distribution (50 subscribers) ─────────────────────────────────────
const STATUS_DISTRIBUTION = [
  ...Array(32).fill("subscribed"),
  ...Array(8).fill("unsubscribed"),
  ...Array(4).fill("bounced"),
  ...Array(3).fill("blocked"),
  ...Array(3).fill("pending"),
];

const SOURCE_DISTRIBUTION = [
  ...Array(18).fill("website"),
  ...Array(8).fill("referral"),
  ...Array(7).fill("social_media"),
  ...Array(5).fill("linkedin"),
  ...Array(4).fill("email_campaign"),
  ...Array(3).fill("import"),
  ...Array(3).fill("event"),
  ...Array(2).fill("other"),
];

// ── Subscriber factory ─────────────────────────────────────────────────────────
function buildSubscriber(i) {
  const firstName = pick(FIRST_NAMES);
  const lastName  = pick(LAST_NAMES);
  const fullName  = Math.random() > 0.15 ? `${firstName} ${lastName}` : "";
  const emailLocal = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${rand(1, 99)}`;
  const emailDomain = pick(["gmail.com", "outlook.com", "yahoo.com", "hotmail.com", "icloud.com"]);

  const status      = STATUS_DISTRIBUTION[i % STATUS_DISTRIBUTION.length];
  const source      = SOURCE_DISTRIBUTION[i % SOURCE_DISTRIBUTION.length];
  const subscribedAt = randomDate(180);

  const utmCampaign = pick(UTM_CAMPAIGNS);
  const utmSource   = utmCampaign ? pick(UTM_SOURCES) : "";
  const utmMedium   = utmCampaign ? pick(UTM_MEDIUMS) : "";

  const openCount  = status === "subscribed" ? rand(0, 40)  : rand(0, 5);
  const clickCount = Math.floor(openCount * (Math.random() * 0.4));

  const doc = {
    uuid:         crypto.randomUUID(),
    email:        `${emailLocal}@${emailDomain}`,
    fullName,
    phoneNumber:  Math.random() > 0.6 ? `+91 ${rand(7000000000, 9999999999)}` : undefined,
    status,
    source,
    subscribedAt,
    tags:         pickN(TAGS_POOL, Math.random() > 0.5 ? rand(1, 3) : 0),
    notes:        Math.random() > 0.75 ? pick([
      "High-value contact — founder of a growing D2C brand.",
      "Met at BrandSummit 2025. Expressed strong interest.",
      "Referred by existing client. Warm contact.",
      "Subscribed after reading our influencer marketing blog post.",
      "Part of the LinkedIn outreach campaign batch.",
    ]) : "",
    referrer:    pick(REFERRERS),
    landingPage: pick(LANDING_PAGES),
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent:  utmCampaign ? pick(["hero_cta", "sidebar_banner", "popup_exit", ""]) : "",
    utmTerm:     utmCampaign ? pick(["digital marketing", "influencer agency", "ecommerce growth", ""]) : "",
    ipAddress:   `${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}`,
    browser:     pick(BROWSERS),
    os:          pick(OS_LIST),
    device:      pick(DEVICES),
    country:     pick(COUNTRIES),
    city:        pick(CITIES),
    openCount,
    clickCount,
    lastOpenedAt:  openCount  > 0 ? daysAgo(rand(1, 60)) : undefined,
    lastClickedAt: clickCount > 0 ? daysAgo(rand(1, 30)) : undefined,
    softDeleted: false,
    createdAt:   subscribedAt,
    updatedAt:   subscribedAt,
  };

  if (status === "unsubscribed") {
    const daysAfter = rand(3, 60);
    doc.unsubscribedAt     = new Date(subscribedAt.getTime() + daysAfter * 86400000);
    doc.unsubscribeReason  = pick(UNSUBSCRIBE_REASONS);
    doc.unsubscribeFeedback = Math.random() > 0.6 ? pick([
      "I get too many newsletters already.",
      "The content wasn't quite relevant to my business.",
      "I'm taking a break from marketing emails.",
      "",
    ]) : "";
  }

  return doc;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");

  await NewsletterSubscriber.deleteMany({});
  console.log("🗑️  Cleared existing newsletter subscribers");

  const docs = Array.from({ length: 50 }, (_, i) => buildSubscriber(i));
  const inserted = await NewsletterSubscriber.insertMany(docs, { timestamps: false });
  console.log(`✅ Inserted ${inserted.length} newsletter subscribers`);

  const byStatus = {};
  inserted.forEach((s) => { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
  console.log("\n📊 Status breakdown:", byStatus);

  const bySource = {};
  inserted.forEach((s) => { bySource[s.source] = (bySource[s.source] || 0) + 1; });
  console.log("📊 Source breakdown:", bySource);

  await mongoose.disconnect();
  console.log("\n✅ Seed complete. Disconnected.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
