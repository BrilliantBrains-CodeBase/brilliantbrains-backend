require("dotenv").config();
const env = require("./config/env");
const app = require("./app");
const connectDB = require("./config/db");

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
});
