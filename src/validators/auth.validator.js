const { z } = require("zod");

exports.loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  })
});

exports.refreshSchema = z.object({
  body: z.object({}).strict()
});

exports.logoutSchema = z.object({
  body: z.object({}).strict()
});
