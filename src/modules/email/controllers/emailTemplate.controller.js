const EmailTemplate = require("../models/EmailTemplate.model");
const SmtpProvider = require("../models/SmtpProvider.model");
const { renderTemplate } = require("../services/templateRenderer");
const { getTransporter } = require("../services/transporterCache");
const ApiResponse = require("../../../utils/ApiResponse");
const ApiError = require("../../../utils/ApiError");

exports.list = async (req, res, next) => {
  try {
    const templates = await EmailTemplate.find().sort({ createdAt: -1 });
    return res.json(new ApiResponse(200, templates, "Templates fetched"));
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) throw new ApiError(404, "Template not found");
    return res.json(new ApiResponse(200, template, "Template fetched"));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, eventType, subject, htmlBody, textBody, variables, previewData, isActive } = req.body;

    const template = await EmailTemplate.create({
      name, eventType, subject, htmlBody,
      textBody: textBody || "",
      variables: variables || [],
      previewData: previewData || {},
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, template, "Template created"));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) throw new ApiError(404, "Template not found");
    return res.json(new ApiResponse(200, template, "Template updated"));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) throw new ApiError(404, "Template not found");
    return res.json(new ApiResponse(200, null, "Template deleted"));
  } catch (err) {
    next(err);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) throw new ApiError(404, "Template not found");
    template.isActive = !template.isActive;
    await template.save();
    return res.json(new ApiResponse(200, { isActive: template.isActive }, "Status updated"));
  } catch (err) {
    next(err);
  }
};

exports.preview = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) throw new ApiError(404, "Template not found");
    const variables = req.body.variables || template.previewData || {};
    const rendered = renderTemplate(template, variables);
    return res.json(new ApiResponse(200, rendered, "Preview rendered"));
  } catch (err) {
    next(err);
  }
};

exports.sendTest = async (req, res, next) => {
  try {
    const { toEmail, variables } = req.body;
    if (!toEmail) throw new ApiError(400, "toEmail is required");

    const template = await EmailTemplate.findById(req.params.id);
    if (!template) throw new ApiError(404, "Template not found");

    const provider = await SmtpProvider.findOne({ isDefault: true, isActive: true }).select("+smtpPassword");
    if (!provider) throw new ApiError(422, "No active default SMTP provider configured");

    const rendered = renderTemplate(template, variables || template.previewData || {});
    const transporter = getTransporter(provider);

    const info = await transporter.sendMail({
      from: `"${provider.senderName}" <${provider.senderEmail}>`,
      to: toEmail,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
    });

    return res.json(new ApiResponse(200, { messageId: info.messageId }, "Test email sent"));
  } catch (err) {
    next(err);
  }
};
