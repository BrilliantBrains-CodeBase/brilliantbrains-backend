const Lead = require("../models/Lead.model");
const LeadActivity = require("../models/LeadActivity.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { sendMail } = require("../modules/email/services/emailService");

// ── Internal helpers ───────────────────────────────────────────────────────────

/**
 * Returns a Mongoose filter that restricts leads visible to the caller.
 * super_admin + admin  → all non-deleted leads
 * custom role ("crm")  → only leads assigned to them
 */
function getAccessFilter(user, extra = {}) {
  const base = { softDeleted: false, ...extra };
  if (user.role === "super_admin" || user.role === "admin") return base;
  return { ...base, assignedTo: user._id };
}

async function logActivity(leadId, activityType, activityMessage, userId, metadata = {}) {
  await LeadActivity.create({ leadId, activityType, activityMessage, metadata, createdBy: userId });
}

function extractDeviceInfo(req) {
  const ua = req.headers["user-agent"] || "";
  const ip = req.ip || req.socket?.remoteAddress || "";
  let device = "desktop";
  if (/mobile/i.test(ua)) device = "mobile";
  else if (/tablet|ipad/i.test(ua)) device = "tablet";

  let os = "";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/ios|iphone|ipad/i.test(ua)) os = "iOS";

  let browser = "";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";

  return { ipAddress: ip, device, os, browser };
}

const POPULATE_BASIC = [
  { path: "assignedTo", select: "name email profileImage" },
  { path: "createdBy", select: "name email" },
  { path: "validatedBy", select: "name email" },
  { path: "convertedBy", select: "name email" },
];

// ── Public: Website lead form submission ───────────────────────────────────────
exports.submitLead = async (req, res) => {
  const deviceInfo = extractDeviceInfo(req);
  const referrer = req.headers["referer"] || req.body.referrer || "";

  const lead = await Lead.create({
    ...req.body,
    ...deviceInfo,
    referrer: referrer || req.body.referrer || "",
    source: req.body.source || "website",
    status: "new",
  });

  // Fire-and-forget: acknowledgement to submitter
  if (req.body.email) {
    sendMail("lead.acknowledgement", {
      fullName: req.body.fullName,
      email: req.body.email,
      serviceInterest: req.body.serviceInterest || "",
    }, { to: [req.body.email] });
  }

  // Fire-and-forget: internal notification to admins/sales
  sendMail("lead.internal_notification", {
    fullName: req.body.fullName,
    email: req.body.email || "—",
    phoneNumber: req.body.phoneNumber || "—",
    companyName: req.body.companyName || "—",
    serviceInterest: req.body.serviceInterest || "—",
    source: req.body.source || "website",
    leadId: lead._id.toString(),
    leadUuid: lead.uuid,
  });

  await logActivity(lead._id, "created", `Lead submitted via ${req.body.source || "website"}`, null, {
    source: req.body.source || "website",
    ip: deviceInfo.ipAddress,
  });

  return res.status(201).json(
    new ApiResponse(201, { uuid: lead.uuid }, "Thank you! We'll be in touch shortly.")
  );
};

// ── Admin: List all leads ──────────────────────────────────────────────────────
exports.getAllLeads = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    source,
    priority,
    assignedTo,
    dateFrom,
    dateTo,
    sort = "-createdAt",
  } = req.query;

  const filter = getAccessFilter(req.user);

  if (status) filter.status = status;
  if (source) filter.source = source;
  if (priority) filter.priority = priority;
  if (assignedTo === "unassigned") {
    filter.assignedTo = null;
  } else if (assignedTo) {
    filter.assignedTo = assignedTo;
  }
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }
  if (search) {
    filter.$text = { $search: search };
  }

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email")
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Lead.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      leads,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }, "Leads fetched successfully")
  );
};

// ── Admin: Get single lead ─────────────────────────────────────────────────────
exports.getLeadById = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter).populate(POPULATE_BASIC);
  if (!lead) throw new ApiError(404, "Lead not found");

  return res.status(200).json(new ApiResponse(200, lead, "Lead fetched successfully"));
};

// ── Admin: Create lead ─────────────────────────────────────────────────────────
exports.createLead = async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    createdBy: req.user._id,
  });

  await logActivity(lead._id, "created", `Lead created manually by ${req.user.name}`, req.user._id, {
    createdBy: req.user.name,
  });

  if (req.body.assignedTo) {
    await logActivity(lead._id, "assigned", `Lead assigned to a team member`, req.user._id, {
      assignedTo: req.body.assignedTo,
    });
  }

  return res.status(201).json(new ApiResponse(201, lead, "Lead created successfully"));
};

