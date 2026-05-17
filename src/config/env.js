const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  PORT: z.string().default("5000"),
  MONGO_URI: z.string({ required_error: "MONGO_URI is required" }),

  // JWT — required, must be non-trivial length
  JWT_SECRET: z.string({ required_error: "JWT_SECRET is required" }).min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string({ required_error: "JWT_REFRESH_SECRET is required" }).min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  // Frontend URL — used in password-reset emails
  FRONTEND_URL: z.string({ required_error: "FRONTEND_URL is required" }).url("FRONTEND_URL must be a valid URL"),

  // CORS
  DEV_ORIGINS: z.string().optional(),
  PROD_ORIGINS: z.string().optional(),

  // Super admin bootstrap
  SUPERADMIN_EMAIL: z.string({ required_error: "SUPERADMIN_EMAIL is required" }).email(),
  SUPERADMIN_PASSWORD: z.string({ required_error: "SUPERADMIN_PASSWORD is required" }).min(8, "SUPERADMIN_PASSWORD must be at least 8 characters"),
  SUPERADMIN_NAME: z.string().default("Admin"),

  // Email encryption — 64 hex chars = 32 bytes for AES-256
  EMAIL_ENCRYPTION_KEY: z.string({ required_error: "EMAIL_ENCRYPTION_KEY is required" }).length(64, "EMAIL_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes)"),

  // Redis — optional
  REDIS_URL: z.string().url().optional(),
});

let env;
try {
  env = envSchema.parse(process.env);
} catch (err) {
  console.error("\n❌  Invalid environment configuration:\n");
  if (err.errors) {
    err.errors.forEach(e => console.error(`   • ${e.path.join(".")}: ${e.message}`));
  }
  console.error("\n   Check your .env file against .env.example and restart.\n");
  process.exit(1);
}

module.exports = {
  ...env,
  DEV_ORIGINS: env.DEV_ORIGINS?.split(",").map(s => s.trim()) ?? [],
  PROD_ORIGINS: env.PROD_ORIGINS?.split(",").map(s => s.trim()) ?? [],
};
