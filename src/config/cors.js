const env = require("./env");

const allowedOrigins =
  env.NODE_ENV === "production"
    ? env.PROD_ORIGINS
    : env.DEV_ORIGINS;

module.exports = {
  origin: (origin, callback) => {
    // Allow non-browser tools (Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
};
