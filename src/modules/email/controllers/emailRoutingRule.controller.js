const EmailRoutingRule = require("../models/EmailRoutingRule.model");
const ApiResponse = require("../../../utils/ApiResponse");
const ApiError = require("../../../utils/ApiError");

exports.list = async (req, res, next) => {
  try {
    const rules = await EmailRoutingRule.find()
      .populate("smtpProviderId", "providerName senderEmail isActive")
      .populate("templateId", "name subject isActive")
      .sort({ createdAt: -1 });
    return res.json(new ApiResponse(200, rules, "Routing rules fetched"));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      eventType, label, description, smtpProviderId, senderEmailOverride,
      senderNameOverride, recipients, cc, bcc, templateId, isActive,
    } = req.body;

    const existing = await EmailRoutingRule.findOne({ eventType });
    if (existing) throw new ApiError(409, `Event type '${eventType}' already exists`);

    const rule = await EmailRoutingRule.create({
      eventType, label, description,
      smtpProviderId: smtpProviderId || null,
      senderEmailOverride, senderNameOverride,
      recipients: recipients || [],
      cc: cc || [],
      bcc: bcc || [],
      templateId: templateId || null,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, rule, "Routing rule created"));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    if (!updates.smtpProviderId) updates.smtpProviderId = null;
    if (!updates.templateId) updates.templateId = null;

    const rule = await EmailRoutingRule.findByIdAndUpdate(id, updates, { new: true })
      .populate("smtpProviderId", "providerName senderEmail")
      .populate("templateId", "name subject");

    if (!rule) throw new ApiError(404, "Routing rule not found");
    return res.json(new ApiResponse(200, rule, "Routing rule updated"));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const rule = await EmailRoutingRule.findByIdAndDelete(req.params.id);
    if (!rule) throw new ApiError(404, "Routing rule not found");
    return res.json(new ApiResponse(200, null, "Routing rule deleted"));
  } catch (err) {
    next(err);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const rule = await EmailRoutingRule.findById(req.params.id);
    if (!rule) throw new ApiError(404, "Routing rule not found");
    rule.isActive = !rule.isActive;
    await rule.save();
    return res.json(new ApiResponse(200, { isActive: rule.isActive }, "Status updated"));
  } catch (err) {
    next(err);
  }
};
