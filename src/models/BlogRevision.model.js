const mongoose = require("mongoose");

const blogRevisionSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    title: String,
    content: mongoose.Schema.Types.Mixed,
    summary: String,
    featuredImage: String,
    revision: Number,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BlogRevision", blogRevisionSchema);
