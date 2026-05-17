const nodemailer = require("nodemailer");
const { decrypt } = require("../../../utils/emailCrypto");

function buildTransporter(provider) {
  const password = decrypt(provider.smtpPassword);

  const config = {
    host: provider.smtpHost,
    port: provider.smtpPort,
    auth: {
      user: provider.smtpUsername,
      pass: password,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
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
