const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");

exports.authenticate = async (req, _res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
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
 * 🔐 Authorize roles
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
