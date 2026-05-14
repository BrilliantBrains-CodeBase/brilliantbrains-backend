const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    brand: {
      name: { type: String, default: "Brilliant Brains" },
      tagline: { type: String, default: "" },
      logo: { type: String, default: "" }, // URL to media
      favicon: { type: String, default: "" }, // URL to media
      footerText: { type: String, default: "" },
      copyright: { type: String, default: "" },
    },
    socials: [
      {
        platform: { type: String, required: true }, // e.g., "Facebook", "Instagram", "LinkedIn"
        url: { type: String, required: true },
        icon: { type: String }, // Optional icon name/class
        isActive: { type: Boolean, default: true },
      },
    ],
    addresses: [
      {
        label: { type: String, required: true }, // e.g., "India Office", "Dubai HQ"
        addressLine: { type: String, required: true },
        city: { type: String },
        state: { type: String },
        country: { type: String, required: true },
        zipCode: { type: String },
        isPrimary: { type: Boolean, default: false },
        mapUrl: { type: String },
      },
    ],
    contacts: {
      emails: [
        {
          label: { type: String, default: "Support" },
          email: { type: String, required: true },
          isPrimary: { type: Boolean, default: false },
        },
      ],
      phones: [
        {
          label: { type: String, default: "General" },
          number: { type: String, required: true },
          isPrimary: { type: Boolean, default: false },
        },
      ],
    },
    metadata: {
      googleAnalyticsId: { type: String },
      facebookPixelId: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
