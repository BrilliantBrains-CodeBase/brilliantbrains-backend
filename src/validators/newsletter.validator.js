const { z } = require("zod");

const SOURCES = [
  "website", "referral", "social_media", "email_campaign",
  "phone", "event", "partner", "linkedin", "import", "other",
];
const STATUSES = ["subscribed", "unsubscribed", "bounced", "blocked", "pending"];
const UNSUBSCRIBE_REASONS = [
  "too_many_emails", "not_relevant", "spam", "no_longer_interested", "other",
];

const phoneOrEmpty = z
  .string()
  .refine((v) => v === "" || /^[+\d\s\-().]{6,20}$/.test(v), { message: "Invalid phone number" })
  .optional()
  .default("");

// ── Public: Subscribe ─────────────────────────────────────────────────────────
exports.subscribeSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email address")
      .max(254, "Email is too long"),

    fullName:    z.string().max(100).trim().optional().default(""),
    phoneNumber: phoneOrEmpty,

    source:      z.enum(SOURCES).optional().default("website"),
    referrer:    z.string().max(500).optional().default(""),
    landingPage: z.string().max(500).optional().default(""),
    utmSource:   z.string().max(200).optional().default(""),
    utmMedium:   z.string().max(200).optional().default(""),
    utmCampaign: z.string().max(200).optional().default(""),
    utmContent:  z.string().max(200).optional().default(""),
    utmTerm:     z.string().max(200).optional().default(""),
  }),
});

// ── Public: Process unsubscribe ───────────────────────────────────────────────
exports.processUnsubscribeSchema = z.object({
  body: z.object({
    reason:   z.enum(UNSUBSCRIBE_REASONS, { required_error: "Please select a reason" }),
    feedback: z.string().max(1000).trim().optional().default(""),
  }),
});

// ── Admin: Update subscriber ──────────────────────────────────────────────────
exports.updateSubscriberSchema = z.object({
  body: z.object({
    fullName:    z.string().max(100).trim().optional(),
    phoneNumber: phoneOrEmpty,
    status:      z.enum(STATUSES).optional(),
    tags:        z.array(z.string().trim().max(50)).max(20).optional(),
    notes:       z.string().max(2000).optional(),
  }),
});

// ── Admin: Bulk action ────────────────────────────────────────────────────────
exports.bulkActionSchema = z.object({
  body: z.object({
    ids: z.array(z.string(), { required_error: "IDs are required" }).min(1, "At least one subscriber ID is required"),
    action: z.enum(["delete", "block", "resubscribe", "unsubscribe"], {
      required_error: "Action is required",
    }),
  }),
});

// ── Admin: Update settings ────────────────────────────────────────────────────
exports.updateSettingsSchema = z.object({
  body: z.object({
    senderName:              z.string().max(100).trim().optional(),
    senderEmail:             z.string().email().max(254).optional().or(z.literal("")),
    replyToEmail:            z.string().email().max(254).optional().or(z.literal("")),
    footerText:              z.string().max(500).trim().optional(),
    welcomeEmailEnabled:     z.boolean().optional(),
    unsubscribeEmailEnabled: z.boolean().optional(),
    doubleOptIn:             z.boolean().optional(),
  }),
});
