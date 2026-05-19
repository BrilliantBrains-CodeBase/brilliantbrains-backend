/**
 * Snapshot of a custom_script integration at each publish event.
 * Only created for custom_script provider — other providers don't need revision history
 * because their configs (measurement IDs, pixel IDs) are simple strings with no
 * execution risk. Custom scripts carry executable code, so full history is kept.
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Integration",
      required: true,
      index: true,
    },
    version:       { type: Number, required: true },
    scriptContent: { type: String, required: true },
    placement:     { type: String, enum: ["head", "body", "footer"], default: "head" },
    environment:   { type: String, default: "all" },
    publishedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt:   { type: Date, default: Date.now },
    notes:         { type: String, default: "" },
  },
  { timestamps: true },
);

schema.index({ integrationId: 1, version: -1 });

module.exports = mongoose.model("IntegrationRevision", schema);
