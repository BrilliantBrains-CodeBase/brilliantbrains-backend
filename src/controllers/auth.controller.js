const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User.model");
const tokenService = require("../services/token.service");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { JWT_REFRESH_SECRET } = require("../config/env");
const { sendMail } = require("../modules/email/services/emailService");

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

    // Fire-and-forget — never blocks or fails the login response
    sendMail("login_detection", {
      userEmail: user.email,
      userName: user.name || user.email,
      userRole: user.role,
      loginTime: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      ipAddress: req.ip || "unknown",
    }).catch(() => {});

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
          customRoleId: req.user.customRoleId || null, // populated by authenticate middleware
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

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Generate reset token and email a reset link
 * @access  Public
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond with success — never reveal if email exists
    const genericResponse = new ApiResponse(
      200,
      null,
      "If that email is registered, a reset link has been sent."
    );

    if (!user) return res.status(200).json(genericResponse);

    // Generate raw token — sent in email URL
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Store only the hash — never the raw token
    user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/admin/reset-password?token=${rawToken}`;

    sendMail("password_reset", { userName: user.name || user.email, resetLink }, {
      to: [user.email],
      subject: "Reset your Brilliant Brains admin password",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#FE611C;color:#fff;font-weight:900;font-size:20px;padding:10px 20px;border-radius:12px;letter-spacing:1px;">
              Brilliant Brains
            </div>
          </div>
          <h2 style="font-size:22px;font-weight:800;color:#111;margin-bottom:8px;">Password Reset Request</h2>
          <p style="color:#555;margin-bottom:24px;line-height:1.6;">
            Hi <strong>${user.name || user.email}</strong>,<br/>
            We received a request to reset your admin dashboard password.
            Click the button below — this link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetLink}"
              style="background:#FE611C;color:#fff;text-decoration:none;font-weight:700;
              font-size:15px;padding:14px 32px;border-radius:10px;display:inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="color:#999;font-size:12px;margin-top:24px;line-height:1.6;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${resetLink}" style="color:#FE611C;word-break:break-all;">${resetLink}</a>
          </p>
          <p style="color:#bbb;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will not be changed.
          </p>
        </div>
      `,
    }).catch(() => {});

    return res.status(200).json(genericResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/reset-password/:token
 * @desc    Validate token and set new password
 * @access  Public
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) throw new ApiError(400, "Reset token is required");
    if (!password || password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires +password");

    if (!user) throw new ApiError(400, "Reset link is invalid or has expired");

    // Update password and clear the reset token
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email — fire-and-forget
    sendMail("password_reset_success", { userName: user.name || user.email }, {
      to: [user.email],
      subject: "Your Brilliant Brains password has been reset",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#FE611C;color:#fff;font-weight:900;font-size:20px;padding:10px 20px;border-radius:12px;letter-spacing:1px;">
              Brilliant Brains
            </div>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-flex;align-items:center;justify-content:center;
              width:60px;height:60px;border-radius:50%;background:#d1fae5;margin:0 auto;">
              <span style="font-size:28px;">✅</span>
            </div>
          </div>
          <h2 style="font-size:22px;font-weight:800;color:#111;margin-bottom:8px;text-align:center;">
            Password Reset Successful
          </h2>
          <p style="color:#555;margin-bottom:24px;line-height:1.6;text-align:center;">
            Hi <strong>${user.name || user.email}</strong>,<br/>
            Your admin dashboard password has been changed successfully.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${process.env.FRONTEND_URL}/admin/login"
              style="background:#FE611C;color:#fff;text-decoration:none;font-weight:700;
              font-size:15px;padding:14px 32px;border-radius:10px;display:inline-block;">
              Login to Dashboard
            </a>
          </div>
          <p style="color:#bbb;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;text-align:center;">
            If you did not make this change, contact your administrator immediately.
          </p>
        </div>
      `,
    }).catch(() => {});

    return res.status(200).json(new ApiResponse(200, null, "Password reset successfully. You can now log in."));
  } catch (error) {
    next(error);
  }
};

