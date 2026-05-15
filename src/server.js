require("dotenv").config();
const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const bootstrapSuperAdmin = require("./scripts/bootstrapSuperAdmin");
const { startScheduler } = require("./services/scheduler.service");

connectDB().then(() => {
  bootstrapSuperAdmin();
  startScheduler();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
});
