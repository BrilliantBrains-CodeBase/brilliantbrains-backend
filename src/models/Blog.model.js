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
      required: [true, "Summary is required"],
      trim: true,
    },
    content: {
      blocks: [
        {
          id: String,
          type: {
            type: String,
            enum: [
              "paragraph",
              "heading",
              "image",
              "gallery",
              "quote",
              "code",
              "table",
              "checklist",
              "list",
              "divider",
              "embed",
              "video",
              "cta",
              "alert",
              "raw",
              "markdown",
              "button",
              "faq",
              "tabs",
            ],
            required: true,
          },
          data: mongoose.Schema.Types.Mixed,
          config: mongoose.Schema.Types.Mixed,
        },
      ],
    },
    featuredImage: {
      type: String,
      required: [true, "Featured image is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
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
    publishedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
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
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    revision: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
blogSchema.index({ author: 1 });
blogSchema.index({ "stats.views": -1 });
blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Blog", blogSchema);
