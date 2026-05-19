const mongoose = require("mongoose");

// Single source of truth for all permission definitions.
// Add a new entry here when a new module is built — it appears in the
// Roles UI automatically without any other changes.
const PERMISSION_DEFINITIONS = [
  { slug: "dashboard",    label: "Dashboard",       description: "View the main analytics dashboard" },
  { slug: "blogs",        label: "Blogs",            description: "Manage blog posts, categories & tags" },
  { slug: "careers",      label: "Careers",          description: "Manage jobs, applicants & interviews" },
  { slug: "media",        label: "Media Library",    description: "Upload and manage media files" },
  { slug: "users",        label: "User Management",  description: "View and manage system users" },
  { slug: "settings",     label: "Settings",         description: "Configure general & email settings" },
  { slug: "testimonials", label: "Testimonials",     description: "Manage client testimonials" },
  { slug: "crm",          label: "CRM",              description: "Lead management and conversion tracking" },
  { slug: "newsletter",    label: "Newsletter",                description: "Newsletter subscriber management and analytics" },
  { slug: "integrations", label: "Integrations & Marketing",  description: "Manage analytics, tracking pixels, ads, and custom scripts" },
];

const PERMISSION_SLUGS = PERMISSION_DEFINITIONS.map((p) => p.slug);

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Array of permission slugs this role grants
    permissions: {
      type: [String],
      enum: PERMISSION_SLUGS,
      default: [],
    },

    // Color for UI badge (hex or tailwind color name)
    color: {
      type: String,
      default: "#6366f1",
    },

    // System roles (admin, super_admin defaults) cannot be deleted
    isSystem: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Role", schema);
module.exports.PERMISSION_SLUGS = PERMISSION_SLUGS;
module.exports.PERMISSION_DEFINITIONS = PERMISSION_DEFINITIONS;
