const User                = require("../models/User.model");
const Lead                = require("../models/Lead.model");
const LeadActivity        = require("../models/LeadActivity.model");
const Blog                = require("../models/Blog.model");
const Job                 = require("../models/Job.model");
const JobApplication      = require("../models/JobApplication.model");
const Testimonial         = require("../models/Testimonial.model");
const NewsletterSubscriber = require("../models/NewsletterSubscriber.model");
const Media               = require("../models/Media.model");
const cache               = require("../utils/dashboardCache");
const widgetRegistry      = require("./dashboard.widgetRegistry");
const { logger }          = require("../utils/logger");

const CACHE_KEY = "dashboard:metrics";

// ─── Date helpers ─────────────────────────────────────────────────────────────

const since = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
};

const dailyTrendPipeline = (dateField, matchExtra = {}) => [
  { $match: { [dateField]: { $gte: since(30) }, ...matchExtra } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
  { $project: { _id: 0, date: "$_id", count: 1 } },
];

// ─── Module metrics ───────────────────────────────────────────────────────────

async function getOverviewMetrics() {
  const [totalUsers, totalLeads, activeJobs, totalApplications, totalSubscribers, totalTestimonials, totalBlogs, totalMedia] =
    await Promise.all([
      User.countDocuments({}),
      Lead.countDocuments({ softDeleted: false }),
      Job.countDocuments({ status: "published" }),
      JobApplication.countDocuments({}),
      NewsletterSubscriber.countDocuments({ softDeleted: false, status: "subscribed" }),
      Testimonial.countDocuments({ softDeleted: false }),
      Blog.countDocuments({}),
      Media.countDocuments({}),
    ]);
  return { totalUsers, totalLeads, activeJobs, totalApplications, totalSubscribers, totalTestimonials, totalBlogs, totalMedia };
}

async function getCRMMetrics() {
  const [statusBreakdown, thisWeek, thisMonth, recentLeads, dailyTrend] = await Promise.all([
    Lead.aggregate([
      { $match: { softDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.countDocuments({ softDeleted: false, createdAt: { $gte: since(7) } }),
    Lead.countDocuments({ softDeleted: false, createdAt: { $gte: since(30) } }),
    Lead.find({ softDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email status source companyName createdAt")
      .lean(),
    Lead.aggregate(dailyTrendPipeline("createdAt", { softDeleted: false })),
  ]);

  const byStatus = Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count]));
  const total = statusBreakdown.reduce((sum, s) => sum + s.count, 0);
  const converted = byStatus.converted || 0;

  return {
    total,
    byStatus,
    thisWeek,
    thisMonth,
    conversionRate: total > 0 ? parseFloat(((converted / total) * 100).toFixed(1)) : 0,
    recentLeads,
    dailyTrend,
  };
}

async function getCareersMetrics() {
  const [jobStats, appStats, newThisWeek, topJobs, applicationTrend] = await Promise.all([
    Job.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    JobApplication.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    JobApplication.countDocuments({ appliedAt: { $gte: since(7) } }),
    Job.find({ status: "published" })
      .sort({ applicationsCount: -1 })
      .limit(5)
      .select("title department applicationsCount shortlistedCount")
      .lean(),
    JobApplication.aggregate(dailyTrendPipeline("appliedAt")),
  ]);

  const jobMap = Object.fromEntries(jobStats.map((j) => [j._id, j.count]));
  const appMap = Object.fromEntries(appStats.map((a) => [a._id, a.count]));
  const totalJobs = jobStats.reduce((sum, j) => sum + j.count, 0);
  const totalApplications = appStats.reduce((sum, a) => sum + a.count, 0);

  return {
    totalJobs,
    activeJobs: jobMap.published || 0,
    draftJobs:  jobMap.draft    || 0,
    closedJobs: jobMap.closed   || 0,
    totalApplications,
    shortlisted: appMap.shortlisted || 0,
    selected:    appMap.selected    || 0,
    rejected:    appMap.rejected    || 0,
    newThisWeek,
    topJobs,
    applicationTrend,
    applicationsByStatus: appStats.map((a) => ({ status: a._id, count: a.count })),
  };
}

async function getBlogMetrics() {
  const [statusBreakdown, thisWeek, topBlogs] = await Promise.all([
    Blog.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Blog.countDocuments({ createdAt: { $gte: since(7) } }),
    Blog.find({ status: "published" })
      .sort({ "stats.views": -1 })
      .limit(5)
      .select("title stats.views stats.likes publishedAt")
      .lean(),
  ]);

  const byStatus = Object.fromEntries(statusBreakdown.map((b) => [b._id, b.count]));
  const total = statusBreakdown.reduce((sum, b) => sum + b.count, 0);
  const totalViews = topBlogs.reduce((sum, b) => sum + (b.stats?.views || 0), 0);

  return {
    total,
    published: byStatus.published || 0,
    draft:     byStatus.draft     || 0,
    scheduled: byStatus.scheduled || 0,
    archived:  byStatus.archived  || 0,
    thisWeek,
    totalViews,
    topBlogs,
  };
}

async function getUserMetrics() {
  const [roleBreakdown, activeCount, newThisWeek, newThisMonth] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: since(7) } }),
    User.countDocuments({ createdAt: { $gte: since(30) } }),
  ]);

  const byRole = Object.fromEntries(roleBreakdown.map((r) => [r._id, r.count]));
  const total = roleBreakdown.reduce((sum, r) => sum + r.count, 0);

  return { total, active: activeCount, inactive: total - activeCount, byRole, newThisWeek, newThisMonth };
}

