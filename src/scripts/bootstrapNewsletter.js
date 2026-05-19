/**
 * Bootstraps the newsletter system on every server start.
 * Creates the singleton NewsletterSettings document if it doesn't exist.
 * Also seeds the newsletter email templates (welcome + unsubscribe_confirm)
 * into the existing EmailTemplate/EmailRoutingRule system.
 * Safe to run repeatedly — never overwrites existing data.
 */

const mongoose = require("mongoose");
const NewsletterSettings = require("../models/NewsletterSettings.model");
const EmailTemplate = require("../modules/email/models/EmailTemplate.model");
const EmailRoutingRule = require("../modules/email/models/EmailRoutingRule.model");
const { logger } = require("../utils/logger");

// ─── Email template builders (match seedEmailTemplates.js helpers) ─────────────
const wrap = (preheader, bodyHtml) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${preheader}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#FE611C,#F44F17);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Brilliant Brains</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9;border-top:1px solid #eee;padding:24px;text-align:center;">
              <p style="color:#aaa;font-size:12px;margin:0 0 4px;">Brilliant Brains &mdash; brilliantbrains.ai</p>
              <p style="color:#ccc;font-size:11px;margin:0;">This is an automated message. Please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const h2  = (t) => `<h2 style="color:#111;font-size:22px;font-weight:700;margin:0 0 12px;">${t}</h2>`;
const p   = (t) => `<p style="color:#555;font-size:15px;line-height:1.7;margin:8px 0;">${t}</p>`;
const btn = (text, href) =>
  `<a href="${href}" style="display:inline-block;background:#FE611C;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;margin-top:28px;">${text}</a>`;

const NEWSLETTER_TEMPLATES = [
  {
    rule: {
      eventType:     "newsletter.welcome",
      label:         "Newsletter Welcome Email",
      description:   "Sent to a new newsletter subscriber immediately after they subscribe.",
      recipients:    [],
      recipientMode: "dynamic",
      isActive:      true,
    },
    template: {
      eventType:   "newsletter.welcome",
      name:        "Newsletter Welcome Email",
      subject:     "Welcome to the Brilliant Brains Newsletter!",
      variables:   ["name", "email", "unsubscribeLink"],
      previewData: {
        name:            "Rahul Sharma",
        email:           "rahul@example.com",
        unsubscribeLink: "https://brilliantbrains.ai/unsubscribe?token=abc123",
      },
      htmlBody: wrap(
        "Thanks for subscribing to the Brilliant Brains Newsletter.",
        `${h2("Welcome aboard! 🎉")}
        ${p("Hi <strong>{{name}}</strong>,")}
        ${p("Thank you for subscribing to the <strong>Brilliant Brains Newsletter</strong>. We're excited to have you with us!")}
        ${p("Here's what you can expect from us:")}
        <ul style="color:#555;font-size:15px;line-height:1.9;margin:16px 0;padding-left:20px;">
          <li>Digital marketing insights and growth strategies</li>
          <li>Case studies and success stories</li>
          <li>Expert tips on e-commerce, influencer marketing & more</li>
          <li>Exclusive updates from our team</li>
        </ul>
        ${p("Stay tuned — your first edition is on its way soon.")}
        <div style="background:#fff8f5;border-left:4px solid #FE611C;border-radius:0 10px 10px 0;padding:16px 20px;margin:24px 0;">
          <p style="color:#FE611C;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">Did you know?</p>
          <p style="color:#333;font-size:14px;line-height:1.6;margin:0;">Brilliant Brains has helped over 100+ brands scale their digital presence across India and beyond.</p>
        </div>
        ${p(`If you ever wish to unsubscribe, <a href="{{unsubscribeLink}}" style="color:#FE611C;text-decoration:underline;">click here</a>.`)}`,
      ),
      textBody: "Hi {{name}},\n\nThank you for subscribing to the Brilliant Brains Newsletter!\n\nWe'll be sending you digital marketing insights, growth strategies, and exclusive updates.\n\nTo unsubscribe at any time, visit: {{unsubscribeLink}}",
      isActive: true,
    },
  },

  {
    rule: {
      eventType:     "newsletter.unsubscribe_confirm",
      label:         "Newsletter Unsubscribe Confirmation",
      description:   "Sent when a subscriber successfully unsubscribes from the newsletter.",
      recipients:    [],
      recipientMode: "dynamic",
      isActive:      true,
    },
    template: {
      eventType:   "newsletter.unsubscribe_confirm",
      name:        "Newsletter Unsubscribe Confirmation",
      subject:     "You've been unsubscribed from Brilliant Brains Newsletter",
      variables:   ["name", "email", "resubscribeUrl"],
      previewData: {
        name:           "Rahul Sharma",
        email:          "rahul@example.com",
        resubscribeUrl: "https://brilliantbrains.ai",
      },
      htmlBody: wrap(
        "You have been successfully unsubscribed.",
        `${h2("You're unsubscribed.")}
        ${p("Hi <strong>{{name}}</strong>,")}
        ${p("You have been successfully removed from the Brilliant Brains Newsletter. We're sorry to see you go.")}
        <div style="background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:16px 20px;margin:24px 0;">
          <p style="color:#333;font-size:14px;font-weight:600;margin:0 0 4px;">Changed your mind?</p>
          <p style="color:#888;font-size:13px;line-height:1.6;margin:0;">You can re-subscribe at any time by visiting our website.</p>
        </div>
        <div style="text-align:center;">
          ${btn("Re-subscribe", "{{resubscribeUrl}}")}
        </div>
        ${p("If this was a mistake, we'd love to have you back. Thank you for being part of our community.")}`,
      ),
      textBody: "Hi {{name}},\n\nYou have been successfully unsubscribed from the Brilliant Brains Newsletter.\n\nIf you change your mind, you can re-subscribe at: {{resubscribeUrl}}\n\nThank you for being part of our community.",
      isActive: true,
    },
  },
];

async function bootstrapNewsletter() {
  // 1. Ensure singleton settings document exists
  const settingsExists = await NewsletterSettings.findOne({ _singleton: true });
  if (!settingsExists) {
    await NewsletterSettings.create({ _singleton: true });
    logger.info("📧  Newsletter bootstrap: settings document created.");
  }

  // 2. Seed newsletter email templates (safe upsert — never overwrites existing)
  let seeded = 0;
  for (const { rule, template } of NEWSLETTER_TEMPLATES) {
    const existingRule = await EmailRoutingRule.findOne({ eventType: rule.eventType });
    let ruleDoc;
    if (!existingRule) {
      ruleDoc = await EmailRoutingRule.create(rule);
    } else {
      ruleDoc = existingRule;
    }

    const existingTemplate = await EmailTemplate.findOne({ eventType: template.eventType });
    if (!existingTemplate) {
      const templateDoc = await EmailTemplate.create(template);
      if (!ruleDoc.templateId) {
        await EmailRoutingRule.findByIdAndUpdate(ruleDoc._id, { templateId: templateDoc._id });
      }
      seeded++;
    }
  }

  if (seeded > 0) {
    logger.info(`📧  Newsletter bootstrap: ${seeded} email template(s) seeded.`);
  }
}

module.exports = bootstrapNewsletter;

// Standalone CLI: node src/scripts/bootstrapNewsletter.js
if (require.main === module) {
  require("dotenv").config();
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("✅ MongoDB connected");
      await bootstrapNewsletter();
      console.log("✅ Newsletter bootstrap complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Bootstrap failed:", err);
      process.exit(1);
    });
}
