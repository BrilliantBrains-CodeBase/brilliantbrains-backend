require("dotenv").config();
const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");
const bootstrapSuperAdmin = require("./scripts/bootstrapSuperAdmin");

connectDB().then(() => {
  bootstrapSuperAdmin();
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
});
