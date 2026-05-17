function render(template, variables = {}) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

function renderTemplate(emailTemplate, variables = {}) {
  return {
    subject: render(emailTemplate.subject, variables),
    html: render(emailTemplate.htmlBody, variables),
    text: emailTemplate.textBody ? render(emailTemplate.textBody, variables) : undefined,
  };
}

module.exports = { render, renderTemplate };
