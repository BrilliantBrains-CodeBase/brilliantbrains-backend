const EmailLog = require("../models/EmailLog.model");
const { sendMailDirect } = require("../services/emailService");
const ApiResponse = require("../../../utils/ApiResponse");
const ApiError = require("../../../utils/ApiError");

exports.list = async (req, res, next) => {
  try {
    const { status, eventType, recipient, provider, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (eventType) filter.eventType = eventType;
    if (recipient) filter.to = { $in: [recipient] };
    if (provider) filter.providerName = { $regex: provider, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      EmailLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-payload"),
      EmailLog.countDocuments(filter),
    ]);

    return res.json(
      new ApiResponse(200, { logs, total, page: Number(page), pages: Math.ceil(total / limit) }, "Logs fetched")
    );
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const log = await EmailLog.findById(req.params.id)
      .populate("smtpProviderId", "providerName smtpHost")
      .populate("templateId", "name");
    if (!log) throw new ApiError(404, "Log not found");
    return res.json(new ApiResponse(200, log, "Log fetched"));
  } catch (err) {
    next(err);
  }
};

exports.retry = async (req, res, next) => {
  try {
    const log = await EmailLog.findById(req.params.id);
    if (!log) throw new ApiError(404, "Log not found");
    if (log.status === "sent") throw new ApiError(400, "Email already sent successfully");

    log.status = "retrying";
    log.attempts += 1;
    await log.save();

    sendMailDirect({
      logId: log._id,
      eventType: log.eventType,
      payload: log.payload,
      overrides: {},
    }).catch(() => {});

    return res.json(new ApiResponse(200, null, "Retry queued"));
  } catch (err) {
    next(err);
  }
};

exports.clearLogs = async (req, res, next) => {
  try {
    const { olderThanDays = 30, status } = req.body;
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const filter = { createdAt: { $lt: cutoff } };
    if (status) filter.status = status;
    const { deletedCount } = await EmailLog.deleteMany(filter);
    return res.json(new ApiResponse(200, { deletedCount }, `${deletedCount} logs cleared`));
  } catch (err) {
    next(err);
  }
};

exports.stats = async (req, res, next) => {
  try {
    const [total, sent, failed, queued] = await Promise.all([
      EmailLog.countDocuments(),
      EmailLog.countDocuments({ status: "sent" }),
      EmailLog.countDocuments({ status: "failed" }),
      EmailLog.countDocuments({ status: { $in: ["queued", "retrying"] } }),
    ]);
    return res.json(new ApiResponse(200, { total, sent, failed, queued }, "Stats fetched"));
  } catch (err) {
    next(err);
  }
};
