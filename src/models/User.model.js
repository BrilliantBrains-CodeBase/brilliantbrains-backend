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

    phoneNumber: {
      type: String,
      trim: true
    },

    profileImage: {
      type: String,
      default: null
    },

    lastLoginAt: {
      type: Date
    },

    lastActiveAt: {
      type: Date,
      default: Date.now
    },

    resetPasswordToken: {
      type: String,
      select: false
    },

    resetPasswordExpires: {
      type: Date,
      select: false
    },

    // Custom role reference — set for non-admin users who need dashboard access
    customRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      default: null,
    }
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

module.exports = mongoose.model("User", schema);
