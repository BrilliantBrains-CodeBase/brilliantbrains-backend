const { z } = require("zod");
const { PROVIDERS, ENVIRONMENTS, PLACEMENTS } = require("../models/Integration.model");

// ── Per-provider config validators ────────────────────────────────────────────
// These run inside superRefine so errors surface as config.fieldName issues
const PROVIDER_CONFIG_SCHEMAS = {
  google_analytics_4: z.object({
    measurementId: z
      .string({ required_error: "Measurement ID is required" })
      .regex(/^G-[A-Z0-9]+$/, "Must be in G-XXXXXXXXXX format"),
  }),
  google_tag_manager: z.object({
    containerId: z
      .string({ required_error: "Container ID is required" })
      .regex(/^GTM-[A-Z0-9]+$/, "Must be in GTM-XXXXXXX format"),
  }),
  microsoft_clarity: z.object({
    projectId: z
      .string({ required_error: "Project ID is required" })
      .min(1)
      .max(50),
  }),
  hotjar: z.object({
    siteId: z
      .string({ required_error: "Site ID is required" })
      .regex(/^\d+$/, "Site ID must be numeric"),
    version: z.number().optional().default(6),
  }),
  meta_pixel: z.object({
    pixelId: z
      .string({ required_error: "Pixel ID is required" })
      .regex(/^\d{10,20}$/, "Must be 10–20 digits"),
  }),
  tiktok_pixel: z.object({
    pixelId: z.string({ required_error: "Pixel ID is required" }).min(1).max(100),
  }),
  linkedin_insight: z.object({
    partnerId: z
      .string({ required_error: "Partner ID is required" })
      .regex(/^\d+$/, "Partner ID must be numeric"),
  }),
  twitter_pixel: z.object({
    pixelId: z.string({ required_error: "Pixel ID is required" }).min(1).max(50),
  }),
  pinterest_pixel: z.object({
    tagId: z.string({ required_error: "Tag ID is required" }).min(1).max(50),
  }),
  google_ads: z.object({
    conversionId: z
      .string({ required_error: "Conversion ID is required" })
      .regex(/^AW-\d+$/, "Must be in AW-XXXXXXXXXX format"),
    conversionLabel: z.string().optional().default(""),
  }),
  google_search_console: z.object({
    verificationContent: z
      .string({ required_error: "Verification content is required" })
      .min(1)
      .max(500),
  }),
  bing_webmaster: z.object({
    verificationContent: z
      .string({ required_error: "Verification content is required" })
      .min(1)
      .max(500),
  }),
  meta_verification: z.object({
    verificationContent: z
      .string({ required_error: "Verification content is required" })
      .min(1)
      .max(500),
  }),
  pinterest_verification: z.object({
    verificationContent: z
      .string({ required_error: "Verification content is required" })
      .min(1)
      .max(500),
  }),
  custom_script: null, // scriptContent field is validated by superRefine below
};

// ── Shared config + scriptContent refinement ──────────────────────────────────
function applyProviderRefine(schema) {
  return schema.superRefine((data, ctx) => {
    const configSchema = PROVIDER_CONFIG_SCHEMAS[data.provider];

    if (configSchema) {
      const result = configSchema.safeParse(data.config || {});
      if (!result.success) {
        result.error.issues.forEach((issue) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: ["config", ...issue.path],
          });
        });
      }
    }

    if (data.provider === "custom_script") {
      if (!data.scriptContent || !data.scriptContent.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Script content is required for custom scripts",
          path: ["scriptContent"],
        });
      }
    }
  });
}

// ── Create schema ─────────────────────────────────────────────────────────────
exports.createIntegrationSchema = z.object({
  body: applyProviderRefine(
    z.object({
      provider:        z.enum(PROVIDERS, { required_error: "Provider is required" }),
      integrationName: z.string().max(100).optional().default(""),
      config:          z.record(z.string(), z.unknown()).optional().default({}),
      scriptContent:   z.string().max(100000).optional().default(""),
      placement:       z.enum(PLACEMENTS).optional().default("head"),
      environment:     z.enum(ENVIRONMENTS).optional().default("all"),
      isActive:        z.boolean().optional().default(true),
      isDraft:         z.boolean().optional().default(false),
      tags:            z.array(z.string().trim().max(50)).optional().default([]),
      notes:           z.string().max(2000).optional().default(""),
    }),
  ),
});

// ── Update schema (all fields optional; same provider-config validation) ───────
exports.updateIntegrationSchema = z.object({
  body: z
    .object({
      provider:        z.enum(PROVIDERS).optional(),
      integrationName: z.string().max(100).optional(),
      config:          z.record(z.string(), z.unknown()).optional(),
      scriptContent:   z.string().max(100000).optional(),
      placement:       z.enum(PLACEMENTS).optional(),
      environment:     z.enum(ENVIRONMENTS).optional(),
      isActive:        z.boolean().optional(),
      isDraft:         z.boolean().optional(),
      tags:            z.array(z.string().trim().max(50)).optional(),
      notes:           z.string().max(2000).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.provider) return; // Provider not being changed — skip config validation
      const configSchema = PROVIDER_CONFIG_SCHEMAS[data.provider];
      if (configSchema && data.config !== undefined) {
        const result = configSchema.safeParse(data.config);
        if (!result.success) {
          result.error.issues.forEach((issue) => {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: issue.message,
              path: ["config", ...issue.path],
            });
          });
        }
      }
      if (data.provider === "custom_script" && data.scriptContent !== undefined && !data.scriptContent.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Script content cannot be empty for custom scripts",
          path: ["scriptContent"],
        });
      }
    }),
});

// ── Toggle active schema ──────────────────────────────────────────────────────
exports.toggleActiveSchema = z.object({
  body: z.object({
    isActive: z.boolean({ required_error: "isActive is required" }),
  }),
});

// ── Update settings schema ────────────────────────────────────────────────────
exports.updateSettingsSchema = z.object({
  body: z.object({
    isGloballyEnabled:     z.boolean().optional(),
    publicEndpointEnabled: z.boolean().optional(),
  }),
});
