const NewsletterSubscriber = require("../models/NewsletterSubscriber.model");
const NewsletterSettings = require("../models/NewsletterSettings.model");
const EmailLog = require("../modules/email/models/EmailLog.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const { sendMail } = require("../modules/email/services/emailService");
const logger = require("../utils/logger");

// ── Shared helpers ────────────────────────────────────────────────────────────

function parseCSVLines(text) {
  const lines = [];
  let row = [], cell = "", inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (c === '"') {
      if (inQuote && next === '"') { cell += '"'; i++; }
      else inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      row.push(cell.trim()); cell = "";
    } else if (c === '\n' && !inQuote) {
      row.push(cell.trim());
      if (row.some(v => v)) lines.push(row);
      row = []; cell = "";
    } else if (c === '\r' && !inQuote) {
      // skip CR
    } else {
      cell += c;
    }
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(v => v)) lines.push(row); }
  return lines;
}

function extractDeviceInfo(req) {
  const ua = req.headers["user-agent"] || "";
  const ip = (req.ip || req.socket?.remoteAddress || "").replace("::ffff:", "");
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

async function fireWelcomeEmail(subscriber) {
  const settings = await NewsletterSettings.findOne({ _singleton: true });
  if (settings?.welcomeEmailEnabled === false) return;
  const unsubscribeLink = `${process.env.FRONTEND_URL}/unsubscribe?token=${subscriber.uuid}`;
  sendMail("newsletter.welcome", {
    name: subscriber.fullName || subscriber.email.split("@")[0],
    email: subscriber.email,
    unsubscribeLink,
  }, { to: [subscriber.email] }).catch((err) => {
    logger.error(`[Newsletter] welcome email failed for ${subscriber.email}: ${err.message}`);
  });
}

async function fireUnsubscribeConfirmEmail(subscriber) {
  const settings = await NewsletterSettings.findOne({ _singleton: true });
  if (settings?.unsubscribeEmailEnabled === false) return;
  const resubscribeUrl = `${process.env.FRONTEND_URL}`;
  sendMail("newsletter.unsubscribe_confirm", {
    name: subscriber.fullName || subscriber.email.split("@")[0],
    email: subscriber.email,
    resubscribeUrl,
  }, { to: [subscriber.email] }).catch((err) => {
    logger.error(`[Newsletter] unsubscribe confirm email failed for ${subscriber.email}: ${err.message}`);
  });
}

// ── Public: Subscribe ─────────────────────────────────────────────────────────
exports.subscribe = async (req, res, next) => {
  try {
    const {
      email, fullName, phoneNumber, source,
      referrer, landingPage, utmSource, utmMedium,
      utmCampaign, utmContent, utmTerm,
    } = req.body;

    const normalized = email.toLowerCase().trim();
    const existing = await NewsletterSubscriber.findOne({ email: normalized });

    if (existing) {
      if (existing.status === "subscribed") {
        return res.status(200).json(new ApiResponse(200, null, "You are already subscribed to our newsletter."));
      }
      if (existing.status === "blocked") {
        return res.status(400).json(new ApiResponse(400, null, "This email cannot be subscribed."));
      }
      // Re-subscribe (unsubscribed or pending)
      existing.status = "subscribed";
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      existing.unsubscribeReason = "";
      existing.unsubscribeFeedback = "";
      if (fullName) existing.fullName = fullName;
      await existing.save();
      await fireWelcomeEmail(existing);
      return res.status(200).json(new ApiResponse(200, null, "Welcome back! You've been re-subscribed successfully."));
    }

    const deviceInfo = extractDeviceInfo(req);
    const subscriber = await NewsletterSubscriber.create({
      email: normalized,
      fullName: fullName || "",
      phoneNumber: phoneNumber || "",
      status: "subscribed",
      source: source || "website",
      referrer: referrer || req.headers.referer || "",
      landingPage: landingPage || "",
      utmSource: utmSource || "",
      utmMedium: utmMedium || "",
      utmCampaign: utmCampaign || "",
      utmContent: utmContent || "",
      utmTerm: utmTerm || "",
      ...deviceInfo,
      subscribedAt: new Date(),
    });

    await fireWelcomeEmail(subscriber);
    return res.status(201).json(new ApiResponse(201, null, "Successfully subscribed to our newsletter!"));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json(new ApiResponse(200, null, "You are already subscribed."));
    }
    next(error);
  }
};

