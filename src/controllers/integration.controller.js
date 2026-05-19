const Integration = require("../models/Integration.model");
const IntegrationRevision = require("../models/IntegrationRevision.model");
const IntegrationSettings = require("../models/IntegrationSettings.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { PROVIDER_CATEGORIES } = require("../models/Integration.model");

// ── Helpers ───────────────────────────────────────────────────────────────────
const BASE_FILTER = { softDeleted: false };

function providerDisplayName(provider) {
  const names = {
    google_analytics_4:     "Google Analytics 4",
    google_tag_manager:     "Google Tag Manager",
    microsoft_clarity:      "Microsoft Clarity",
    hotjar:                 "Hotjar",
    meta_pixel:             "Meta Pixel",
    tiktok_pixel:           "TikTok Pixel",
    linkedin_insight:       "LinkedIn Insight Tag",
    twitter_pixel:          "Twitter / X Pixel",
    pinterest_pixel:        "Pinterest Tag",
    google_ads:             "Google Ads",
    google_search_console:  "Google Search Console",
    bing_webmaster:         "Bing Webmaster",
    meta_verification:      "Meta Domain Verification",
    pinterest_verification: "Pinterest Domain Verification",
    custom_script:          "Custom Script",
  };
  return names[provider] || provider;
}

// ── Public endpoint — no auth required ────────────────────────────────────────
// Returns active, published integrations for frontend dynamic injection.
// The frontend also filters by its own environment (Vite MODE), so we return
// all "all" + matching env records and let the client do the final check.
exports.getPublicActive = async (req, res) => {
  const settings = await IntegrationSettings.findOne({ _singleton: true }).lean();

  if (!settings?.isGloballyEnabled || !settings?.publicEndpointEnabled) {
    return res.json(new ApiResponse(200, { integrations: [] }, "Integrations disabled"));
  }

  const integrations = await Integration.find({
    ...BASE_FILTER,
    isActive: true,
    isDraft:  false,
  })
    .select("provider category config scriptContent placement environment integrationName")
    .lean();

  return res.json(new ApiResponse(200, { integrations }, "Active integrations fetched"));
};

// ── Dashboard stats ───────────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  const [total, active, draft, byCategory, recentlyUpdated, duplicates] = await Promise.all([
    Integration.countDocuments(BASE_FILTER),
    Integration.countDocuments({ ...BASE_FILTER, isActive: true, isDraft: false }),
    Integration.countDocuments({ ...BASE_FILTER, isDraft: true }),
    Integration.aggregate([
      { $match: BASE_FILTER },
      {
        $group: {
          _id:    "$category",
          total:  { $sum: 1 },
          active: { $sum: { $cond: [{ $and: ["$isActive", { $not: "$isDraft" }] }, 1, 0] } },
        },
      },
    ]),
    Integration.find(BASE_FILTER)
      .sort({ updatedAt: -1 })
      .limit(6)
      .populate("updatedBy", "name email")
      .lean(),
    // Check for duplicate active providers (same provider enabled more than once)
    Integration.aggregate([
      { $match: { ...BASE_FILTER, isActive: true, isDraft: false } },
      { $group: { _id: "$provider", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]),
  ]);

  // ── Health warnings ─────────────────────────────────────────────────────────
  const warnings = [];

  if (duplicates.length > 0) {
    duplicates.forEach((d) => {
      warnings.push({
        type:     "duplicate_provider",
        severity: "error",
        message:  `Duplicate active integration: ${providerDisplayName(d._id)} is enabled ${d.count} times`,
        provider: d._id,
      });
    });
  }

  // Check if GA4 exists but GTM doesn't (informational)
  const [hasGA4, hasGTM] = await Promise.all([
    Integration.exists({ ...BASE_FILTER, provider: "google_analytics_4", isActive: true }),
    Integration.exists({ ...BASE_FILTER, provider: "google_tag_manager", isActive: true }),
  ]);
  if (hasGA4 && !hasGTM) {
    warnings.push({
      type:     "gtm_recommended",
      severity: "warning",
      message:  "GA4 is active but GTM is not configured. Consider managing GA4 through GTM for better flexibility.",
    });
  }

  const categoryMap = Object.fromEntries(
    byCategory.map((c) => [c._id, { total: c.total, active: c.active }]),
  );

  return res.json(
    new ApiResponse(
      200,
      { total, active, draft, byCategory: categoryMap, recentlyUpdated, warnings },
      "Stats fetched",
    ),
  );
};

