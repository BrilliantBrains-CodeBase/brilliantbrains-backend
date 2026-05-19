const mongoose = require("mongoose");

// Singleton document — exactly one record exists per system.
// Bootstrapped on server start; admin can update via PATCH /api/newsletter/settings.
const schema = new mongoose.Schema(
  {
    _singleton: { type: Boolean, default: true, unique: true },

    senderName:  { type: String, trim: true, default: "Brilliant Brains" },
    senderEmail: { type: String, trim: true, lowercase: true, default: "" },
    replyToEmail:{ type: String, trim: true, lowercase: true, default: "" },

    footerText: {
      type: String,
      trim: true,
      default: "You are receiving this because you subscribed at brilliantbrains.ai.",
    },

    // Feature flags
    welcomeEmailEnabled:     { type: Boolean, default: true },
    unsubscribeEmailEnabled: { type: Boolean, default: true },
    doubleOptIn:             { type: Boolean, default: false },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NewsletterSettings", schema);
