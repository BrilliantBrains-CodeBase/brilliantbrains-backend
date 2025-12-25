const csrf = require("csurf");

const isProduction = process.env.NODE_ENV === "production";

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax"
  }
});

module.exports = { csrfProtection };
