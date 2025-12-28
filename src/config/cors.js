const env = require("./env");

const allowedOrigins =
  env.NODE_ENV === "production"
    ? env.PROD_ORIGINS
    : env.DEV_ORIGINS;

// ✅ Normalize (VERY IMPORTANT)
const normalizedOrigins = allowedOrigins.map(o => o.trim());

module.exports = {
  origin: (origin, callback) => {
    // Allow non-browser tools (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (normalizedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log the rejected origin for debugging
    console.log(`❌ CORS blocked origin: ${origin}`);
    console.log(`✅ Allowed origins:`, normalizedOrigins);
    
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};