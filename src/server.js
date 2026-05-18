require("dotenv").config();
const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const bootstrapSuperAdmin = require("./scripts/bootstrapSuperAdmin");
const seedEmailTemplates = require("./scripts/seedEmailTemplates");
const { startScheduler } = require("./services/scheduler.service");
const { startCareerScheduler } = require("./services/careerScheduler.service");

connectDB().then(async () => {
  bootstrapSuperAdmin();
  await seedEmailTemplates();
  startScheduler();
  startCareerScheduler();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
});
