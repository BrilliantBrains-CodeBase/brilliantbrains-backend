const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const emailRoutingRuleSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      // e.g. 'career_application', 'lead_notification', 'otp_email'
    },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    smtpProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SmtpProvider",
      default: null,
      // null = use system default provider
    },
    senderEmailOverride: { type: String, lowercase: true, trim: true, default: "" },
    senderNameOverride: { type: String, trim: true, default: "" },
    recipients: [recipientSchema],
    cc: [{ type: String, lowercase: true, trim: true }],
    bcc: [{ type: String, lowercase: true, trim: true }],
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailRoutingRule", emailRoutingRuleSchema);
