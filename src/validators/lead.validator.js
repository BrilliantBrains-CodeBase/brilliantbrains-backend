const { z } = require("zod");

const urlOrEmpty = z
  .string()
  .refine((v) => v === "" || /^https?:\/\/.+/.test(v), {
    message: "Must be a valid URL or empty",
  })
  .optional()
  .default("");

const phoneOrEmpty = z
  .string()
  .refine((v) => v === "" || /^[+\d\s\-().]{6,20}$/.test(v), {
    message: "Must be a valid phone number or empty",
  })
  .optional()
  .default("");

const emailOrEmpty = z
  .string()
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Must be a valid email or empty",
  })
  .optional()
  .default("");

const LEAD_SOURCES = ["website", "referral", "social_media", "email_campaign", "phone", "event", "partner", "linkedin", "other"];
const LEAD_STATUSES = ["new", "valid", "invalid", "converted", "lost", "archived"];
const LEAD_PRIORITIES = ["low", "medium", "high", "urgent"];
const BUDGET_RANGES = ["under_10k", "10k_50k", "50k_100k", "100k_500k", "above_500k", "undisclosed"];

// ── Public: Website form submission ───────────────────────────────────────────
exports.submitLeadSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .min(1, "Full name is required")
      .max(100, "Full name cannot exceed 100 characters"),

    email: z
      .string()
      .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
        message: "Must be a valid email",
      })
      .optional()
      .default(""),

    phoneNumber: phoneOrEmpty,
    companyName: z.string().max(150).optional().default(""),
    website: urlOrEmpty,

    message: z
      .string()
      .max(5000, "Message cannot exceed 5000 characters")
      .optional()
      .default(""),

    serviceInterest: z.string().max(200).optional().default(""),
    budgetRange: z.enum(BUDGET_RANGES).optional().default("undisclosed"),

    source: z.enum(LEAD_SOURCES).optional().default("website"),
    referrer: z.string().max(500).optional().default(""),
    landingPage: z.string().max(500).optional().default(""),
    utmSource: z.string().max(200).optional().default(""),
    utmMedium: z.string().max(200).optional().default(""),
    utmCampaign: z.string().max(200).optional().default(""),
    utmContent: z.string().max(200).optional().default(""),
    utmTerm: z.string().max(200).optional().default(""),
  }),
});

// ── Admin: Create lead ────────────────────────────────────────────────────────
exports.createLeadSchema = z.object({
  body: z.object({
    fullName: z
      .string({ required_error: "Full name is required" })
      .min(1, "Full name is required")
      .max(100),

    email: emailOrEmpty,
    phoneNumber: phoneOrEmpty,
    companyName: z.string().max(150).optional().default(""),
    website: urlOrEmpty,
    message: z.string().max(5000).optional().default(""),
    serviceInterest: z.string().max(200).optional().default(""),
    budgetRange: z.enum(BUDGET_RANGES).optional().default("undisclosed"),

    source: z.enum(LEAD_SOURCES).optional().default("website"),
    referrer: z.string().max(500).optional().default(""),
    landingPage: z.string().max(500).optional().default(""),
    utmSource: z.string().max(200).optional().default(""),
    utmMedium: z.string().max(200).optional().default(""),
    utmCampaign: z.string().max(200).optional().default(""),
    utmContent: z.string().max(200).optional().default(""),
    utmTerm: z.string().max(200).optional().default(""),

    priority: z.enum(LEAD_PRIORITIES).optional().default("medium"),
    status: z.enum(LEAD_STATUSES).optional().default("new"),
    tags: z.array(z.string().trim()).optional().default([]),
    internalNotes: z.string().max(5000).optional().default(""),
    assignedTo: z.string().optional(),
  }),
});

// ── Admin: Update lead ────────────────────────────────────────────────────────
exports.updateLeadSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).max(100).optional(),
    email: emailOrEmpty,
    phoneNumber: phoneOrEmpty,
    companyName: z.string().max(150).optional(),
    website: urlOrEmpty,
    message: z.string().max(5000).optional(),
    serviceInterest: z.string().max(200).optional(),
    budgetRange: z.enum(BUDGET_RANGES).optional(),

    source: z.enum(LEAD_SOURCES).optional(),
    referrer: z.string().max(500).optional(),
    landingPage: z.string().max(500).optional(),
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    utmContent: z.string().max(200).optional(),
    utmTerm: z.string().max(200).optional(),

    priority: z.enum(LEAD_PRIORITIES).optional(),
    tags: z.array(z.string().trim()).optional(),
    internalNotes: z.string().max(5000).optional(),
  }),
});

// ── Assign lead ───────────────────────────────────────────────────────────────
exports.assignLeadSchema = z.object({
  body: z.object({
    assignedTo: z
      .string({ required_error: "Assignee is required" })
      .min(1, "Assignee is required"),
  }),
});

// ── Validate lead ─────────────────────────────────────────────────────────────
exports.validateLeadSchema = z.object({
  body: z.object({
    isValid: z.boolean({ required_error: "isValid is required" }),
    validationNotes: z.string().max(2000).optional().default(""),
  }),
});

// ── Convert lead ──────────────────────────────────────────────────────────────
exports.convertLeadSchema = z.object({
  body: z.object({
    conversionValue: z.number().min(0).optional().default(0),
    conversionNotes: z.string().max(2000).optional().default(""),
  }),
});

// ── Mark lost ─────────────────────────────────────────────────────────────────
exports.lostLeadSchema = z.object({
  body: z.object({
    lostReason: z
      .string({ required_error: "Lost reason is required" })
      .min(1, "Lost reason is required")
      .max(500),
    lostNotes: z.string().max(2000).optional().default(""),
  }),
});

// ── Add note ──────────────────────────────────────────────────────────────────
exports.addNoteSchema = z.object({
  body: z.object({
    content: z
      .string({ required_error: "Note content is required" })
      .min(1, "Note content is required")
      .max(5000),
  }),
});

// ── Bulk: IDs only ────────────────────────────────────────────────────────────
exports.bulkIdsSchema = z.object({
  body: z.object({
    ids: z
      .array(z.string(), { required_error: "IDs are required" })
      .min(1, "At least one ID is required"),
  }),
});

// ── Bulk: Assign ──────────────────────────────────────────────────────────────
exports.bulkAssignSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "At least one ID is required"),
    assignedTo: z.string().min(1, "Assignee is required"),
  }),
});

// ── Bulk: Status change ───────────────────────────────────────────────────────
exports.bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, "At least one ID is required"),
    status: z.enum(LEAD_STATUSES, { required_error: "Status is required" }),
  }),
});
