const { z } = require("zod");

// Reusable: accepts a valid URL or an empty string
const urlOrEmpty = z
  .string()
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), {
    message: "Must be a valid URL or empty",
  })
  .optional()
  .default("");

const socialLinksSchema = z
  .object({
    linkedin: urlOrEmpty,
    twitter: urlOrEmpty,
    instagram: urlOrEmpty,
    website: urlOrEmpty,
  })
  .optional()
  .default({});

// ── Create ────────────────────────────────────────────────────────────────────
exports.createTestimonialSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .min(1, "Full name is required")
      .max(100, "Full name cannot exceed 100 characters"),

    designation: z.string().max(150).optional().default(""),
    companyName: z.string().max(150).optional().default(""),
    companyWebsite: urlOrEmpty,

    testimonialText: z
      .string({ required_error: "Testimonial text is required" })
      .min(10, "Testimonial must be at least 10 characters")
      .max(2000, "Testimonial cannot exceed 2000 characters"),

    shortSummary: z.string().max(300).optional().default(""),

    rating: z
      .number({ required_error: "Rating is required", invalid_type_error: "Rating must be a number" })
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5"),

    profileImage: z.string().optional().default(""),
    companyLogo: z.string().optional().default(""),

    testimonialType: z.enum(["text", "video", "image"]).optional().default("text"),
    videoUrl: urlOrEmpty,
    videoThumbnail: z.string().optional().default(""),

    location: z.string().max(200).optional().default(""),
    email: z
      .string()
      .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "Must be a valid email or empty",
      })
      .optional()
      .default(""),
    phoneNumber: z.string().optional().default(""),

    socialLinks: socialLinksSchema,

    isFeatured: z.boolean().optional().default(false),
    isPublished: z.boolean().optional().default(false),
    isPinned: z.boolean().optional().default(false),
    displayOrder: z.number().optional().default(0),
    showOnHomepage: z.boolean().optional().default(false),
    showOnAboutPage: z.boolean().optional().default(false),

    source: z.string().optional().default(""),
    collectedBy: z.string().optional().default(""),
    verifiedStatus: z.boolean().optional().default(false),

    slug: z.string().optional(),
    metaTitle: z.string().optional().default(""),
    metaDescription: z.string().optional().default(""),

    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().default(""),
    language: z.string().optional().default("en"),
  }),
});

// ── Update (all fields optional) ──────────────────────────────────────────────
exports.updateTestimonialSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).max(100).optional(),
    designation: z.string().max(150).optional(),
    companyName: z.string().max(150).optional(),
    companyWebsite: urlOrEmpty,

    testimonialText: z.string().min(10).max(2000).optional(),
    shortSummary: z.string().max(300).optional(),

    rating: z
      .number({ invalid_type_error: "Rating must be a number" })
      .min(1, "Rating must be at least 1")
      .max(5, "Rating cannot exceed 5")
      .optional(),

    profileImage: z.string().optional(),
    companyLogo: z.string().optional(),

    testimonialType: z.enum(["text", "video", "image"]).optional(),
    videoUrl: urlOrEmpty,
    videoThumbnail: z.string().optional(),

    location: z.string().max(200).optional(),
    email: z
      .string()
      .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "Must be a valid email or empty",
      })
      .optional(),
    phoneNumber: z.string().optional(),

    socialLinks: socialLinksSchema,

    isFeatured: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    displayOrder: z.number().optional(),
    showOnHomepage: z.boolean().optional(),
    showOnAboutPage: z.boolean().optional(),

    source: z.string().optional(),
    collectedBy: z.string().optional(),
    verifiedStatus: z.boolean().optional(),

    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),

    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    language: z.string().optional(),
  }),
});

// ── Bulk actions ───────────────────────────────────────────────────────────────
exports.bulkActionSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string(), { required_error: "IDs are required" })
      .min(1, "At least one ID is required"),
  }),
});

exports.bulkPublishSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "At least one ID is required"),
    isPublished: z.boolean({ required_error: "isPublished is required" }),
  }),
});

exports.bulkFeatureSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "At least one ID is required"),
    isFeatured: z.boolean({ required_error: "isFeatured is required" }),
  }),
});
