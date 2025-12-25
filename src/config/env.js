const { z } = require("zod");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  PORT: z.string().default("5000"),
  MONGO_URI: z.string(),

  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),

  DEV_ORIGINS: z.string().optional(),
  PROD_ORIGINS: z.string().optional()
});

const env = envSchema.parse(process.env);

module.exports = {
  ...env,
  DEV_ORIGINS: env.DEV_ORIGINS?.split(",") ?? [],
  PROD_ORIGINS: env.PROD_ORIGINS?.split(",") ?? []
};
