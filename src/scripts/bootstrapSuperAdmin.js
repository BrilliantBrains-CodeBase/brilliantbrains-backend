const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const { ROLES } = require("../constants/roles");

async function bootstrapSuperAdmin() {
  const exists = await User.findOne({
    role: ROLES.SUPER_ADMIN
  });

  if (exists) {
    console.log("✅ Super Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(
    process.env.SUPERADMIN_PASSWORD,
    12
  );

  await User.create({
    email: process.env.SUPERADMIN_EMAIL,
    password: hashedPassword,
    role: ROLES.SUPER_ADMIN
  });

  console.log("🚀 Super Admin created successfully");
}

module.exports = bootstrapSuperAdmin;
