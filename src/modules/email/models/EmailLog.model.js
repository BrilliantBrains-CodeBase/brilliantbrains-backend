const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    eventType: { type: String, index: true },
    smtpProviderId: { type: mongoose.Schema.Types.ObjectId, ref: "SmtpProvider", default: null },
    providerName: { type: String, default: "" },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "EmailTemplate", default: null },
    from: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    to: [{ type: String }],
    cc: [{ type: String }],
    bcc: [{ type: String }],
    subject: { type: String, default: "" },
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "retrying"],
      default: "queued",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    errorMessage: { type: String, default: "" },
    smtpResponse: { type: String, default: "" },
    messageId: { type: String, default: "" },
    bullJobId: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ "to": 1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);
