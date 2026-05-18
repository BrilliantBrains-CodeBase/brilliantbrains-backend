const mongoose = require("mongoose");

const PERMISSION_SLUGS = [
  "dashboard",
  "blogs",
  "careers",
  "media",
  "users",
  "settings",
  "testimonials",
  "crm",
];

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
