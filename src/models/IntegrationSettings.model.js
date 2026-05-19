/**
 * Singleton settings document for the Integrations & Marketing module.
 * Created automatically on first access via upsert. Only one document exists.
 */

const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    _singleton:            { type: Boolean, default: true, unique: true },
    // Master kill switch — disables ALL dynamic injection when false
    isGloballyEnabled:     { type: Boolean, default: true },
    // Expose the public /api/integrations/active endpoint
    publicEndpointEnabled: { type: Boolean, default: true },
    updatedBy:             { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("IntegrationSettings", schema);