// ── Public: Get unsubscribe info by token ─────────────────────────────────────
exports.getUnsubscribeInfo = async (req, res, next) => {
  try {
    const subscriber = await NewsletterSubscriber.findOne({ uuid: req.params.token, softDeleted: false });
    if (!subscriber) throw new ApiError(404, "Invalid or expired unsubscribe link.");
    return res.status(200).json(
      new ApiResponse(200, {
        email: subscriber.email,
        name: subscriber.fullName,
        status: subscriber.status,
        alreadyUnsubscribed: subscriber.status === "unsubscribed",
      }, "Subscriber info fetched")
    );
  } catch (error) {
    next(error);
  }
};

// ── Public: Process unsubscribe ───────────────────────────────────────────────
exports.processUnsubscribe = async (req, res, next) => {
  try {
    const { reason, feedback } = req.body;
    const subscriber = await NewsletterSubscriber.findOne({ uuid: req.params.token, softDeleted: false });
    if (!subscriber) throw new ApiError(404, "Invalid or expired unsubscribe link.");

    if (subscriber.status === "unsubscribed") {
      return res.status(200).json(new ApiResponse(200, null, "You are already unsubscribed."));
    }

    subscriber.status = "unsubscribed";
    subscriber.unsubscribedAt = new Date();
    subscriber.unsubscribeReason = reason;
    subscriber.unsubscribeFeedback = feedback || "";
    await subscriber.save();

    await fireUnsubscribeConfirmEmail(subscriber);
    return res.status(200).json(new ApiResponse(200, null, "You have been successfully unsubscribed."));
  } catch (error) {
    next(error);
  }
};

