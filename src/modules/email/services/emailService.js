const SmtpProvider = require("../models/SmtpProvider.model");
const EmailRoutingRule = require("../models/EmailRoutingRule.model");
const EmailTemplate = require("../models/EmailTemplate.model");
const EmailLog = require("../models/EmailLog.model");
const { getTransporter, invalidate } = require("./transporterCache");
const { renderTemplate } = require("./templateRenderer");
const logger = require("../../../utils/logger");

async function getDefaultProvider() {
  return SmtpProvider.findOne({ isDefault: true, isActive: true }).select("+smtpPassword");
}

async function getProviderById(id) {
  return SmtpProvider.findById(id).select("+smtpPassword");
}

// Atomic log update — uses findByIdAndUpdate so it never interferes with email delivery
async function updateLog(logId, patch) {
  if (!logId) return;
  await EmailLog.findByIdAndUpdate(logId, { $set: patch, $inc: { attempts: 1 } }).catch(() => {});
}

/**
 * Core send function — resolves provider, template, recipients from routing rule.
 */
async function sendMailDirect({ logId, eventType, payload, overrides = {} }) {
  try {
    const rule = await EmailRoutingRule.findOne({ eventType, isActive: true })
      .populate("smtpProviderId")
      .populate("templateId");

    let provider;
    if (rule?.smtpProviderId) {
      provider = await getProviderById(rule.smtpProviderId._id);
    } else {
      provider = await getDefaultProvider();
    }

    if (!provider || !provider.isActive) {
      throw new Error("No active SMTP provider found");
    }

    let subject = "";
    let html = "";
    let text = "";
    const templateId = rule?.templateId?._id || null;

    if (rule?.templateId) {
      const template = await EmailTemplate.findById(rule.templateId._id);
      if (template && template.isActive) {
        const rendered = renderTemplate(template, payload);
        subject = rendered.subject;
        html = rendered.html;
        text = rendered.text || "";
      }
    }

    subject = subject || overrides.subject || "";
    html = html || overrides.html || "";
    text = text || overrides.text || "";

    if (!subject) throw new Error("Email subject is required");
    if (!html && !text) throw new Error("Email body is required");

    const fromEmail = rule?.senderEmailOverride || provider.senderEmail;
    const fromName = rule?.senderNameOverride || provider.senderName;
    const replyTo = overrides.replyTo || provider.replyToEmail || fromEmail;

    const toList = overrides.to?.length ? overrides.to : (rule?.recipients?.map((r) => r.email) || []);
    const ccList = overrides.cc?.length ? overrides.cc : (rule?.cc || []);
    const bccList = overrides.bcc?.length ? overrides.bcc : (rule?.bcc || []);

    if (!toList.length) {
      const isDynamic = rule?.recipientMode === "dynamic";
      throw new Error(
        isDynamic
          ? `No recipient provided for dynamic event '${eventType}'`
          : `No recipients configured for '${eventType}' — add recipients in Email > Routing Rules`
      );
    }

    const transporter = getTransporter(provider);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo,
      to: toList.join(", "),
      cc: ccList.length ? ccList.join(", ") : undefined,
      bcc: bccList.length ? bccList.join(", ") : undefined,
      subject,
      html,
      text,
    });

    // Email sent — update log atomically (failure here must NOT affect sent status)
    await updateLog(logId, {
      status: "sent",
      sentAt: new Date(),
      lastAttemptAt: new Date(),
      messageId: info.messageId || "",
      smtpResponse: info.response || "",
      smtpProviderId: provider._id,
      providerName: provider.providerName,
      templateId,
      "from.name": fromName,
      "from.email": fromEmail,
      to: toList,
      cc: ccList,
      bcc: bccList,
      subject,
    });

    logger.info(`[Email] sent — event=${eventType} to=${toList.join(",")} msgId=${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`[Email] failed — event=${eventType} error=${err.message}`);

    await updateLog(logId, {
      status: "failed",
      lastAttemptAt: new Date(),
      errorMessage: err.message,
    });

    throw err;
  }
}

/**
 * Public API — creates a log entry and sends directly. No queue, no Redis.
 * Fire-and-forget safe: errors are logged and the log is updated to "failed".
 */
async function sendMail(eventType, payload = {}, overrides = {}) {
  const log = await EmailLog.create({
    eventType,
    status: "queued",
    payload,
  });

  // Run async — caller doesn't need to await delivery
  sendMailDirect({ logId: log._id.toString(), eventType, payload, overrides })
    .catch((err) => {
      logger.error(`[Email] unhandled error — event=${eventType}: ${err.message}`);
      // Final safety net: if sendMailDirect fails before its own updateLog runs
      EmailLog.findByIdAndUpdate(log._id, {
        $set: { status: "failed", errorMessage: err.message, lastAttemptAt: new Date() },
      }).catch(() => {});
    });

  return log;
}

/**
 * Send a test email directly using a provider config (for connection testing).
 * Does NOT go through routing rules or templates.
 */
async function sendTestEmail(provider, toEmail) {
  const transporter = getTransporter(provider);

  const info = await transporter.sendMail({
    from: `"${provider.senderName}" <${provider.senderEmail}>`,
    to: toEmail,
    subject: "SMTP Test — Brilliant Brains Admin",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#FE611C;">✅ SMTP Connection Successful</h2>
        <p>Your SMTP provider <strong>${provider.providerName}</strong> is configured correctly.</p>
        <p style="color:#888;font-size:13px;">Sent via ${provider.smtpHost}:${provider.smtpPort} (${provider.encryption})</p>
      </div>
    `,
    text: `SMTP Test successful. Provider: ${provider.providerName} | Host: ${provider.smtpHost}:${provider.smtpPort}`,
  });

  return info;
}

module.exports = { sendMail, sendMailDirect, sendTestEmail };