async function getTestimonialMetrics() {
  const [total, published, featured, avgResult, videoCount, trashCount, ratingDistribution] = await Promise.all([
    Testimonial.countDocuments({ softDeleted: false }),
    Testimonial.countDocuments({ softDeleted: false, isPublished: true }),
    Testimonial.countDocuments({ softDeleted: false, isFeatured: true }),
    Testimonial.aggregate([
      { $match: { softDeleted: false, isPublished: true } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]),
    Testimonial.countDocuments({ softDeleted: false, testimonialType: "video" }),
    Testimonial.countDocuments({ softDeleted: true }),
    Testimonial.aggregate([
      { $match: { softDeleted: false, isPublished: true } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return {
    total,
    published,
    featured,
    videoCount,
    trashCount,
    averageRating: avgResult[0]?.avg ? parseFloat(avgResult[0].avg.toFixed(1)) : 0,
    ratingDistribution: ratingDistribution.map((r) => ({ rating: r._id, count: r.count })),
  };
}

async function getNewsletterMetrics() {
  const [statusBreakdown, newThisWeek, newThisMonth] = await Promise.all([
    NewsletterSubscriber.aggregate([
      { $match: { softDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    NewsletterSubscriber.countDocuments({ softDeleted: false, status: "subscribed", subscribedAt: { $gte: since(7) } }),
    NewsletterSubscriber.countDocuments({ softDeleted: false, status: "subscribed", subscribedAt: { $gte: since(30) } }),
  ]);

  const byStatus = Object.fromEntries(statusBreakdown.map((s) => [s._id, s.count]));
  const total = statusBreakdown.reduce((sum, s) => sum + s.count, 0);

  return {
    total,
    subscribed:   byStatus.subscribed   || 0,
    unsubscribed: byStatus.unsubscribed || 0,
    bounced:      byStatus.bounced      || 0,
    blocked:      byStatus.blocked      || 0,
    newThisWeek,
    newThisMonth,
  };
}

async function getMediaMetrics() {
  const [totalFiles, sizeResult, typeBreakdown] = await Promise.all([
    Media.countDocuments({}),
    Media.aggregate([{ $group: { _id: null, totalSize: { $sum: "$size" } } }]),
    Media.aggregate([
      { $group: { _id: { $arrayElemAt: [{ $split: ["$mimeType", "/"] }, 0] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
  ]);

  return {
    totalFiles,
    totalSizeBytes: sizeResult[0]?.totalSize || 0,
    totalSizeMB: parseFloat(((sizeResult[0]?.totalSize || 0) / (1024 * 1024)).toFixed(2)),
    byType: Object.fromEntries(typeBreakdown.map((t) => [t._id || "other", t.count])),
  };
}

async function getRecentActivities() {
  const [leadActivities, recentApplications] = await Promise.all([
    LeadActivity.find({})
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("leadId", "fullName email")
      .populate("createdBy", "name")
      .lean(),
    JobApplication.find({})
      .sort({ appliedAt: -1 })
      .limit(5)
      .populate("job", "title")
      .select("firstName lastName job appliedAt status")
      .lean(),
  ]);

  const activities = [
    ...leadActivities.map((a) => ({
      module:    "crm",
      action:    a.activityType,
      message:   a.activityMessage || `Lead ${a.activityType.replace(/_/g, " ")}`,
      actor:     a.createdBy?.name || "System",
      subject:   a.leadId?.fullName || "Unknown",
      timestamp: a.createdAt,
    })),
    ...recentApplications.map((a) => ({
      module:    "careers",
      action:    "applied",
      message:   `Applied for ${a.job?.title || "a position"}`,
      actor:     `${a.firstName} ${a.lastName}`,
      subject:   a.job?.title || "Unknown Job",
      timestamp: a.appliedAt,
    })),
  ];

  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);
}

async function getPendingActions() {
  const [unassignedLeads, pendingApplications, unpublishedTestimonials, draftJobs] = await Promise.all([
    Lead.countDocuments({ softDeleted: false, assignedTo: null, status: "new" }),
    JobApplication.countDocuments({ status: "applied" }),
    Testimonial.countDocuments({ softDeleted: false, isPublished: false }),
    Job.countDocuments({ status: "draft" }),
  ]);

  return {
    unassignedLeads,
    pendingApplications,
    unpublishedTestimonials,
    draftJobs,
    total: unassignedLeads + pendingApplications + unpublishedTestimonials + draftJobs,
  };
}

// ─── Widget registration (core platform widgets) ──────────────────────────────
// Each widget is independently resolvable — safe for partial failures.

widgetRegistry.register("totalUsers",         { type: "metric-card", title: "Total Users",         module: "users",        fn: () => User.countDocuments({}) });
widgetRegistry.register("activeLeads",        { type: "metric-card", title: "Active Leads",        module: "crm",          fn: () => Lead.countDocuments({ softDeleted: false }) });
widgetRegistry.register("liveJobs",           { type: "metric-card", title: "Live Jobs",           module: "careers",      fn: () => Job.countDocuments({ status: "published" }) });
widgetRegistry.register("totalApplications",  { type: "metric-card", title: "Total Applications",  module: "careers",      fn: () => JobApplication.countDocuments({}) });
widgetRegistry.register("activeSubscribers",  { type: "metric-card", title: "Active Subscribers",  module: "newsletter",   fn: () => NewsletterSubscriber.countDocuments({ softDeleted: false, status: "subscribed" }) });
widgetRegistry.register("totalTestimonials",  { type: "metric-card", title: "Total Testimonials",  module: "testimonials", fn: () => Testimonial.countDocuments({ softDeleted: false }) });
widgetRegistry.register("publishedBlogs",     { type: "metric-card", title: "Published Blogs",     module: "blogs",        fn: () => Blog.countDocuments({ status: "published" }) });
widgetRegistry.register("totalMedia",         { type: "metric-card", title: "Media Files",         module: "media",        fn: () => Media.countDocuments({}) });

// ─── Main entry point ─────────────────────────────────────────────────────────

async function getDashboardMetrics() {
  const cached = cache.get(CACHE_KEY);
  if (cached) {
    logger.info("[Dashboard] Serving cached metrics");
    return cached;
  }

  const start = Date.now();
  logger.info("[Dashboard] Fetching fresh metrics...");

  const [overview, crm, careers, blogs, users, testimonials, newsletter, media, activities, pendingActions, widgets] =
    await Promise.all([
      getOverviewMetrics(),
      getCRMMetrics(),
      getCareersMetrics(),
      getBlogMetrics(),
      getUserMetrics(),
      getTestimonialMetrics(),
      getNewsletterMetrics(),
      getMediaMetrics(),
      getRecentActivities(),
      getPendingActions(),
      widgetRegistry.resolveAll(),
    ]);

  const metrics = {
    overview,
    crm,
    careers,
    blogs,
    users,
    testimonials,
    newsletter,
    media,
    activities,
    pendingActions,
    widgets,
    systemHealth: {
      status:        "operational",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp:     new Date().toISOString(),
    },
  };

  cache.set(CACHE_KEY, metrics);
  logger.info(`[Dashboard] Metrics fetched in ${Date.now() - start}ms — cached for 5 min`);

  return metrics;
}

/** Call this whenever a module mutates data that affects the dashboard */
function invalidateDashboardCache() {
  cache.invalidate(CACHE_KEY);
}

module.exports = { getDashboardMetrics, invalidateDashboardCache };
