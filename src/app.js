const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use((req, res, next) => {
  console.log('========================================');
  console.log('📨 INCOMING REQUEST');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Origin:', req.headers.origin);
  console.log('Headers:', req.headers);
  console.log('========================================');
  next();
});

app.use(cors({
  origin: true, // Allow all origins
  credentials: true, // Allow cookies
}));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api", routes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

module.exports = app;