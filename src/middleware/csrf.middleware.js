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
 * Skip CSRF for preflight requests
 */
const csrfMiddleware = (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return csrfProtection(req, res, next);
};

module.exports = { csrfProtection: csrfMiddleware };
