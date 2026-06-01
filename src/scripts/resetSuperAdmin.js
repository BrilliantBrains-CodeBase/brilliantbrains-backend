require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User.model");
const { ROLES } = require("../constants/roles");

async function resetSuperAdmin() {
  await mongoose.connect(process.env.MONGO_URI);

  const hashedPassword = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 12);

  const result = await User.findOneAndUpdate(
    { role: ROLES.SUPER_ADMIN },
    {
      email: process.env.SUPERADMIN_EMAIL,
      password: hashedPassword,
      name: process.env.SUPERADMIN_NAME || "Admin",
      isActive: true,
    },
    { new: true, upsert: true }
  );

  console.log(`✅ Super Admin reset: ${result.email}`);
  await mongoose.disconnect();
}

resetSuperAdmin().catch(err => {
  console.error("❌ Reset failed:", err.message);
  process.exit(1);
});
