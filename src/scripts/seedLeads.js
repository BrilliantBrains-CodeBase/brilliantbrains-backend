/**
 * Seed 40 realistic leads + activity records for CRM development/testing.
 * Run: node src/scripts/seedLeads.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const crypto = require("crypto");
const Lead = require("../models/Lead.model");
const LeadActivity = require("../models/LeadActivity.model");

// ── Helpers ────────────────────────────────────────────────────────────────────
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

/** Random date within the last `days` days, weighted toward recent dates */
const randomDate = (maxDaysAgo = 90) => {
  // Bias toward more recent: use square root so recent dates appear more often
  const fraction = Math.pow(Math.random(), 1.8);
  const msAgo = fraction * maxDaysAgo * 24 * 60 * 60 * 1000;
  return new Date(Date.now() - msAgo);
};

// ── Raw data pools ─────────────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Arjun", "Priya", "Rahul", "Neha", "Vikram", "Anjali", "Rohan", "Kavya",
  "Amit", "Sneha", "Deepak", "Pooja", "Suresh", "Meena", "Karan", "Divya",
  "James", "Sarah", "Michael", "Emily", "David", "Jessica", "Chris", "Ashley",
  "Yusuf", "Fatima", "Omar", "Layla", "Hassan", "Nour",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Mehta", "Gupta", "Singh", "Kumar", "Joshi", "Shah",
  "Reddy", "Nair", "Iyer", "Verma", "Rao", "Malhotra", "Kapoor",
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis",
  "Khan", "Ahmed", "Ali", "Hassan", "Ibrahim",
];

const COMPANIES = [
  "TechNova Solutions", "Bright Digital Co.", "Apex Retail Ltd.", "CloudBase Inc.",
  "UrbanCart Pvt Ltd", "GreenLeaf Organics", "SwiftLogix", "Pinnacle EdTech",
  "NexGen Fintech", "BlueStar Media", "Zync Commerce", "FabricHub",
  "DataSpark Analytics", "Skyline Realty", "CraftBrew Studio", "Orbit SaaS",
  "FutureMart", "IndigoWave Agency", "StoneWall Builders", "PrimeCare Health",
  "Luminary Designs", "VelocityPay", "Harborview Logistics", "Elevate Marketing",
];

const SERVICES = [
  "E-commerce Website Development", "Mobile App Development", "UI/UX Design",
  "Digital Marketing & SEO", "Brand Identity & Logo Design", "Custom CRM Development",
  "Cloud Infrastructure Setup", "Social Media Management", "Content Strategy",
  "Performance Marketing", "Web App Development", "Product Photography",
  "Video Production", "Email Marketing Automation", "Conversion Rate Optimization",
];

const MESSAGES = [
  "We're looking to redesign our e-commerce platform from scratch. Currently running on an outdated WordPress theme and need something custom.",
  "Our startup needs a mobile app for both iOS and Android. We have the wireframes ready and need a development partner.",
  "I came across your portfolio and loved the work you did for similar brands. Looking for a complete brand refresh.",
  "We need help with our Google Ads and Meta campaigns. Our ROAS has been declining and we need expert help.",
  "Looking for a long-term digital agency to handle all our online presence — website, SEO, and social media.",
  "We want to build a SaaS dashboard for our field service team. Need a React developer who can work with our existing APIs.",
  "Our current website is slow and not converting. We need a full audit and a rebuild with better UX.",
  "We're launching a new product line and need everything from branding to the launch campaign.",
  "Need a custom inventory management system integrated with our existing ERP.",
  "Looking for someone to handle our content calendar, blog writing, and LinkedIn presence.",
  "We have a budget of around ₹5-8 lakhs for a complete digital overhaul. Please share your pricing.",
  "Our team is 50+ people but we're using spreadsheets for HR. We need a custom HR portal.",
  "Referred by a colleague who said you're the best for React development in the city.",
  "We're in the healthcare sector and need a HIPAA-compliant patient portal.",
  "Just launched our D2C brand and need a Shopify store with custom theme development.",
];

const TAGS_POOL = [
  "ecommerce", "b2b", "b2c", "urgent", "high-value", "startup",
  "enterprise", "healthcare", "fintech", "saas", "mobile", "web",
  "branding", "marketing", "referral-lead", "cold",
];

