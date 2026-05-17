const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // links to EmailRoutingRule.eventType
    },
    subject: { type: String, required: true, trim: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String, default: "" },
    variables: [{ type: String, trim: true }],
    // e.g. ['name', 'otp', 'companyName', 'orderId']
    previewData: { type: mongoose.Schema.Types.Mixed, default: {} },
    // sample variable values for template preview
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
