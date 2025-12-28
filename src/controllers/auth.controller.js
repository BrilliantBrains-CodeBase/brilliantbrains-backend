const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const tokenService = require("../services/token.service");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { JWT_REFRESH_SECRET } = require("../config/env");

/**
 * POST /auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken, cookieOptions } =
      tokenService.generateAuthTokens(user);

    res
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(
        new ApiResponse(200, {
          id: user._id,
          email: user.email,
          role: user.role
        }, "Login successful")
      );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/refresh
 */
exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    const tokens = tokenService.generateAuthTokens(user);

    res
      .cookie("accessToken", tokens.accessToken, tokens.cookieOptions)
      .cookie("refreshToken", tokens.refreshToken, tokens.cookieOptions)
      .json(new ApiResponse(200, null, "Token refreshed"));
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/logout
 */
exports.logout = async (_req, res, next) => {
  try {
    res
      .clearCookie("accessToken")
      .clearCookie("refreshToken")
      .json(new ApiResponse(200, null, "Logged out"));
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me
 */
exports.me = async (req, res, next) => {
  try {
    res.json(
      new ApiResponse(200, {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role
      })
    );
  } catch (err) {
    next(err);
  }
};