const UTM_CAMPAIGNS = [
  "summer_launch_2025", "google_search_brand", "meta_retarget_q2",
  "linkedin_cto_outreach", "email_nurture_seq1", "referral_partner_v2",
  "content_seo_blog", "webinar_followup_may", "",
];

const UTM_SOURCES = ["google", "facebook", "linkedin", "email", "partner", "organic", ""];
const UTM_MEDIUMS = ["cpc", "social", "email", "referral", "organic", ""];

const DEVICES = ["desktop", "mobile", "tablet"];
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge"];
const OS_LIST = ["Windows", "macOS", "iOS", "Android", "Linux"];

const LOST_REASONS = [
  "Chose a competitor", "Budget constraints", "Project cancelled internally",
  "No response after follow-up", "Timeline mismatch", "Scope too large",
  "Went with in-house team",
];

const LANDING_PAGES = [
  "/", "/services/web-development", "/services/digital-marketing",
  "/services/mobile-app", "/portfolio", "/pricing", "/contact",
  "/services/branding", "/blog/top-10-ecommerce-trends-2025",
];

const REFERRERS = [
  "https://google.com", "https://facebook.com", "https://linkedin.com",
  "https://instagram.com", "https://twitter.com", "",
];

// ── Lead factory ───────────────────────────────────────────────────────────────
const STATUS_DISTRIBUTION = [
  ...Array(14).fill("new"),
  ...Array(9).fill("valid"),
  ...Array(5).fill("invalid"),
  ...Array(6).fill("converted"),
  ...Array(4).fill("lost"),
  ...Array(2).fill("archived"),
];

