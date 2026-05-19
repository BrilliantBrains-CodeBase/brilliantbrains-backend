const EmailTemplate = require("../modules/email/models/EmailTemplate.model");
const EmailRoutingRule = require("../modules/email/models/EmailRoutingRule.model");
const { logger } = require("../utils/logger");

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
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

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FE611C,#F44F17);padding:32px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Brilliant Brains</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
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

const btn = (text, href) =>
  `<a href="${href}" style="display:inline-block;background:#FE611C;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;margin-top:28px;">${text}</a>`;

const h2 = (text) =>
  `<h2 style="color:#111;font-size:22px;font-weight:700;margin:0 0 12px;">${text}</h2>`;

const p = (text) =>
  `<p style="color:#555;font-size:15px;line-height:1.7;margin:8px 0;">${text}</p>`;

const info = (label, value) =>
  `<tr>
    <td style="padding:8px 0;font-size:13px;color:#888;width:150px;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#333;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;

// ─── Templates definition ─────────────────────────────────────────────────────
const TEMPLATES = [

  // 1. Login Detection
  {
    rule: {
      eventType: "login_detection",
      label: "Login Detection Alert",
      description: "Sent to the admin whenever a successful login is detected on their account.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "login_detection",
      name: "Login Detection Alert",
      subject: "New login detected on your Brilliant Brains account",
      variables: ["userEmail", "userName", "userRole", "loginTime", "ipAddress"],
      previewData: { userEmail: "admin@brilliantbrains.ai", userName: "Admin", userRole: "super_admin", loginTime: "17 May 2025, 10:30 AM", ipAddress: "103.21.45.100" },
      htmlBody: wrap(
        "A new login was detected on your account.",
        `${h2("New Login Detected")}
        ${p("Hi <strong>{{userName}}</strong>,")}
        ${p("A successful login was just recorded on your <strong>Brilliant Brains</strong> admin account. If this was you, no action is needed.")}
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background:#fff8f5;border:1px solid #ffe0d0;border-radius:10px;padding:16px 20px;">
          <tr><td colspan="2" style="padding-bottom:12px;font-size:13px;font-weight:700;color:#FE611C;text-transform:uppercase;letter-spacing:0.5px;">Login Details</td></tr>
          ${info("Account", "{{userEmail}}")}
          ${info("Role", "{{userRole}}")}
          ${info("Time", "{{loginTime}}")}
          ${info("IP Address", "{{ipAddress}}")}
        </table>
        ${p("If you did not perform this login, please <strong>change your password immediately</strong> and contact your system administrator.")}`,
      ),
      textBody: "New login detected on your Brilliant Brains account.\n\nAccount: {{userEmail}}\nRole: {{userRole}}\nTime: {{loginTime}}\nIP: {{ipAddress}}\n\nIf this wasn't you, change your password immediately.",
      isActive: true,
    },
  },

  // 2. Password Reset
  {
    rule: {
      eventType: "password_reset",
      label: "Password Reset Link",
      description: "Sent when a user requests a password reset. Contains the secure reset link.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "password_reset",
      name: "Password Reset Link",
      subject: "Reset your Brilliant Brains password",
      variables: ["userName", "resetLink"],
      previewData: { userName: "Admin", resetLink: "https://brilliantbrains.ai/admin/reset-password?token=abc123" },
      htmlBody: wrap(
        "Reset your Brilliant Brains admin password.",
        `${h2("Reset Your Password")}
        ${p("Hi <strong>{{userName}}</strong>,")}
        ${p("We received a request to reset the password for your Brilliant Brains admin account. Click the button below to set a new password.")}
        <div style="text-align:center;">
          ${btn("Reset Password", "{{resetLink}}")}
        </div>
        ${p("This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.")}`,
      ),
      textBody: "Hi {{userName}},\n\nClick the link below to reset your password:\n{{resetLink}}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.",
      isActive: true,
    },
  },

  // 3. Password Reset Success
  {
    rule: {
      eventType: "password_reset_success",
      label: "Password Reset Confirmation",
      description: "Sent after a successful password reset to confirm the change.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "password_reset_success",
      name: "Password Reset Confirmation",
      subject: "Your Brilliant Brains password has been changed",
      variables: ["userName"],
      previewData: { userName: "Admin" },
      htmlBody: wrap(
        "Your password has been successfully changed.",
        `${h2("Password Changed Successfully")}
        ${p("Hi <strong>{{userName}}</strong>,")}
        ${p("Your Brilliant Brains admin account password has been successfully updated. You can now log in with your new password.")}
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:24px 0;">
          <p style="color:#15803d;font-size:14px;font-weight:600;margin:0;">✓ Password updated successfully</p>
        </div>
        ${p("If you did not make this change, please contact your system administrator immediately.")}`,
      ),
      textBody: "Hi {{userName}},\n\nYour Brilliant Brains admin password has been changed successfully.\n\nIf you did not make this change, contact your system administrator immediately.",
      isActive: true,
    },
  },

  // 4. Job Application Received (to applicant)
  {
    rule: {
      eventType: "job_application_received",
      label: "Job Application Received (Applicant Confirmation)",
      description: "Sent to the candidate immediately after they submit an application, confirming receipt.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "job_application_received",
      name: "Job Application Received",
      subject: "We received your application for {{jobTitle}}",
      variables: ["applicantName", "jobTitle", "applicationId", "companyName"],
      previewData: { applicantName: "Rahul Sharma", jobTitle: "Full Stack Developer", applicationId: "APP-0001", companyName: "Brilliant Brains" },
      htmlBody: wrap(
        "We've received your job application.",
        `${h2("Application Received!")}
        ${p("Hi <strong>{{applicantName}}</strong>,")}
        ${p("Thank you for applying to <strong>{{companyName}}</strong>! We've successfully received your application for the following position:")}
        <div style="background:#fff8f5;border-left:4px solid #FE611C;border-radius:0 10px 10px 0;padding:16px 20px;margin:24px 0;">
          <p style="color:#FE611C;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">Position</p>
          <p style="color:#111;font-size:18px;font-weight:700;margin:0;">{{jobTitle}}</p>
          <p style="color:#888;font-size:12px;margin:8px 0 0;">Application ID: <strong>{{applicationId}}</strong></p>
        </div>
        ${p("Our team will carefully review your application. If your profile matches our requirements, we will reach out to schedule the next steps.")}
        ${p("We appreciate your interest and wish you the best of luck!")}`,
      ),
      textBody: "Hi {{applicantName}},\n\nThank you for applying to {{companyName}} for the position of {{jobTitle}}.\n\nYour Application ID: {{applicationId}}\n\nWe will review your application and get back to you soon.",
      isActive: true,
    },
  },

  // 5. New Application Alert (to HR team)
  {
    rule: {
      eventType: "new_application_alert",
      label: "New Application Alert (HR Notification)",
      description: "Sent to the HR team when a new job application is submitted. Configure recipients to your HR team's email(s).",
      recipients: [],
      recipientMode: "static",
      isActive: true,
    },
    template: {
      eventType: "new_application_alert",
      name: "New Application Alert",
      subject: "New application: {{applicantName}} for {{jobTitle}}",
      variables: ["applicantName", "applicantEmail", "jobTitle", "applicationId", "appliedAt", "experience", "phone"],
      previewData: { applicantName: "Rahul Sharma", applicantEmail: "rahul@example.com", jobTitle: "Full Stack Developer", applicationId: "APP-0001", appliedAt: "17 May 2025", experience: "3 years", phone: "+91 9876543210" },
      htmlBody: wrap(
        "A new application has been submitted.",
        `${h2("New Application Received")}
        ${p("A new candidate has applied through your careers page. Here are the details:")}
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:16px 20px;">
          ${info("Name", "{{applicantName}}")}
          ${info("Email", "{{applicantEmail}}")}
          ${info("Position", "{{jobTitle}}")}
          ${info("Application ID", "{{applicationId}}")}
          ${info("Applied On", "{{appliedAt}}")}
          ${info("Experience", "{{experience}}")}
          ${info("Phone", "{{phone}}")}
        </table>
        ${p("Log in to the admin panel to review this application, update the status, or add notes.")}`,
      ),
      textBody: "New Application\n\nName: {{applicantName}}\nEmail: {{applicantEmail}}\nPosition: {{jobTitle}}\nApplication ID: {{applicationId}}\nApplied On: {{appliedAt}}\nExperience: {{experience}}\nPhone: {{phone}}",
      isActive: true,
    },
  },

  // 6. Application Shortlisted (to applicant)
  {
    rule: {
      eventType: "application_shortlisted",
      label: "Application Shortlisted (Candidate Notification)",
      description: "Sent to the candidate when their application is shortlisted by HR.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "application_shortlisted",
      name: "Application Shortlisted",
      subject: "Great news! Your application for {{jobTitle}} has been shortlisted",
      variables: ["applicantName", "jobTitle", "companyName"],
      previewData: { applicantName: "Rahul Sharma", jobTitle: "Full Stack Developer", companyName: "Brilliant Brains" },
      htmlBody: wrap(
        "Your application has been shortlisted!",
        `${h2("You've Been Shortlisted! 🎉")}
        ${p("Hi <strong>{{applicantName}}</strong>,")}
        ${p("We have great news! After reviewing your application for <strong>{{jobTitle}}</strong> at <strong>{{companyName}}</strong>, we're happy to inform you that your profile has been <strong>shortlisted</strong>.")}
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin:24px 0;text-align:center;">
          <p style="color:#15803d;font-size:18px;font-weight:700;margin:0;">✓ Shortlisted for <br/>{{jobTitle}}</p>
        </div>
        ${p("Our team will be in touch with you shortly to discuss the next steps in the hiring process. Please keep an eye on your inbox.")}
        ${p("Thank you for your patience and continued interest in joining <strong>{{companyName}}</strong>!")}`,
      ),
      textBody: "Hi {{applicantName}},\n\nCongratulations! Your application for {{jobTitle}} at {{companyName}} has been shortlisted.\n\nOur team will be in touch shortly with next steps.",
      isActive: true,
    },
  },

  // 7. Application Rejected (to applicant)
  {
    rule: {
      eventType: "application_rejected",
      label: "Application Rejected (Candidate Notification)",
      description: "Sent to the candidate when their application is marked as rejected.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "application_rejected",
      name: "Application Rejected",
      subject: "Update on your application for {{jobTitle}} at {{companyName}}",
      variables: ["applicantName", "jobTitle", "companyName", "rejectionReason"],
      previewData: { applicantName: "Rahul Sharma", jobTitle: "Full Stack Developer", companyName: "Brilliant Brains", rejectionReason: "" },
      htmlBody: wrap(
        "An update regarding your job application.",
        `${h2("Application Update")}
        ${p("Hi <strong>{{applicantName}}</strong>,")}
        ${p("Thank you for taking the time to apply for the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong> and for your interest in joining our team.")}
        ${p("After carefully reviewing your application, we regret to inform you that we will not be moving forward with your candidacy at this time.")}
        ${p("We truly appreciate the effort you put into your application. We encourage you to keep an eye on our careers page for future opportunities that may be a great fit.")}
        ${p("We wish you all the best in your job search.")}`,
      ),
      textBody: "Hi {{applicantName}},\n\nThank you for applying for {{jobTitle}} at {{companyName}}.\n\nAfter reviewing your application, we regret to inform you that we will not be moving forward at this time.\n\nWe wish you all the best in your job search.",
      isActive: true,
    },
  },

  // 8. Interview Scheduled (to applicant)
  {
    rule: {
      eventType: "interview_scheduled",
      label: "Interview Scheduled (Candidate Notification)",
      description: "Sent to the candidate when an interview is scheduled for them.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "interview_scheduled",
      name: "Interview Scheduled",
      subject: "Your interview is scheduled — {{jobTitle}} at {{companyName}}",
      variables: ["applicantName", "jobTitle", "companyName", "interviewDate", "interviewNotes"],
      previewData: { applicantName: "Rahul Sharma", jobTitle: "Full Stack Developer", companyName: "Brilliant Brains", interviewDate: "22 May 2025, 11:00 AM", interviewNotes: "Please join via Google Meet. Link will be shared 30 minutes before." },
      htmlBody: wrap(
        "Your interview has been scheduled.",
        `${h2("Interview Scheduled! 📅")}
        ${p("Hi <strong>{{applicantName}}</strong>,")}
        ${p("We are pleased to inform you that your interview for the <strong>{{jobTitle}}</strong> position at <strong>{{companyName}}</strong> has been scheduled.")}
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background:#fff8f5;border:1px solid #ffe0d0;border-radius:10px;padding:16px 20px;">
          <tr><td colspan="2" style="padding-bottom:12px;font-size:13px;font-weight:700;color:#FE611C;text-transform:uppercase;letter-spacing:0.5px;">Interview Details</td></tr>
          ${info("Position", "{{jobTitle}}")}
          ${info("Date & Time", "{{interviewDate}}")}
          ${info("Notes", "{{interviewNotes}}")}
        </table>
        ${p("Please make sure you are available at the scheduled time. If you have any questions or need to reschedule, reach out to us as soon as possible.")}
        ${p("We look forward to speaking with you. Best of luck!")}`,
      ),
      textBody: "Hi {{applicantName}},\n\nYour interview for {{jobTitle}} at {{companyName}} has been scheduled.\n\nDate & Time: {{interviewDate}}\nNotes: {{interviewNotes}}\n\nWe look forward to speaking with you.",
      isActive: true,
    },
  },

  // 9. Lead Acknowledgement (to lead submitter)
  {
    rule: {
      eventType: "lead.acknowledgement",
      label: "Lead Acknowledgement (to Submitter)",
      description: "Confirmation email sent directly to the person who submitted the contact/lead form.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "lead.acknowledgement",
      name: "Lead Acknowledgement",
      subject: "Thanks for reaching out — we'll be in touch soon!",
      variables: ["leadName", "serviceInterest", "companyName"],
      previewData: { leadName: "Arjun Sharma", serviceInterest: "E-commerce Website Development", companyName: "Brilliant Brains" },
      htmlBody: wrap(
        "We've received your message and will get back to you shortly.",
        `${h2("Thanks for reaching out! 👋")}
        ${p("Hi <strong>{{leadName}}</strong>,")}
        ${p("We've received your enquiry and our team will review it shortly. Here's a quick summary of what you shared with us:")}
        <div style="background:#fff8f5;border-left:4px solid #FE611C;border-radius:0 10px 10px 0;padding:16px 20px;margin:24px 0;">
          <p style="color:#FE611C;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">Service Interest</p>
          <p style="color:#111;font-size:17px;font-weight:700;margin:0;">{{serviceInterest}}</p>
        </div>
        ${p("Our team typically responds within <strong>1 business day</strong>. We look forward to understanding your project better and exploring how we can work together.")}
        ${p("In the meantime, feel free to explore our work at <strong>brilliantbrains.ai</strong>.")}`,
      ),
      textBody: "Hi {{leadName}},\n\nThanks for reaching out to {{companyName}}! We've received your enquiry about {{serviceInterest}}.\n\nOur team will get back to you within 1 business day.\n\nBrilliant Brains — brilliantbrains.ai",
      isActive: true,
    },
  },

  // 10. Lead Internal Notification (to team)
  {
    rule: {
      eventType: "lead.internal_notification",
      label: "New Lead Alert (Internal Team Notification)",
      description: "Sent to the sales/admin team whenever a new lead submits the website form. Configure recipients to your sales team's email(s).",
      recipients: [],
      recipientMode: "static",
      isActive: true,
    },
    template: {
      eventType: "lead.internal_notification",
      name: "New Lead Internal Notification",
      subject: "🔔 New lead: {{leadName}} — {{serviceInterest}}",
      variables: ["leadName", "leadEmail", "leadPhone", "companyName", "serviceInterest", "budgetRange", "message", "source", "submittedAt"],
      previewData: { leadName: "Arjun Sharma", leadEmail: "arjun@techcorp.com", leadPhone: "+91 98765 43210", companyName: "TechNova Solutions", serviceInterest: "E-commerce Website Development", budgetRange: "50k_100k", message: "We need a complete e-commerce overhaul with custom checkout.", source: "website", submittedAt: "18 May 2025, 10:30 AM" },
      htmlBody: wrap(
        "A new lead has submitted the contact form.",
        `${h2("New Lead Submitted")}
        ${p("A new lead just came in through the website. Here are the details:")}
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:16px 20px;">
          <tr><td colspan="2" style="padding-bottom:12px;font-size:13px;font-weight:700;color:#FE611C;text-transform:uppercase;letter-spacing:0.5px;">Contact Details</td></tr>
          ${info("Name", "{{leadName}}")}
          ${info("Email", "{{leadEmail}}")}
          ${info("Phone", "{{leadPhone}}")}
          ${info("Company", "{{companyName}}")}
          ${info("Service Interest", "{{serviceInterest}}")}
          ${info("Budget Range", "{{budgetRange}}")}
          ${info("Source", "{{source}}")}
          ${info("Submitted At", "{{submittedAt}}")}
        </table>
        <div style="background:#fff8f5;border:1px solid #ffe0d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="font-size:13px;font-weight:700;color:#FE611C;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Message</p>
          <p style="color:#333;font-size:14px;line-height:1.6;margin:0;">{{message}}</p>
        </div>
        ${p("Log in to the CRM to review, assign, or take action on this lead.")}`,
      ),
      textBody: "New Lead Submitted\n\nName: {{leadName}}\nEmail: {{leadEmail}}\nPhone: {{leadPhone}}\nCompany: {{companyName}}\nService: {{serviceInterest}}\nBudget: {{budgetRange}}\nSource: {{source}}\nSubmitted: {{submittedAt}}\n\nMessage:\n{{message}}",
      isActive: true,
    },
  },

  // 11. Lead Assigned (to assignee)
  {
    rule: {
      eventType: "lead.assigned",
      label: "Lead Assigned (Assignee Notification)",
      description: "Sent to the team member when a lead is assigned to them.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "lead.assigned",
      name: "Lead Assigned Notification",
      subject: "A new lead has been assigned to you — {{leadName}}",
      variables: ["assigneeName", "leadName", "leadEmail", "companyName", "serviceInterest", "priority", "dashboardUrl"],
      previewData: { assigneeName: "Priya Mehta", leadName: "Arjun Sharma", leadEmail: "arjun@techcorp.com", companyName: "TechNova Solutions", serviceInterest: "E-commerce Website Development", priority: "high", dashboardUrl: "https://brilliantbrains.ai/admin/dashboard/crm/leads" },
      htmlBody: wrap(
        "A new lead has been assigned to you.",
        `${h2("New Lead Assigned to You")}
        ${p("Hi <strong>{{assigneeName}}</strong>,")}
        ${p("A lead has been assigned to you for follow-up. Here's a quick overview:")}
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background:#fff8f5;border:1px solid #ffe0d0;border-radius:10px;padding:16px 20px;">
          ${info("Lead Name", "{{leadName}}")}
          ${info("Email", "{{leadEmail}}")}
          ${info("Company", "{{companyName}}")}
          ${info("Service Interest", "{{serviceInterest}}")}
          ${info("Priority", "{{priority}}")}
        </table>
        ${p("Please review the full lead details and reach out at the earliest opportunity.")}
        <div style="text-align:center;">
          ${btn("View Lead in CRM", "{{dashboardUrl}}")}
        </div>`,
      ),
      textBody: "Hi {{assigneeName}},\n\nA new lead has been assigned to you.\n\nLead: {{leadName}}\nEmail: {{leadEmail}}\nCompany: {{companyName}}\nService: {{serviceInterest}}\nPriority: {{priority}}\n\nView it here: {{dashboardUrl}}",
      isActive: true,
    },
  },

  // 12. Lead Converted (to admins)
  {
    rule: {
      eventType: "lead.converted",
      label: "Lead Converted (Admin Summary)",
      description: "Sent to admins when a lead is marked as converted. Configure recipients to your management team.",
      recipients: [],
      recipientMode: "static",
      isActive: true,
    },
    template: {
      eventType: "lead.converted",
      name: "Lead Converted Notification",
      subject: "🎉 Lead converted — {{leadName}} ({{companyName}})",
      variables: ["leadName", "leadEmail", "companyName", "serviceInterest", "conversionValue", "conversionNotes", "convertedBy", "convertedAt"],
      previewData: { leadName: "Arjun Sharma", leadEmail: "arjun@techcorp.com", companyName: "TechNova Solutions", serviceInterest: "E-commerce Website Development", conversionValue: "₹1,20,000", conversionNotes: "Signed 6-month retainer. Kick-off scheduled for next week.", convertedBy: "Priya Mehta", convertedAt: "18 May 2025, 2:45 PM" },
      htmlBody: wrap(
        "A lead has been successfully converted.",
        `${h2("Lead Converted! 🎉")}
        ${p("Great news — a lead has been successfully converted to a client. Here's the summary:")}
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;">
          <tr><td colspan="2" style="padding-bottom:12px;font-size:13px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">Conversion Summary</td></tr>
          ${info("Client Name", "{{leadName}}")}
          ${info("Email", "{{leadEmail}}")}
          ${info("Company", "{{companyName}}")}
          ${info("Service", "{{serviceInterest}}")}
          ${info("Value", "{{conversionValue}}")}
          ${info("Converted By", "{{convertedBy}}")}
          ${info("Converted At", "{{convertedAt}}")}
        </table>
        <div style="background:#fff8f5;border:1px solid #ffe0d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
          <p style="font-size:13px;font-weight:700;color:#FE611C;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px;">Notes</p>
          <p style="color:#333;font-size:14px;line-height:1.6;margin:0;">{{conversionNotes}}</p>
        </div>
        ${p("Log in to the CRM to view the full conversion details and update the project record.")}`,
      ),
      textBody: "Lead Converted!\n\nClient: {{leadName}}\nEmail: {{leadEmail}}\nCompany: {{companyName}}\nService: {{serviceInterest}}\nValue: {{conversionValue}}\nConverted By: {{convertedBy}}\nConverted At: {{convertedAt}}\n\nNotes: {{conversionNotes}}",
      isActive: true,
    },
  },

  // 13. Admin Password Reset (by Super Admin)
  {
    rule: {
      eventType: "user.password_reset",
      label: "Admin Password Reset",
      description: "Sent to a user when their password is reset by a Super Admin.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "user.password_reset",
      name: "Admin Password Reset",
      subject: "Your Brilliant Brains password has been reset",
      variables: ["userName", "userEmail", "newPassword", "loginUrl"],
      previewData: { userName: "Rahul Sharma", userEmail: "rahul@brilliantbrains.ai", newPassword: "Xk9mP2qR8nYs4vAz", loginUrl: "https://brilliantbrains.ai/admin/login" },
      htmlBody: wrap(
        "Your admin account password has been reset.",
        `${h2("Password Reset by Administrator")}
        ${p("Hi <strong>{{userName}}</strong>,")}
        ${p("Your Brilliant Brains admin account password has been reset by a system administrator. Your new temporary password is shown below:")}
        <div style="background:#fff8f5;border:2px solid #FE611C;border-radius:10px;padding:24px;margin:24px 0;text-align:center;">
          <p style="color:#888;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px;">Your New Temporary Password</p>
          <p style="color:#111;font-size:24px;font-weight:700;font-family:monospace;letter-spacing:3px;margin:0;">{{newPassword}}</p>
        </div>
        ${p("Please log in and <strong>change your password immediately</strong> from your account settings.")}
        <div style="text-align:center;">
          ${btn("Log In to Admin Panel", "{{loginUrl}}")}
        </div>
        ${p("If you did not expect this change, contact your system administrator immediately.")}`,
      ),
      textBody: "Hi {{userName}},\n\nYour Brilliant Brains admin password has been reset by an administrator.\n\nYour new temporary password: {{newPassword}}\n\nPlease log in and change it immediately: {{loginUrl}}\n\nIf you did not expect this, contact your system administrator.",
      isActive: true,
    },
  },

  // 14. Newsletter Welcome Email
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
          <li>Expert tips on e-commerce, influencer marketing &amp; more</li>
          <li>Exclusive updates from our team</li>
        </ul>
        ${p("Stay tuned — your first edition is on its way soon.")}
        <div style="background:#fff8f5;border-left:4px solid #FE611C;border-radius:0 10px 10px 0;padding:16px 20px;margin:24px 0;">
          <p style="color:#FE611C;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 4px;">Did you know?</p>
          <p style="color:#333;font-size:14px;line-height:1.6;margin:0;">Brilliant Brains has helped 100+ brands scale their digital presence across India and beyond.</p>
        </div>
        ${p("If you ever wish to unsubscribe, <a href=\"{{unsubscribeLink}}\" style=\"color:#FE611C;text-decoration:underline;\">click here</a>.")}`,
      ),
      textBody: "Hi {{name}},\n\nThank you for subscribing to the Brilliant Brains Newsletter!\n\nWe'll be sending you digital marketing insights, growth strategies, and exclusive updates.\n\nTo unsubscribe at any time, visit: {{unsubscribeLink}}",
      isActive: true,
    },
  },

  // 15. Newsletter Unsubscribe Confirmation
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
        ${p("Thank you for being part of our community.")}`,
      ),
      textBody: "Hi {{name}},\n\nYou have been successfully unsubscribed from the Brilliant Brains Newsletter.\n\nIf you change your mind, you can re-subscribe at: {{resubscribeUrl}}\n\nThank you for being part of our community.",
      isActive: true,
    },
  },

  // 16. Welcome User (to new admin user)
  {
    rule: {
      eventType: "welcome_user",
      label: "Welcome New User",
      description: "Sent to a new user when their admin account is created.",
      recipients: [],
      recipientMode: "dynamic",
      isActive: true,
    },
    template: {
      eventType: "welcome_user",
      name: "Welcome New User",
      subject: "Welcome to Brilliant Brains Admin Panel",
      variables: ["userName", "userEmail", "role", "loginUrl"],
      previewData: { userName: "Rahul Sharma", userEmail: "rahul@brilliantbrains.ai", role: "admin", loginUrl: "https://brilliantbrains.ai/admin/login" },
      htmlBody: wrap(
        "Welcome to the Brilliant Brains admin panel.",
        `${h2("Welcome to Brilliant Brains! 👋")}
        ${p("Hi <strong>{{userName}}</strong>,")}
        ${p("Your Brilliant Brains admin account has been created. Here are your account details:")}
        <table cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;background:#f9f9f9;border:1px solid #eee;border-radius:10px;padding:16px 20px;">
          ${info("Email", "{{userEmail}}")}
          ${info("Role", "{{role}}")}
        </table>
        ${p("You can log in to the admin panel using your email address and the password set for your account.")}
        <div style="text-align:center;">
          ${btn("Go to Admin Panel", "{{loginUrl}}")}
        </div>
        ${p("If you have any questions, reach out to your system administrator.")}`,
      ),
      textBody: "Hi {{userName}},\n\nYour Brilliant Brains admin account has been created.\n\nEmail: {{userEmail}}\nRole: {{role}}\n\nLog in here: {{loginUrl}}",
      isActive: true,
    },
  },
];

// ─── Seed function ────────────────────────────────────────────────────────────
async function seedEmailTemplates() {
  let seeded = 0;

  for (const { rule, template } of TEMPLATES) {
    // Upsert routing rule (never overwrite existing one — admin may have customised it)
    const existingRule = await EmailRoutingRule.findOne({ eventType: rule.eventType });
    let ruleDoc;
    if (!existingRule) {
      ruleDoc = await EmailRoutingRule.create(rule);
    } else {
      ruleDoc = existingRule;
      // Migrate recipientMode if not set on existing records
      if (!existingRule.recipientMode) {
        await EmailRoutingRule.findByIdAndUpdate(existingRule._id, { recipientMode: rule.recipientMode });
      }
    }

    // Upsert template (never overwrite existing one)
    const existingTemplate = await EmailTemplate.findOne({ eventType: template.eventType });
    if (!existingTemplate) {
      const templateDoc = await EmailTemplate.create(template);

      // Link template to routing rule if rule has no template yet
      if (!ruleDoc.templateId) {
        await EmailRoutingRule.findByIdAndUpdate(ruleDoc._id, { templateId: templateDoc._id });
      }
      seeded++;
    }
  }

  if (seeded > 0) {
    logger.info(`✉️  Email seed: ${seeded} default template(s) created.`);
  }
}

module.exports = seedEmailTemplates;
