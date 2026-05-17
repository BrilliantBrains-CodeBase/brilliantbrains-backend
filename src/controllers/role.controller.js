const Role = require("../models/Role.model");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const { PERMISSION_SLUGS } = require("../models/Role.model");

/**
 * @desc    Get all roles
 * @route   GET /api/roles
 * @access  Private (Admin/SuperAdmin)
 */
exports.getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ isSystem: -1, name: 1 }).lean();

    // Attach user counts
    const roleIds = roles.map(r => r._id);
    const counts = await User.aggregate([
      { $match: { customRoleId: { $in: roleIds } } },
      { $group: { _id: "$customRoleId", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map(c => [c._id.toString(), c.count]));
    const rolesWithCount = roles.map(r => ({ ...r, userCount: countMap[r._id.toString()] || 0 }));

    return res.json(new ApiResponse(200, rolesWithCount, "Roles fetched successfully"));
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get available permission slugs
 * @route   GET /api/roles/permissions
 * @access  Private (SuperAdmin)
 */
exports.getPermissions = async (req, res, next) => {
  try {
    return res.json(
      new ApiResponse(200, PERMISSION_SLUGS, "Permission slugs fetched")
    );
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create a new role
 * @route   POST /api/roles
 * @access  Private (SuperAdmin)
 */
exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions, color } = req.body;

    if (!name) throw new ApiError(400, "Role name is required");

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    const existing = await Role.findOne({ slug });
    if (existing) throw new ApiError(400, "A role with this name already exists");

    const role = await Role.create({
      name,
      slug,
      description: description || "",
      permissions: permissions || [],
      color: color || "#6366f1",
      isSystem: false,
      createdBy: req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, role, "Role created successfully"));
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update a role
 * @route   PATCH /api/roles/:id
 * @access  Private (SuperAdmin)
 */
exports.updateRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) throw new ApiError(404, "Role not found");
    if (role.isSystem) throw new ApiError(403, "System roles cannot be modified");

    const { name, description, permissions, color } = req.body;

    if (name && name !== role.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      const conflict = await Role.findOne({ slug, _id: { $ne: role._id } });
      if (conflict) throw new ApiError(400, "A role with this name already exists");
      role.slug = slug;
      role.name = name;
    }

    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (color !== undefined) role.color = color;

    await role.save();
    return res.json(new ApiResponse(200, role, "Role updated successfully"));
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a role
 * @route   DELETE /api/roles/:id
 * @access  Private (SuperAdmin)
 */
exports.deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) throw new ApiError(404, "Role not found");
    if (role.isSystem) throw new ApiError(403, "System roles cannot be deleted");

    const usersUsingRole = await User.countDocuments({ customRoleId: role._id });
    if (usersUsingRole > 0) {
      throw new ApiError(
        400,
        `Cannot delete: ${usersUsingRole} user(s) are assigned this role. Reassign them first.`
      );
    }

    await Role.findByIdAndDelete(req.params.id);
    return res.json(new ApiResponse(200, null, "Role deleted successfully"));
  } catch (err) {
    next(err);
  }
};
