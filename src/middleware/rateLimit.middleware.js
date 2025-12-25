const rateLimit = require("express-rate-limit");

exports.createRateLimiter = (options) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: options.max || 100
  });