// ── Admin: List subscribers ───────────────────────────────────────────────────
exports.getAllSubscribers = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10,
      search = "", status = "", source = "",
      tags = "", dateFrom = "", dateTo = "",
      sort = "-subscribedAt",
    } = req.query;

    const filter = { softDeleted: false };
    if (status)  filter.status = status;
    if (source)  filter.source = source;
    if (tags)    filter.tags = { $in: tags.split(",").map(t => t.trim()).filter(Boolean) };
    if (dateFrom || dateTo) {
      filter.subscribedAt = {};
      if (dateFrom) filter.subscribedAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.subscribedAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }
    if (search) {
      filter.$or = [
        { email:    { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [subscribers, total] = await Promise.all([
      NewsletterSubscriber.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      NewsletterSubscriber.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        subscribers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }, "Subscribers fetched successfully")
    );
  } catch (error) {
    next(error);
  }
};

// ── Admin: Get subscriber by ID ───────────────────────────────────────────────
exports.getSubscriberById = async (req, res, next) => {
  try {
    const subscriber = await NewsletterSubscriber.findOne({ _id: req.params.id, softDeleted: false });
    if (!subscriber) throw new ApiError(404, "Subscriber not found");
    return res.status(200).json(new ApiResponse(200, subscriber, "Subscriber fetched"));
  } catch (error) {
    next(error);
  }
};

// ── Admin: Update subscriber ──────────────────────────────────────────────────
exports.updateSubscriber = async (req, res, next) => {
  try {
    const { fullName, phoneNumber, status, tags, notes } = req.body;
    const subscriber = await NewsletterSubscriber.findOne({ _id: req.params.id, softDeleted: false });
    if (!subscriber) throw new ApiError(404, "Subscriber not found");

    if (fullName    !== undefined) subscriber.fullName    = fullName;
    if (phoneNumber !== undefined) subscriber.phoneNumber = phoneNumber;
    if (notes       !== undefined) subscriber.notes       = notes;
    if (tags        !== undefined) subscriber.tags        = tags;

    if (status !== undefined && status !== subscriber.status) {
      if (status === "unsubscribed") subscriber.unsubscribedAt = new Date();
      if (status === "subscribed" && subscriber.status === "unsubscribed") {
        subscriber.subscribedAt  = new Date();
        subscriber.unsubscribedAt = null;
      }
      subscriber.status = status;
    }

    await subscriber.save();
    return res.status(200).json(new ApiResponse(200, subscriber, "Subscriber updated"));
  } catch (error) {
    next(error);
  }
};

// ── Admin: Soft delete ────────────────────────────────────────────────────────
exports.softDeleteSubscriber = async (req, res, next) => {
  try {
    const subscriber = await NewsletterSubscriber.findOne({ _id: req.params.id, softDeleted: false });
    if (!subscriber) throw new ApiError(404, "Subscriber not found");
    subscriber.softDeleted = true;
    subscriber.deletedAt   = new Date();
    subscriber.deletedBy   = req.user._id;
    await subscriber.save();
    return res.status(200).json(new ApiResponse(200, null, "Subscriber removed"));
  } catch (error) {
    next(error);
  }
};

// ── Admin: Dashboard stats ────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const now         = new Date();
    const weekAgo     = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [statusAgg, thisWeek, thisMonth, lastMonth] = await Promise.all([
      NewsletterSubscriber.aggregate([
        { $match: { softDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      NewsletterSubscriber.countDocuments({
        softDeleted: false, status: "subscribed", createdAt: { $gte: weekAgo },
      }),
      NewsletterSubscriber.countDocuments({
        softDeleted: false, status: "subscribed", createdAt: { $gte: monthStart },
      }),
      NewsletterSubscriber.countDocuments({
        softDeleted: false, status: "subscribed",
        createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
      }),
    ]);

    const counts = { subscribed: 0, unsubscribed: 0, bounced: 0, blocked: 0, pending: 0 };
    for (const s of statusAgg) { if (s._id in counts) counts[s._id] = s.count; }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const growthRate = lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : (thisMonth > 0 ? 100 : 0);
    const activeBase = counts.subscribed + counts.unsubscribed;
    const unsubscribeRate = activeBase > 0
      ? Math.round((counts.unsubscribed / activeBase) * 100)
      : 0;

    return res.status(200).json(
      new ApiResponse(200, {
        total, ...counts,
        addedThisWeek: thisWeek,
        addedThisMonth: thisMonth,
        growthRate,
        unsubscribeRate,
      }, "Stats fetched")
    );
  } catch (error) {
    next(error);
  }
};

// ── Admin: Analytics ──────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res, next) => {
  try {
    const days  = Math.min(parseInt(req.query.range) || 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    const [dailyGrowth, sourceBreakdown, statusBreakdown, monthlyGrowth] = await Promise.all([
      NewsletterSubscriber.aggregate([
        { $match: { softDeleted: false, createdAt: { $gte: since } } },
        {
          $group: {
            _id:          { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total:        { $sum: 1 },
            subscribed:   { $sum: { $cond: [{ $eq: ["$status", "subscribed"]   }, 1, 0] } },
            unsubscribed: { $sum: { $cond: [{ $eq: ["$status", "unsubscribed"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", total: 1, subscribed: 1, unsubscribed: 1 } },
      ]),

      NewsletterSubscriber.aggregate([
        { $match: { softDeleted: false } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, source: "$_id", count: 1 } },
      ]),

      NewsletterSubscriber.aggregate([
        { $match: { softDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } },
      ]),

      NewsletterSubscriber.aggregate([
        { $match: { softDeleted: false, createdAt: { $gte: yearAgo } } },
        {
          $group: {
            _id:   { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, month: "$_id", count: 1 } },
      ]),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { dailyGrowth, sourceBreakdown, statusBreakdown, monthlyGrowth }, "Analytics fetched")
    );
  } catch (error) {
    next(error);
  }
};

// ── Admin: Email logs (newsletter events only) ────────────────────────────────
exports.getEmailLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = "" } = req.query;
    const filter = { eventType: { $regex: "^newsletter", $options: "i" } };
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      EmailLog.find(filter).sort("-createdAt").skip(skip).limit(parseInt(limit)).lean(),
      EmailLog.countDocuments(filter),
    ]);
    return res.status(200).json(
      new ApiResponse(200, {
        logs,
        pagination: {
          total, page: parseInt(page), limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      }, "Email logs fetched")
    );
  } catch (error) {
    next(error);
  }
};

// ── Admin: Export CSV ─────────────────────────────────────────────────────────
exports.exportSubscribers = async (req, res, next) => {
  try {
    const { status = "", source = "", dateFrom = "", dateTo = "" } = req.query;
    const filter = { softDeleted: false };
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (dateFrom || dateTo) {
      filter.subscribedAt = {};
      if (dateFrom) filter.subscribedAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.subscribedAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }

    const subscribers = await NewsletterSubscriber.find(filter).sort("-subscribedAt").lean();

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = [
      "Email", "Full Name", "Phone", "Status", "Source", "Tags",
      "Subscribed At", "UTM Source", "UTM Medium", "UTM Campaign",
      "Open Count", "Click Count", "Notes",
    ];
    const rows = subscribers.map((s) => [
      s.email, s.fullName || "", s.phoneNumber || "", s.status, s.source,
      (s.tags || []).join("|"),
      s.subscribedAt ? new Date(s.subscribedAt).toISOString().split("T")[0] : "",
      s.utmSource || "", s.utmMedium || "", s.utmCampaign || "",
      s.openCount || 0, s.clickCount || 0, s.notes || "",
    ]);

    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const filename = `newsletter_subscribers_${new Date().toISOString().split("T")[0]}.csv`;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

// ── Admin: Import CSV ─────────────────────────────────────────────────────────
exports.importSubscribers = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, "No CSV file uploaded");
    const lines = parseCSVLines(req.file.buffer.toString("utf-8"));
    if (lines.length < 2) throw new ApiError(400, "CSV must contain a header row and at least one data row");

    const headerRow = lines[0].map((h) => h.toLowerCase().replace(/[\s\-]/g, "_"));
    const HEADER_MAP = {
      email:       ["email", "email_address"],
      fullName:    ["full_name", "name", "fullname"],
      phoneNumber: ["phone", "phone_number", "phonenumber"],
      tags:        ["tags"],
      notes:       ["notes"],
    };
    const col = {};
    for (const [field, aliases] of Object.entries(HEADER_MAP)) {
      for (const alias of aliases) {
        const i = headerRow.indexOf(alias);
        if (i !== -1) { col[field] = i; break; }
      }
    }
    if (col.email === undefined) throw new ApiError(400, "CSV must have an 'email' column");

    let created = 0, skipped = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const row   = lines[i];
      const email = (row[col.email] || "").toLowerCase().trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ row: i + 1, email: email || "(empty)", reason: "Invalid email" });
        continue;
      }
      try {
        if (await NewsletterSubscriber.findOne({ email })) { skipped++; continue; }
        await NewsletterSubscriber.create({
          email,
          fullName:    col.fullName    !== undefined ? (row[col.fullName]    || "") : "",
          phoneNumber: col.phoneNumber !== undefined ? (row[col.phoneNumber] || "") : "",
          tags:        col.tags !== undefined && row[col.tags]
            ? row[col.tags].split("|").map(t => t.trim()).filter(Boolean) : [],
          notes:       col.notes !== undefined ? (row[col.notes] || "") : "",
          source:      "import",
          status:      "subscribed",
          subscribedAt: new Date(),
        });
        created++;
      } catch {
        errors.push({ row: i + 1, email, reason: "Import failed" });
      }
    }

    return res.status(200).json(
      new ApiResponse(200, { created, skipped, errors, total: lines.length - 1 },
        `Import complete: ${created} created, ${skipped} skipped`)
    );
  } catch (error) {
    next(error);
  }
};

// ── Admin: Bulk actions ───────────────────────────────────────────────────────
exports.bulkAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;
    const filter = { _id: { $in: ids }, softDeleted: false };
    let message = "";

    switch (action) {
      case "delete":
        await NewsletterSubscriber.updateMany(filter, {
          $set: { softDeleted: true, deletedAt: new Date(), deletedBy: req.user._id },
        });
        message = `${ids.length} subscriber(s) deleted`;
        break;
      case "block":
        await NewsletterSubscriber.updateMany(filter, { $set: { status: "blocked" } });
        message = `${ids.length} subscriber(s) blocked`;
        break;
      case "resubscribe":
        await NewsletterSubscriber.updateMany(filter, {
          $set: { status: "subscribed", subscribedAt: new Date(), unsubscribedAt: null },
        });
        message = `${ids.length} subscriber(s) re-subscribed`;
        break;
      case "unsubscribe":
        await NewsletterSubscriber.updateMany(filter, {
          $set: { status: "unsubscribed", unsubscribedAt: new Date() },
        });
        message = `${ids.length} subscriber(s) unsubscribed`;
        break;
      default:
        throw new ApiError(400, "Invalid bulk action");
    }

    return res.status(200).json(new ApiResponse(200, null, message));
  } catch (error) {
    next(error);
  }
};

// ── Admin: Get settings ───────────────────────────────────────────────────────
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await NewsletterSettings.findOne({ _singleton: true });
    if (!settings) settings = await NewsletterSettings.create({ _singleton: true });
    return res.status(200).json(new ApiResponse(200, settings, "Settings fetched"));
  } catch (error) {
    next(error);
  }
};

// ── Admin: Update settings ────────────────────────────────────────────────────
exports.updateSettings = async (req, res, next) => {
  try {
    const updates = { ...req.body, updatedBy: req.user._id };
    const settings = await NewsletterSettings.findOneAndUpdate(
      { _singleton: true },
      { $set: updates },
      { new: true, upsert: true }
    );
    return res.status(200).json(new ApiResponse(200, settings, "Settings updated"));
  } catch (error) {
    next(error);
  }
};
