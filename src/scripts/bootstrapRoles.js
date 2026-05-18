/**
 * Bootstraps predefined custom roles on every server start.
 * Safe to run repeatedly — upserts by slug, never overwrites an existing role
 * so any admin customisations made through the panel are preserved.
 *
 * To add a new predefined role: add one entry to PREDEFINED_ROLES below and
 * restart the server. That is the only change required.
 */

const mongoose = require("mongoose");
const Role = require("../models/Role.model");
const { logger } = require("../utils/logger");

// ── Role definitions ───────────────────────────────────────────────────────────
// slug must match: name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
const PREDEFINED_ROLES = [
  {
    name: "Content Writer",
    slug: "content_writer",
    description: "Writes and publishes blog posts. Can upload media for blog use.",
    permissions: ["blogs", "media"],
    color: "#10b981",
  },
  {
    name: "SEO & Content Lead",
    slug: "seo_content_lead",
    description: "Manages content strategy across blogs and media, and tracks dashboard metrics.",
    permissions: ["dashboard", "blogs", "media"],
    color: "#06b6d4",
  },
  {
    name: "Social Media Manager",
    slug: "social_media_manager",
    description: "Manages the media library and brand / social settings.",
    permissions: ["media", "settings"],
    color: "#ec4899",
  },
  {
    name: "Marketing Manager",
    slug: "marketing_manager",
    description: "Full marketing access — content, media, brand settings, and testimonials.",
    permissions: ["dashboard", "blogs", "media", "settings", "testimonials"],
    color: "#f59e0b",
  },
  {
    name: "Sales Executive",
    slug: "sales_executive",
    description: "Handles assigned leads — updates status, adds notes, and moves leads through the pipeline.",
    permissions: ["dashboard", "crm"],
    color: "#3b82f6",
  },
  {
    name: "Sales Manager",
    slug: "sales_manager",
    description: "Manages the sales pipeline — assigns leads to executives, tracks conversions, and oversees the team.",
    permissions: ["dashboard", "crm", "users"],
    color: "#6366f1",
  },
  {
    name: "HR Executive",
    slug: "hr_executive",
    description: "Reviews applications, schedules interviews, and manages the hiring pipeline.",
    permissions: ["dashboard", "careers"],
    color: "#8b5cf6",
  },
  {
    name: "HR Manager",
    slug: "hr_manager",
    description: "Full HR access — job management, applicants, interviews, and user administration.",
    permissions: ["dashboard", "careers", "users"],
    color: "#7c3aed",
  },
  {
    name: "Media Manager",
    slug: "media_manager",
    description: "Manages all media assets — uploads, organises, and maintains the media library.",
    permissions: ["dashboard", "media"],
    color: "#14b8a6",
  },
  {
    name: "Customer Success",
    slug: "customer_success",
    description: "Manages converted client relationships — tracks testimonials and follows up on CRM leads.",
    permissions: ["dashboard", "crm", "testimonials"],
    color: "#84cc16",
  },
];

// ── Bootstrap function ─────────────────────────────────────────────────────────
async function bootstrapRoles() {
  let created = 0;

  for (const def of PREDEFINED_ROLES) {
    const exists = await Role.findOne({ slug: def.slug });
    if (!exists) {
      await Role.create({ ...def, isSystem: false });
      created++;
    }
    // If role exists we leave it untouched — admin may have adjusted permissions/color
  }

  if (created > 0) {
    logger.info(`🛡️  Role bootstrap: ${created} predefined role(s) created.`);
  }
}

module.exports = bootstrapRoles;

// Allows running directly: node src/scripts/bootstrapRoles.js
if (require.main === module) {
  require("dotenv").config();
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("✅ MongoDB connected");
      await bootstrapRoles();
      console.log("✅ Role bootstrap complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Bootstrap failed:", err);
      process.exit(1);
    });
}
