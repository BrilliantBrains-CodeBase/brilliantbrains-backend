const { buildTransporter } = require("../providers/smtpTransporter");

const cache = new Map();

function getTransporter(provider) {
  const key = provider._id.toString();
  if (!cache.has(key)) {
    cache.set(key, buildTransporter(provider));
  }
  return cache.get(key);
}

function invalidate(providerId) {
  cache.delete(providerId.toString());
}

function invalidateAll() {
  cache.clear();
}

module.exports = { getTransporter, invalidate, invalidateAll };
