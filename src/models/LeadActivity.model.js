const mongoose = require("mongoose");

const ACTIVITY_TYPES = [
  "created",
  "status_changed",
  "assigned",
  "unassigned",
  "validated",
  "invalidated",
  "converted",
  "lost",
  "archived",
  "restored",
  "note_added",
  "field_updated",
  "priority_changed",
  "tag_added",
  "tag_removed",
  "deleted",
];

const leadActivitySchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
    },
    activityMessage: {
      type: String,
      required: true,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

leadActivitySchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model("LeadActivity", leadActivitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
