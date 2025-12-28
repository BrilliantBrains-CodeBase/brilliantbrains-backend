const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const routes = require("./routes");
const { csrfProtection } = require("./middleware/csrf.middleware");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

/* -------------------- CORS CONFIG (FIXED) -------------------- */

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173", // Vite
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman / server-to-server
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
    ],
  })
);

// // ✅ IMPORTANT: Explicit preflight support
// app.options("*", cors());

/* -------------------- MIDDLEWARE ORDER -------------------- */

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

/* -------------------- CSRF (AFTER CORS) -------------------- */

app.use(csrfProtection);

/* -------------------- ROUTES -------------------- */

app.use("/api", routes);

/* -------------------- ERROR HANDLER -------------------- */

app.use(errorHandler);

module.exports = app;
