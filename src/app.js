const express = require("express");
const cors = require("cors");
const corsOptions = require("./config/cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");


const routes = require("./routes");
const { csrfProtection } = require("./middleware/csrf.middleware");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// 🔐 CSRF must come AFTER cookieParser and BEFORE routes
app.use(csrfProtection);

app.use("/api", routes);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

module.exports = app;
