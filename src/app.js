const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");

const routes = require("./routes");
const { csrfProtection } = require("./middleware/csrf.middleware");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

// Trust nginx reverse proxy so req.protocol returns "https" in production
app.set("trust proxy", 1);

/* -------------------- CORS CONFIG (FIXED) -------------------- */

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173", // Vite
  "https://brilliantbrains.ai", // Production URL
  "https://www.brilliantbrains.ai", // Production URL with www  
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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

// Serve static files — absolute path so PM2 CWD doesn't matter
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

/* -------------------- CSRF (AFTER CORS) -------------------- */

app.use(csrfProtection);

/* -------------------- ROUTES -------------------- */

app.use("/api", routes);

/* -------------------- ERROR HANDLER -------------------- */

app.use(errorHandler);

module.exports = app;
