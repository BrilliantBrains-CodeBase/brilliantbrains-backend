const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },

    password: {
      type: String,
      required: true,
      select: false // 🔐 never return password by default
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

/**
 * 🔒 Enforce ONLY ONE SUPER ADMIN at DB level
 */
schema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: { role: ROLES.SUPER_ADMIN }
  }
);

module.exports = mongoose.model("User", schema);