// ── List all integrations (paginated) ─────────────────────────────────────────
exports.getAllIntegrations = async (req, res) => {
  const {
    page     = 1,
    limit    = 20,
    search   = "",
    category = "",
    status   = "",
    environment = "",
    sort     = "-updatedAt",
  } = req.query;

  const filter = { ...BASE_FILTER };

  if (category)    filter.category    = category;
  if (environment) filter.environment = environment;

  if (status === "active")    { filter.isActive = true;  filter.isDraft = false; }
  if (status === "inactive")  { filter.isActive = false; }
  if (status === "draft")     { filter.isDraft  = true;  }

  if (search.trim()) {
    const re = new RegExp(search.trim(), "i");
    filter.$or = [
      { integrationName: re },
      { provider: re },
      { notes: re },
    ];
  }

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Integration.countDocuments(filter);

  const integrations = await Integration
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("publishedBy", "name email")
    .lean();

  return res.json(
    new ApiResponse(
      200,
      { integrations, total, page: Number(page), limit: Number(limit) },
      "Integrations fetched",
    ),
  );
};

// ── Get single integration ────────────────────────────────────────────────────
exports.getIntegrationById = async (req, res) => {
  const integration = await Integration.findOne({ _id: req.params.id, ...BASE_FILTER })
    .populate("createdBy", "name email")
    .populate("updatedBy", "name email")
    .populate("publishedBy", "name email")
    .lean();

  if (!integration) throw new ApiError(404, "Integration not found");

  // Include revision history for custom scripts
  let revisions = [];
  if (integration.provider === "custom_script") {
    revisions = await IntegrationRevision.find({ integrationId: integration._id })
      .sort({ version: -1 })
      .populate("publishedBy", "name email")
      .lean();
  }

  return res.json(new ApiResponse(200, { integration, revisions }, "Integration fetched"));
};

// ── Create integration ────────────────────────────────────────────────────────
exports.createIntegration = async (req, res) => {
  const {
    provider,
    integrationName,
    config,
    scriptContent,
    placement,
    environment,
    isActive,
    isDraft,
    tags,
    notes,
  } = req.body;

  // Prevent duplicate active (non-draft) integrations for the same provider
  // Exception: custom_script can have multiple entries
  if (provider !== "custom_script") {
    const existing = await Integration.findOne({
      provider,
      isDraft:     false,
      softDeleted: false,
    });
    if (existing) {
      throw new ApiError(
        409,
        `An active integration for ${providerDisplayName(provider)} already exists. Deactivate or delete it before adding a new one.`,
      );
    }
  }

  const integration = await Integration.create({
    provider,
    integrationName: integrationName || providerDisplayName(provider),
    config:          config || {},
    scriptContent:   provider === "custom_script" ? scriptContent : "",
    placement:       placement || "head",
    environment:     environment || "all",
    isActive:        isActive !== undefined ? isActive : true,
    isDraft:         isDraft  !== undefined ? isDraft  : false,
    tags:            tags  || [],
    notes:           notes || "",
    createdBy:       req.user._id,
    updatedBy:       req.user._id,
    publishedAt:     (!isDraft) ? new Date() : null,
    publishedBy:     (!isDraft) ? req.user._id : null,
  });

  // Create initial revision for custom scripts published immediately
  if (provider === "custom_script" && !isDraft) {
    await IntegrationRevision.create({
      integrationId: integration._id,
      version:       1,
      scriptContent: integration.scriptContent,
      placement:     integration.placement,
      environment:   integration.environment,
      publishedBy:   req.user._id,
    });
  }

  return res.status(201).json(
    new ApiResponse(201, { integration }, "Integration created"),
  );
};

