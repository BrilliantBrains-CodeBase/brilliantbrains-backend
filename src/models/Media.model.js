const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true,
      unique: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Media", schema);
