const SmtpProvider = require("../models/SmtpProvider.model");
const { encrypt } = require("../../../utils/emailCrypto");
const { verifyTransporter } = require("../providers/smtpTransporter");
const { getTransporter, invalidate } = require("../services/transporterCache");
const { sendTestEmail } = require("../services/emailService");
const ApiResponse = require("../../../utils/ApiResponse");
const ApiError = require("../../../utils/ApiError");

exports.list = async (req, res, next) => {
  try {
    const providers = await SmtpProvider.find().sort({ isDefault: -1, createdAt: -1 });
    return res.json(new ApiResponse(200, providers, "SMTP providers fetched"));
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      providerName, smtpHost, smtpPort, smtpUsername, smtpPassword,
      encryption, senderName, senderEmail, replyToEmail, isDefault, isActive,
    } = req.body;

    if (!smtpPassword) throw new ApiError(400, "SMTP password is required");

    if (isDefault) {
      await SmtpProvider.updateMany({ isDefault: true }, { isDefault: false });
    }

    const provider = await SmtpProvider.create({
      providerName, smtpHost, smtpPort, smtpUsername,
      smtpPassword: encrypt(smtpPassword),
      encryption, senderName, senderEmail, replyToEmail,
      isDefault: isDefault || false,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id,
    });

    const { smtpPassword: _, ...safeProvider } = provider.toObject();
    return res.status(201).json(new ApiResponse(201, safeProvider, "SMTP provider created"));
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.smtpPassword) {
      updates.smtpPassword = encrypt(updates.smtpPassword);
    } else {
      delete updates.smtpPassword;
    }

    if (updates.isDefault) {
      await SmtpProvider.updateMany({ _id: { $ne: id }, isDefault: true }, { isDefault: false });
    }

    const provider = await SmtpProvider.findByIdAndUpdate(id, updates, { new: true });
    if (!provider) throw new ApiError(404, "Provider not found");

    invalidate(id);
    const { smtpPassword: _, ...safeProvider } = provider.toObject();
    return res.json(new ApiResponse(200, safeProvider, "SMTP provider updated"));
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const provider = await SmtpProvider.findByIdAndDelete(id);
    if (!provider) throw new ApiError(404, "Provider not found");
    invalidate(id);
    return res.json(new ApiResponse(200, null, "SMTP provider deleted"));
  } catch (err) {
    next(err);
  }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const provider = await SmtpProvider.findById(req.params.id);
    if (!provider) throw new ApiError(404, "Provider not found");
    provider.isActive = !provider.isActive;
    await provider.save();
    invalidate(req.params.id);
    return res.json(new ApiResponse(200, { isActive: provider.isActive }, "Status updated"));
  } catch (err) {
    next(err);
  }
};

exports.setDefault = async (req, res, next) => {
  try {
    const { id } = req.params;
    await SmtpProvider.updateMany({ isDefault: true }, { isDefault: false });
    const provider = await SmtpProvider.findByIdAndUpdate(id, { isDefault: true }, { new: true });
    if (!provider) throw new ApiError(404, "Provider not found");
    const { smtpPassword: _, ...safeProvider } = provider.toObject();
    return res.json(new ApiResponse(200, safeProvider, "Default provider updated"));
  } catch (err) {
    next(err);
  }
};

exports.testConnection = async (req, res, next) => {
  try {
    const provider = await SmtpProvider.findById(req.params.id).select("+smtpPassword");
    if (!provider) throw new ApiError(404, "Provider not found");

    invalidate(req.params.id);

    try {
      await verifyTransporter(provider);
      provider.lastTestedAt = new Date();
      provider.lastTestStatus = "success";
      provider.lastTestError = "";
      await provider.save();
      return res.json(new ApiResponse(200, { status: "success" }, "SMTP connection verified"));
    } catch (err) {
      provider.lastTestedAt = new Date();
      provider.lastTestStatus = "failed";
      provider.lastTestError = err.message;
      await provider.save();
      return res.status(422).json(new ApiResponse(422, { status: "failed", error: err.message }, "SMTP connection failed"));
    }
  } catch (err) {
    next(err);
  }
};

exports.sendTestEmail = async (req, res, next) => {
  try {
    const { toEmail } = req.body;
    if (!toEmail) throw new ApiError(400, "toEmail is required");

    const provider = await SmtpProvider.findById(req.params.id).select("+smtpPassword");
    if (!provider) throw new ApiError(404, "Provider not found");

    invalidate(req.params.id);

    const info = await sendTestEmail(provider, toEmail);
    return res.json(new ApiResponse(200, { messageId: info.messageId }, "Test email sent successfully"));
  } catch (err) {
    next(err);
  }
};