// ── Admin: Update lead ─────────────────────────────────────────────────────────
exports.updateLead = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const existing = await Lead.findOne(filter);
  if (!existing) throw new ApiError(404, "Lead not found");

  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    { $set: { ...req.body, updatedBy: req.user._id } },
    { new: true, runValidators: true }
  ).populate(POPULATE_BASIC);

  await logActivity(req.params.id, "field_updated", `Lead details updated by ${req.user.name}`, req.user._id);

  return res.status(200).json(new ApiResponse(200, updated, "Lead updated successfully"));
};

// ── Admin: Soft delete ─────────────────────────────────────────────────────────
exports.softDeleteLead = async (req, res) => {
  const filter = { _id: req.params.id, softDeleted: false };
  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  await Lead.findByIdAndUpdate(req.params.id, {
    $set: { softDeleted: true, deletedAt: new Date(), deletedBy: req.user._id },
  });

  await logActivity(req.params.id, "deleted", `Lead moved to trash by ${req.user.name}`, req.user._id);

  return res.status(200).json(new ApiResponse(200, null, "Lead moved to trash"));
};

// ── Admin: Restore from trash ──────────────────────────────────────────────────
exports.restoreLead = async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, softDeleted: true });
  if (!lead) throw new ApiError(404, "Lead not found in trash");

  await Lead.findByIdAndUpdate(req.params.id, {
    $set: { softDeleted: false, deletedAt: null, deletedBy: null },
  });

  await logActivity(req.params.id, "restored", `Lead restored from trash by ${req.user.name}`, req.user._id);

  return res.status(200).json(new ApiResponse(200, null, "Lead restored successfully"));
};

// ── Admin: Assign lead ─────────────────────────────────────────────────────────
exports.assignLead = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  const { assignedTo } = req.body;

  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        assignedTo,
        assignedAt: new Date(),
        assignedBy: req.user._id,
        updatedBy: req.user._id,
      },
    },
    { new: true }
  ).populate("assignedTo", "name email profileImage");

  await logActivity(req.params.id, "assigned", `Lead assigned by ${req.user.name}`, req.user._id, {
    assignedTo,
  });

  // Fire-and-forget: notify assignee
  if (updated.assignedTo?.email) {
    sendMail("lead.assigned", {
      assigneeName: updated.assignedTo.name,
      leadName: lead.fullName,
      companyName: lead.companyName || "—",
      leadId: lead._id.toString(),
    }, { to: [updated.assignedTo.email] });
  }

  return res.status(200).json(new ApiResponse(200, updated, "Lead assigned successfully"));
};

// ── Admin: Validate lead (mark valid or invalid) ───────────────────────────────
exports.validateLead = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  const { isValid, validationNotes = "" } = req.body;
  const newStatus = isValid ? "valid" : "invalid";

  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: newStatus,
        validationNotes,
        validatedBy: req.user._id,
        validatedAt: new Date(),
        updatedBy: req.user._id,
      },
    },
    { new: true }
  ).populate(POPULATE_BASIC);

  const activityType = isValid ? "validated" : "invalidated";
  const msg = isValid
    ? `Lead marked as valid by ${req.user.name}`
    : `Lead marked as invalid by ${req.user.name}`;

  await logActivity(req.params.id, activityType, msg, req.user._id, {
    previousStatus: lead.status,
    validationNotes,
  });

  return res.status(200).json(new ApiResponse(200, updated, `Lead marked as ${newStatus}`));
};

// ── Admin: Convert lead ────────────────────────────────────────────────────────
exports.convertLead = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  if (lead.status === "converted") throw new ApiError(400, "Lead is already converted");

  const { conversionValue = 0, conversionNotes = "" } = req.body;

  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "converted",
        convertedBy: req.user._id,
        convertedAt: new Date(),
        conversionValue,
        conversionNotes,
        updatedBy: req.user._id,
      },
    },
    { new: true }
  ).populate(POPULATE_BASIC);

  await logActivity(req.params.id, "converted", `Lead converted by ${req.user.name}`, req.user._id, {
    previousStatus: lead.status,
    conversionValue,
    conversionNotes,
  });

  sendMail("lead.converted", {
    leadName: lead.fullName,
    companyName: lead.companyName || "—",
    conversionValue,
    conversionNotes,
    convertedBy: req.user.name,
    leadId: lead._id.toString(),
  });

  return res.status(200).json(new ApiResponse(200, updated, "Lead marked as converted"));
};