function buildLead(i) {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const company = pick(COMPANIES);
  const emailLocal = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  const emailDomain = pick(["gmail.com", "company.com", "outlook.com", company.toLowerCase().replace(/[^a-z]/g, "") + ".com"]);

  const status = STATUS_DISTRIBUTION[i % STATUS_DISTRIBUTION.length];
  const createdAt = randomDate(90);

  const utmCampaign = pick(UTM_CAMPAIGNS);
  const utmSource = utmCampaign ? pick(UTM_SOURCES) : "";
  const utmMedium = utmCampaign ? pick(UTM_MEDIUMS) : "";

  const lead = {
    uuid: crypto.randomUUID(),
    fullName,
    email: `${emailLocal}@${emailDomain}`,
    phoneNumber: `+91 ${Math.floor(7000000000 + Math.random() * 2999999999)}`,
    companyName: company,
    website: `https://www.${company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
    message: pick(MESSAGES),
    serviceInterest: pick(SERVICES),
    budgetRange: pick(["under_10k", "10k_50k", "10k_50k", "50k_100k", "50k_100k", "100k_500k", "above_500k", "undisclosed"]),
    source: pick(["website", "website", "referral", "linkedin", "social_media", "email_campaign", "phone", "event", "partner"]),
    referrer: pick(REFERRERS),
    landingPage: pick(LANDING_PAGES),
    utmSource,
    utmMedium,
    utmCampaign,
    utmContent: utmCampaign ? pick(["banner_v1", "sidebar_cta", "hero_button", "popup_exit", ""]) : "",
    utmTerm: utmCampaign ? pick(["web development agency", "hire react developer", "digital marketing services", ""]) : "",
    status,
    priority: pick(["low", "medium", "medium", "high", "urgent"]),
    device: pick(DEVICES),
    browser: pick(BROWSERS),
    os: pick(OS_LIST),
    ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    country: pick(["India", "India", "India", "United States", "United Kingdom", "UAE", "Singapore"]),
    city: pick(["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Pune", "New York", "London", "Dubai"]),
    tags: pickN(TAGS_POOL, Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0),
    internalNotes: Math.random() > 0.6 ? pick([
      "Spoke with founder directly. Very interested but waiting for board approval.",
      "Decision maker is the CTO. Follow up after 15th.",
      "Had a demo call — good fit. Send proposal by EOW.",
      "Warm lead from referral. High intent.",
      "Budget confirmed. Waiting for procurement.",
    ]) : "",
    softDeleted: false,
    createdAt,
    updatedAt: createdAt,
  };

  // Status-specific fields
  if (status === "converted") {
    const daysAfter = Math.floor(Math.random() * 20) + 3;
    lead.convertedAt = new Date(createdAt.getTime() + daysAfter * 86400000);
    lead.conversionValue = pick([25000, 50000, 75000, 120000, 200000, 350000, 500000, 800000]);
    lead.conversionNotes = pick([
      "Signed 6-month retainer. Kick-off scheduled.",
      "Project contract signed. Advance payment received.",
      "Closed after second proposal. Great client.",
    ]);
  }

  if (status === "lost") {
    const daysAfter = Math.floor(Math.random() * 15) + 2;
    lead.lostAt = new Date(createdAt.getTime() + daysAfter * 86400000);
    lead.lostReason = pick(LOST_REASONS);
    lead.lostNotes = "Attempted follow-up twice with no positive outcome.";
  }

  if (status === "valid" || status === "converted") {
    lead.validationNotes = "Verified — genuine business inquiry, good budget fit.";
    lead.validatedAt = new Date(createdAt.getTime() + 86400000);
  }

  if (status === "invalid") {
    lead.validationNotes = pick([
      "Spam submission — invalid contact details.",
      "Student inquiry, not a business lead.",
      "Duplicate submission.",
      "Outside our service scope.",
    ]);
    lead.validatedAt = new Date(createdAt.getTime() + 3600000);
  }

  return lead;
}

// ── Activity factory ───────────────────────────────────────────────────────────
function buildActivities(lead) {
  const activities = [];
  const base = lead.createdAt.getTime();

  activities.push({
    leadId: lead._id,
    activityType: "created",
    activityMessage: `Lead created from ${lead.source.replace(/_/g, " ")}`,
    metadata: { source: lead.source },
    createdAt: lead.createdAt,
  });

  if (["valid", "converted"].includes(lead.status)) {
    activities.push({
      leadId: lead._id,
      activityType: "validated",
      activityMessage: "Lead marked as valid after review",
      metadata: { notes: lead.validationNotes },
      createdAt: new Date(base + 86400000),
    });
  }

  if (lead.status === "invalid") {
    activities.push({
      leadId: lead._id,
      activityType: "invalidated",
      activityMessage: "Lead marked as invalid",
      metadata: { notes: lead.validationNotes },
      createdAt: new Date(base + 3600000),
    });
  }

  if (lead.status === "converted") {
    activities.push({
      leadId: lead._id,
      activityType: "status_changed",
      activityMessage: "Lead status changed to converted",
      metadata: { from: "valid", to: "converted" },
      createdAt: lead.convertedAt,
    });
    activities.push({
      leadId: lead._id,
      activityType: "converted",
      activityMessage: `Lead converted with value ₹${lead.conversionValue?.toLocaleString()}`,
      metadata: { conversionValue: lead.conversionValue, notes: lead.conversionNotes },
      createdAt: new Date(lead.convertedAt.getTime() + 60000),
    });
  }

  if (lead.status === "lost") {
    activities.push({
      leadId: lead._id,
      activityType: "lost",
      activityMessage: `Lead marked as lost — ${lead.lostReason}`,
      metadata: { reason: lead.lostReason },
      createdAt: lead.lostAt,
    });
  }

  if (lead.status === "archived") {
    activities.push({
      leadId: lead._id,
      activityType: "archived",
      activityMessage: "Lead archived",
      metadata: {},
      createdAt: new Date(base + 7 * 86400000),
    });
  }

  if (Math.random() > 0.6) {
    activities.push({
      leadId: lead._id,
      activityType: "note_added",
      activityMessage: "Internal note added",
      metadata: { note: lead.internalNotes || "Follow up scheduled." },
      createdAt: new Date(base + Math.random() * 3 * 86400000),
    });
  }

  return activities;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ MongoDB connected");

  // Wipe existing seed data (optional — remove these two lines to append instead)
  await Lead.deleteMany({});
  await LeadActivity.deleteMany({});
  console.log("🗑️  Cleared existing leads and activities");

  const leadDocs = [];
  for (let i = 0; i < 40; i++) {
    leadDocs.push(buildLead(i));
  }

  const inserted = await Lead.insertMany(leadDocs, { timestamps: false });
  console.log(`✅ Inserted ${inserted.length} leads`);

  const allActivities = inserted.flatMap((lead) => buildActivities(lead));
  await LeadActivity.insertMany(allActivities);
  console.log(`✅ Inserted ${allActivities.length} activity records`);

  // Summary
  const byStatus = {};
  inserted.forEach((l) => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });
  console.log("\n📊 Status breakdown:", byStatus);

  await mongoose.disconnect();
  console.log("\n✅ Seed complete. Disconnected.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
