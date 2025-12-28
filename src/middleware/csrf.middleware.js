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

  // 🚫 Skip CSRF for refresh token endpoint
  if (req.path === "/api/auth/refresh") return next();

  return csrfProtection(req, res, next);
};

module.exports = { csrfProtection: csrfMiddleware };