// ── Admin: Mark lead as lost ───────────────────────────────────────────────────
exports.markLeadLost = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  if (lead.status === "lost") throw new ApiError(400, "Lead is already marked as lost");
  if (lead.status === "converted") throw new ApiError(400, "Cannot mark a converted lead as lost");

  const { lostReason, lostNotes = "" } = req.body;

  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "lost",
        lostReason,
        lostNotes,
        lostAt: new Date(),
        lostBy: req.user._id,
        updatedBy: req.user._id,
      },
    },
    { new: true }
  ).populate(POPULATE_BASIC);

  await logActivity(req.params.id, "lost", `Lead marked as lost by ${req.user.name}`, req.user._id, {
    previousStatus: lead.status,
    lostReason,
  });

  return res.status(200).json(new ApiResponse(200, updated, "Lead marked as lost"));
};

// ── Admin: Archive lead ────────────────────────────────────────────────────────
exports.archiveLead = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  const updated = await Lead.findByIdAndUpdate(
    req.params.id,
    { $set: { status: "archived", updatedBy: req.user._id } },
    { new: true }
  ).populate(POPULATE_BASIC);

  await logActivity(req.params.id, "archived", `Lead archived by ${req.user.name}`, req.user._id, {
    previousStatus: lead.status,
  });

  return res.status(200).json(new ApiResponse(200, updated, "Lead archived"));
};

// ── Admin: Add note ────────────────────────────────────────────────────────────
exports.addNote = async (req, res) => {
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter);
  if (!lead) throw new ApiError(404, "Lead not found");

  const { content } = req.body;

  await logActivity(req.params.id, "note_added", content, req.user._id, {
    addedBy: req.user.name,
  });

  return res.status(201).json(new ApiResponse(201, null, "Note added successfully"));
};

// ── Admin: Get activity log for a lead ────────────────────────────────────────
exports.getActivities = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  // Verify access to this lead
  const filter = getAccessFilter(req.user, { _id: req.params.id });
  const lead = await Lead.findOne(filter).select("_id");
  if (!lead) throw new ApiError(404, "Lead not found");

  const [activities, total] = await Promise.all([
    LeadActivity.find({ leadId: req.params.id })
      .populate("createdBy", "name email profileImage")
      .sort("-createdAt")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    LeadActivity.countDocuments({ leadId: req.params.id }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      activities,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }, "Activities fetched successfully")
  );
};

