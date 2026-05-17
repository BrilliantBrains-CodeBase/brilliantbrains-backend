const mongoose = require("mongoose");

const smtpProviderSchema = new mongoose.Schema(
  {
    providerName: { type: String, required: true, trim: true },
    smtpHost: { type: String, required: true, trim: true },
    smtpPort: { type: Number, required: true },
    smtpUsername: { type: String, required: true, trim: true },
    smtpPassword: { type: String, required: true, select: false }, // stored encrypted
    encryption: { type: String, enum: ["TLS", "SSL", "NONE"], default: "TLS" },
    senderName: { type: String, required: true, trim: true },
    senderEmail: { type: String, required: true, lowercase: true, trim: true },
    replyToEmail: { type: String, lowercase: true, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastTestedAt: { type: Date, default: null },
    lastTestStatus: {
      type: String,
      enum: ["success", "failed", "untested"],
      default: "untested",
    },
    lastTestError: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

smtpProviderSchema.index(
  { isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

module.exports = mongoose.model("SmtpProvider", smtpProviderSchema);
