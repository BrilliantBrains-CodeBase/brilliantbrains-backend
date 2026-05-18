const nodemailer = require("nodemailer");
const { decrypt } = require("../../../utils/emailCrypto");

function buildTransporter(provider) {
  const password = decrypt(provider.smtpPassword);

  const config = {
    host: provider.smtpHost,
    port: provider.smtpPort,
    name: process.env.SMTP_EHLO_NAME || require("os").hostname(),
    family: 4,
    auth: {
      user: provider.smtpUsername,
      pass: password,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false,
    },
  };

  if (provider.encryption === "SSL") {
    config.secure = true;
  } else if (provider.encryption === "TLS") {
    config.secure = false;
    config.requireTLS = true;
  } else {
    config.secure = false;
  }

  return nodemailer.createTransport(config);
}

async function verifyTransporter(provider) {
  const transporter = buildTransporter(provider);
  await transporter.verify();
  return transporter;
}

module.exports = { buildTransporter, verifyTransporter };