// ── Admin: Dashboard stats ─────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  const accessFilter = getAccessFilter(req.user);

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    total, statusCounts, thisWeek, thisMonth,
  ] = await Promise.all([
    Lead.countDocuments(accessFilter),
    Lead.aggregate([
      { $match: accessFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Lead.countDocuments({ ...accessFilter, createdAt: { $gte: startOfWeek } }),
    Lead.countDocuments({ ...accessFilter, createdAt: { $gte: startOfMonth } }),
  ]);

  const byStatus = { new: 0, valid: 0, invalid: 0, converted: 0, lost: 0, archived: 0 };
  statusCounts.forEach(({ _id, count }) => {
    if (_id in byStatus) byStatus[_id] = count;
  });

  const conversionRate = total > 0 ? Math.round((byStatus.converted / total) * 100) : 0;

  // Recent leads (last 5)
  const recentLeads = await Lead.find(accessFilter)
    .select("fullName email companyName status source priority createdAt assignedTo")
    .populate("assignedTo", "name email profileImage")
    .sort("-createdAt")
    .limit(5);

  return res.status(200).json(
    new ApiResponse(200, {
      total,
      ...byStatus,
      conversionRate,
      thisWeek,
      thisMonth,
      recentLeads,
    }, "Stats fetched successfully")
  );
};

// ── Admin: Analytics data ─────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  const { days = 30 } = req.query;
  const accessFilter = getAccessFilter(req.user);
  const since = new Date();
  since.setDate(since.getDate() - Number(days));
  const timeFilter = { ...accessFilter, createdAt: { $gte: since } };

  const [
    leadsOverTime,
    bySource,
    byStatus,
    byDevice,
    byBudget,
    lostReasons,
    conversionTrend,
    topCampaigns,
  ] = await Promise.all([
    // Leads created per day
    Lead.aggregate([
      { $match: timeFilter },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),

    // By source
    Lead.aggregate([
      { $match: timeFilter },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // By status
    Lead.aggregate([
      { $match: accessFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),

    // By device
    Lead.aggregate([
      { $match: timeFilter },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]),

    // By budget range
    Lead.aggregate([
      { $match: timeFilter },
      { $group: { _id: "$budgetRange", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Lost reasons
    Lead.aggregate([
      { $match: { ...accessFilter, status: "lost", lostReason: { $ne: "" } } },
      { $group: { _id: "$lostReason", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),

    // Conversion trend (daily: total vs converted)
    Lead.aggregate([
      { $match: timeFilter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          converted: { $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    // Top UTM campaigns
    Lead.aggregate([
      { $match: { ...timeFilter, utmCampaign: { $ne: "" } } },
      { $group: { _id: "$utmCampaign", count: { $sum: 1 }, converted: { $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      leadsOverTime: leadsOverTime.map((d) => ({ date: d._id, count: d.count })),
      bySource: bySource.map((d) => ({ source: d._id || "unknown", count: d.count })),
      byStatus: byStatus.map((d) => ({ status: d._id, count: d.count })),
      byDevice: byDevice.map((d) => ({ device: d._id || "unknown", count: d.count })),
      byBudget: byBudget.map((d) => ({ range: d._id, count: d.count })),
      lostReasons: lostReasons.map((d) => ({ reason: d._id, count: d.count })),
      conversionTrend: conversionTrend.map((d) => ({ date: d._id, total: d.total, converted: d.converted })),
      topCampaigns: topCampaigns.map((d) => ({ campaign: d._id, count: d.count, converted: d.converted })),
    }, "Analytics fetched successfully")
  );
};

// ── Admin: Get trash ───────────────────────────────────────────────────────────
exports.getTrash = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const isAdmin = req.user.role === "super_admin" || req.user.role === "admin";
  const filter = isAdmin
    ? { softDeleted: true }
    : { softDeleted: true, assignedTo: req.user._id };

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate("deletedBy", "name email")
      .populate("assignedTo", "name email profileImage")
      .sort("-deletedAt")
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Lead.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      leads,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
    }, "Trash fetched successfully")
  );
};

// ── Admin: Export leads as CSV ────────────────────────────────────────────────
exports.exportLeads = async (req, res) => {
  const { status, source, dateFrom, dateTo } = req.query;
  const filter = getAccessFilter(req.user);

  if (status) filter.status = status;
  if (source) filter.source = source;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }

  const leads = await Lead.find(filter)
    .populate("assignedTo", "name email")
    .sort("-createdAt")
    .limit(5000);

  const headers = [
    "ID", "Name", "Email", "Phone", "Company", "Status", "Priority",
    "Source", "Service Interest", "Budget", "UTM Campaign", "UTM Source",
    "Assigned To", "Created At",
  ];

  const rows = leads.map((l) => [
    l.uuid,
    l.fullName,
    l.email,
    l.phoneNumber,
    l.companyName,
    l.status,
    l.priority,
    l.source,
    l.serviceInterest,
    l.budgetRange,
    l.utmCampaign,
    l.utmSource,
    l.assignedTo?.name || "",
    l.createdAt.toISOString(),
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="leads-${Date.now()}.csv"`);
  return res.send(csv);
};

// ── Bulk: Delete (soft) ────────────────────────────────────────────────────────
exports.bulkDelete = async (req, res) => {
  const { ids } = req.body;
  const filter = getAccessFilter(req.user, { _id: { $in: ids } });

  await Lead.updateMany(filter, {
    $set: { softDeleted: true, deletedAt: new Date(), deletedBy: req.user._id },
  });

  return res.status(200).json(new ApiResponse(200, null, `${ids.length} lead(s) moved to trash`));
};

// ── Bulk: Restore ─────────────────────────────────────────────────────────────
exports.bulkRestore = async (req, res) => {
  const { ids } = req.body;
  await Lead.updateMany(
    { _id: { $in: ids }, softDeleted: true },
    { $set: { softDeleted: false, deletedAt: null, deletedBy: null } }
  );
  return res.status(200).json(new ApiResponse(200, null, `${ids.length} lead(s) restored`));
};

// ── Bulk: Assign ──────────────────────────────────────────────────────────────
exports.bulkAssign = async (req, res) => {
  const { ids, assignedTo } = req.body;
  const filter = getAccessFilter(req.user, { _id: { $in: ids } });

  await Lead.updateMany(filter, {
    $set: { assignedTo, assignedAt: new Date(), assignedBy: req.user._id, updatedBy: req.user._id },
  });

  return res.status(200).json(new ApiResponse(200, null, `${ids.length} lead(s) assigned`));
};

// ── Bulk: Status change ────────────────────────────────────────────────────────
exports.bulkStatusChange = async (req, res) => {
  const { ids, status } = req.body;
  const filter = getAccessFilter(req.user, { _id: { $in: ids } });

  await Lead.updateMany(filter, {
    $set: { status, updatedBy: req.user._id },
  });

  return res.status(200).json(new ApiResponse(200, null, `${ids.length} lead(s) updated to "${status}"`));
};
