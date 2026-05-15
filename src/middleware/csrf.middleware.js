const csrf = require("csurf");

/**
 * CSRF protection using HttpOnly cookies
 */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

/**
 * CSRF middleware
 * - Skips OPTIONS (preflight)
 * - Skips refresh-token endpoint
 */
const csrfMiddleware = (req, res, next) => {
  // Skip preflight
  if (req.method === "OPTIONS") return next();

  // Skip refresh token endpoint
  if (req.path === "/api/auth/refresh") return next();

  // Skip public job application submit — multipart/form-data from the careers page;
  // CSRF token is not available on unauthenticated public forms
  if (req.method === "POST" && req.path === "/api/applications") return next();

  return csrfProtection(req, res, next);
};

module.exports = { csrfProtection: csrfMiddleware };
