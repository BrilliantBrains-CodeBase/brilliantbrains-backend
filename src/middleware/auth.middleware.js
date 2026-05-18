const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");

const ADMIN_PERMISSIONS = ["dashboard", "blogs", "careers", "media", "users", "settings", "testimonials", "crm"];

exports.authenticate = async (req, _res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("-password")
      .populate("customRoleId", "name slug permissions color");
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Attaches req.user when a valid token is present; never blocks unauthenticated requests.
exports.optionalAuthenticate = async (req, _res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user) req.user = user;
    }
  } catch {
    // invalid / expired token — treat as unauthenticated, don't block
  }
  next();
};

/**
 * 🔐 Authorize by role name
 * @param  {...string} roles - allowed roles
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "Access denied: insufficient permissions"));
    }
    next();
  };
};

/**
 * 🔐 Authorize by permission slug — works for super_admin, admin, and custom roles
 * @param {string} slug - permission slug (e.g. "blogs", "careers")
 */
exports.requirePermission = (slug) => (req, res, next) => {
  const user = req.user;
  if (!user) return next(new ApiError(401, "Authentication required"));

  if (user.role === "super_admin") return next();

  if (user.role === "admin") {
    if (ADMIN_PERMISSIONS.includes(slug)) return next();
    return next(new ApiError(403, "Access denied: insufficient permissions"));
  }

  // Custom role user
  const perms = user.customRoleId?.permissions || [];
  if (perms.includes(slug)) return next();

  return next(new ApiError(403, "Access denied: insufficient permissions"));
};
