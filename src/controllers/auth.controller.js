const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const tokenService = require("../services/token.service");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { JWT_REFRESH_SECRET } = require("../config/env");

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and set auth cookies
 * @access  Public (CSRF protected)
 */
exports.login = async (req, res, next) => {
  try {
    // 1️⃣ Extract credentials from request body
    const { email, password } = req.body;

    // 2️⃣ Find user and explicitly include password
    const user = await User.findOne({ email }).select("+password");

    // Do not expose which field is incorrect
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // 3️⃣ Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    // 4️⃣ Set access & refresh tokens as HttpOnly cookies
    tokenService.setAuthCookies(res, {
      id: user._id,
      role: user.role,
    });

    // 5️⃣ Send standardized success response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
        },
        "Login successful"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token cookie
 * @access  Public
 */
exports.refresh = async (req, res, next) => {
  try {
    // 1️⃣ Read refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    // 2️⃣ Verify refresh token
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // 3️⃣ Ensure user still exists
    const user = await User.findById(payload.id);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // 4️⃣ Re-issue new auth cookies
    tokenService.setAuthCookies(res, {
      id: user._id,
      role: user.role,
    });

    // 5️⃣ Standardized response
    return res.status(200).json(
      new ApiResponse(200, null, "Token refreshed")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and clear auth cookies
 * @access  Authenticated
 */
exports.logout = async (_req, res, next) => {
  try {
    // Clear auth cookies
    tokenService.clearAuthCookies(res);

    return res.status(200).json(
      new ApiResponse(200, null, "Logged out successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Authenticated
 */
exports.me = async (req, res, next) => {
  try {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          profileImage: req.user.profileImage,
        },
        "User fetched successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile details
 * @access  Authenticated
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, profileImage } = req.body;
    const userId = req.user._id;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        throw new ApiError(400, "Email is already in use");
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, email, profileImage } },
      { new: true, runValidators: true }
    );

    return res.status(200).json(
      new ApiResponse(200, {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
      }, "Profile updated successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/auth/password
 * @desc    Change user password
 * @access  Authenticated
 */
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // 1️⃣ Find user with password
    const user = await User.findById(userId).select("+password");

    // 2️⃣ Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Incorrect current password");
    }

    // 3️⃣ Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json(
      new ApiResponse(200, null, "Password changed successfully")
    );
  } catch (error) {
    next(error);
  }
};

