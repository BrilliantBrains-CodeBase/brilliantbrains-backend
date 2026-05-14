const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    featuredImage: {
      type: String,
      default: "",
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    status: {
      type: String,
      enum: ["draft", "published", "scheduled", "archived"],
      default: "draft",
    },
    publishedAt: Date,
    scheduledAt: Date,
    readTime: {
      type: Number,
      default: 0,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
      twitterCard: {
        type: String,
        default: "summary_large_image",
      },
      canonicalUrl: String,
    },
    stats: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    isFeatured: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    revision: { type: Number, default: 1 },
  },
  { timestamps: true }
);

blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ "stats.views": -1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ title: "text", summary: "text" });

module.exports = mongoose.model("Blog", blogSchema);
