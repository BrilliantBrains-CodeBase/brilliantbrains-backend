const crypto = require("crypto");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../modules/email/services/emailService");

/**
 * @desc    Get all users with pagination & filtering
 * @route   GET /api/users
 * @access  Private (Admin/SuperAdmin)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      role = "", 
      status = "",
      sort = "-createdAt" 
    } = req.query;

    const query = {};

    // 🔍 Search filter (Name or Email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // 🎭 Role filter
    if (role) {
      query.role = role;
    }

    // 🟢 Status filter
    if (status) {
      query.isActive = status === "active";
    }

    // 📦 Pagination logic
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customRoleId", "name slug color");

    const total = await User.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(200, {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      }, "Users fetched successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin/SuperAdmin)
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("customRoleId", "name slug color");
    if (!user) throw new ApiError(404, "User not found");

    return res.status(200).json(
      new ApiResponse(200, user, "User fetched successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new user (Admin Action)
 * @route   POST /api/users
 * @access  Private (Admin/SuperAdmin)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phoneNumber, customRoleId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError(400, "User with this email already exists");

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      phoneNumber,
      customRoleId: customRoleId || null,
    });

    // Welcome email — fire-and-forget
    sendMail("welcome_user",
      {
        userName: name || email,
        userEmail: email,
        role: role || "user",
        loginUrl: `${process.env.FRONTEND_URL}/admin/login`,
      },
      { to: [email] }
    ).catch(() => {});

    return res.status(201).json(
      new ApiResponse(201, user, "User created successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user (Admin Action)
 * @route   PATCH /api/users/:id
 * @access  Private (Admin/SuperAdmin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive, phoneNumber, customRoleId } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExists) throw new ApiError(400, "Email already in use");
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, email, role, isActive, phoneNumber, customRoleId: customRoleId || null } },
      { new: true, runValidators: true }
    ).populate("customRoleId", "name slug color");

    return res.status(200).json(
      new ApiResponse(200, updatedUser, "User updated successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user (Admin Action)
 * @route   DELETE /api/users/:id
 * @access  Private (SuperAdmin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found");

    // Prevent deleting the only super admin
    if (user.role === "super_admin") {
      throw new ApiError(403, "Cannot delete a Super Admin");
    }

    await User.findByIdAndDelete(req.params.id);

    return res.status(200).json(
      new ApiResponse(200, null, "User deleted successfully")
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset a user's password (Super Admin only)
 * @route   POST /api/users/:id/reset-password
 * @access  Private (SuperAdmin)
 */
exports.resetUserPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("+password");
    if (!user) throw new ApiError(404, "User not found");
    if (user.role === "super_admin") throw new ApiError(403, "Cannot reset a Super Admin's password");

    // 12 random bytes → 16-char URL-safe base64 string
    const newPassword = crypto.randomBytes(12).toString("base64url").slice(0, 16);
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(req.params.id, { $set: { password: hashedPassword } });

    // Notify the user — fire-and-forget
    sendMail("user.password_reset", {
      userName: user.name || user.email,
      userEmail: user.email,
      newPassword,
      loginUrl: `${process.env.FRONTEND_URL}/admin/login`,
    }, { to: [user.email] }).catch(() => {});

    return res.status(200).json(
      new ApiResponse(200, { newPassword }, "Password reset successfully")
    );
  } catch (error) {
    next(error);
  }
};