// ── Update integration ────────────────────────────────────────────────────────
exports.updateIntegration = async (req, res) => {
  const integration = await Integration.findOne({ _id: req.params.id, ...BASE_FILTER });
  if (!integration) throw new ApiError(404, "Integration not found");

  const allowedFields = [
    "integrationName", "config", "scriptContent",
    "placement", "environment", "isActive", "isDraft",
    "tags", "notes",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      integration[field] = req.body[field];
    }
  });

  // If provider is being changed, re-derive category via pre-save hook
  if (req.body.provider) {
    integration.provider = req.body.provider;
  }

  integration.updatedBy = req.user._id;
  await integration.save();

  return res.json(new ApiResponse(200, { integration }, "Integration updated"));
};

// ── Toggle active / inactive ──────────────────────────────────────────────────
exports.toggleActive = async (req, res) => {
  const integration = await Integration.findOne({ _id: req.params.id, ...BASE_FILTER });
  if (!integration) throw new ApiError(404, "Integration not found");

  integration.isActive  = req.body.isActive;
  integration.updatedBy = req.user._id;
  await integration.save();

  return res.json(new ApiResponse(200, { integration }, `Integration ${integration.isActive ? "activated" : "deactivated"}`));
};

// ── Publish a draft integration ────────────────────────────────────────────────
exports.publishIntegration = async (req, res) => {
  const integration = await Integration.findOne({ _id: req.params.id, ...BASE_FILTER });
  if (!integration) throw new ApiError(404, "Integration not found");
  if (!integration.isDraft) throw new ApiError(400, "Integration is already published");

  integration.isDraft      = false;
  integration.publishedBy  = req.user._id;
  integration.publishedAt  = new Date();
  integration.version      += 1;
  integration.updatedBy    = req.user._id;
  await integration.save();

  // Create revision snapshot for custom scripts
  if (integration.provider === "custom_script") {
    await IntegrationRevision.create({
      integrationId: integration._id,
      version:       integration.version,
      scriptContent: integration.scriptContent,
      placement:     integration.placement,
      environment:   integration.environment,
      publishedBy:   req.user._id,
      notes:         req.body.notes || "",
    });
  }

  return res.json(new ApiResponse(200, { integration }, "Integration published"));
};

// ── Soft delete ────────────────────────────────────────────────────────────────
exports.softDeleteIntegration = async (req, res) => {
  const integration = await Integration.findOne({ _id: req.params.id, ...BASE_FILTER });
  if (!integration) throw new ApiError(404, "Integration not found");

  integration.softDeleted = true;
  integration.deletedAt   = new Date();
  integration.deletedBy   = req.user._id;
  integration.isActive    = false;
  await integration.save();

  return res.json(new ApiResponse(200, {}, "Integration removed"));
};

// ── Get revision history for a custom script ───────────────────────────────────
exports.getRevisions = async (req, res) => {
  const integration = await Integration.findOne({ _id: req.params.id, ...BASE_FILTER }).lean();
  if (!integration) throw new ApiError(404, "Integration not found");
  if (integration.provider !== "custom_script") {
    throw new ApiError(400, "Revision history is only available for custom scripts");
  }

  const revisions = await IntegrationRevision.find({ integrationId: integration._id })
    .sort({ version: -1 })
    .populate("publishedBy", "name email")
    .lean();

  return res.json(new ApiResponse(200, { revisions }, "Revisions fetched"));
};

// ── Settings (singleton) ───────────────────────────────────────────────────────
exports.getSettings = async (req, res) => {
  const settings = await IntegrationSettings.findOneAndUpdate(
    { _singleton: true },
    { $setOnInsert: { _singleton: true } },
    { upsert: true, new: true },
  ).lean();
  return res.json(new ApiResponse(200, { settings }, "Settings fetched"));
};

exports.updateSettings = async (req, res) => {
  const { isGloballyEnabled, publicEndpointEnabled } = req.body;

  const update = { updatedBy: req.user._id };
  if (isGloballyEnabled     !== undefined) update.isGloballyEnabled     = isGloballyEnabled;
  if (publicEndpointEnabled !== undefined) update.publicEndpointEnabled = publicEndpointEnabled;

  const settings = await IntegrationSettings.findOneAndUpdate(
    { _singleton: true },
    { $set: update },
    { upsert: true, new: true },
  ).lean();

  return res.json(new ApiResponse(200, { settings }, "Settings updated"));
};
