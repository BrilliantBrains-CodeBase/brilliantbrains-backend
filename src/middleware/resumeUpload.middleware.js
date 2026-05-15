const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const RESUME_DIR = "public/uploads/resumes";

if (!fs.existsSync(RESUME_DIR)) {
  fs.mkdirSync(RESUME_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, RESUME_DIR),
  filename: (_req, file, cb) => {
    const rand = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${rand}${ext}`);
  },
});

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const ALLOWED_EXTS = new Set([".pdf", ".doc", ".docx"]);

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIMES.has(file.mimetype) && ALLOWED_EXTS.has(ext)) {
    return cb(null, true);
  }
  cb(new Error("Only PDF, DOC, and DOCX files are accepted for resumes"), false);
};

const resumeUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard cap
  fileFilter,
});

module.exports = resumeUpload;
