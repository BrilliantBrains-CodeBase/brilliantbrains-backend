const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Base cookie options for auth cookies
 * These apply to both access & refresh tokens
 */
const baseCookieOptions = {
  httpOnly: true,                     // JS cannot access cookies (XSS safe)
  secure: env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "lax",                    // CSRF-safe for same-site apps
};

/**
 * Generate JWT access token
 * Short-lived (used for API authorization)
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

/**
 * Generate JWT refresh token
 * Long-lived (used to re-issue access token)
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

/**
 * Set authentication cookies on response
 * This is used during:
 * - Login
 * - Token refresh
 */
exports.setAuthCookies = (res, payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Access token cookie (short-lived)
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  // Refresh token cookie (long-lived)
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear authentication cookies
 * Used during logout
 */
exports.clearAuthCookies = (res) => {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
};
