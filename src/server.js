require("dotenv").config();
const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const bootstrapSuperAdmin = require("./scripts/bootstrapSuperAdmin");
const bootstrapRoles = require("./scripts/bootstrapRoles");
const seedEmailTemplates = require("./scripts/seedEmailTemplates");
const bootstrapNewsletter = require("./scripts/bootstrapNewsletter");
const { startScheduler } = require("./services/scheduler.service");
const { startCareerScheduler } = require("./services/careerScheduler.service");

connectDB().then(async () => {
  bootstrapSuperAdmin();
  await bootstrapRoles();
  await seedEmailTemplates();
  await bootstrapNewsletter();
  startScheduler();
  startCareerScheduler();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
});
