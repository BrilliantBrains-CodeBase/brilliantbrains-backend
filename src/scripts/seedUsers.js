/**
 * Seeds 21 demo users into the database:
 *   - 2 users per each of the 10 predefined custom roles (20 total)
 *   - 1 admin user
 *
 * Safe to run repeatedly — uses findOne-then-create so existing users are
 * never overwritten. Requires MONGO_URI in environment.
 *
 * Usage: node src/scripts/seedUsers.js
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");
const Role = require("../models/Role.model");

const DEFAULT_PASSWORD = "admin1234";

// 2 users per predefined custom role
const ROLE_USERS = [
  // content_writer
  { name: "Arjun Mehta",      email: "arjun.mehta@brilliantbrains.ai",     roleSlug: "content_writer" },
  { name: "Priya Sharma",     email: "priya.sharma@brilliantbrains.ai",     roleSlug: "content_writer" },
  // seo_content_lead
  { name: "Rohan Gupta",      email: "rohan.gupta@brilliantbrains.ai",      roleSlug: "seo_content_lead" },
  { name: "Ananya Singh",     email: "ananya.singh@brilliantbrains.ai",     roleSlug: "seo_content_lead" },
  // social_media_manager
  { name: "Vikram Nair",      email: "vikram.nair@brilliantbrains.ai",      roleSlug: "social_media_manager" },
  { name: "Riya Patel",       email: "riya.patel@brilliantbrains.ai",       roleSlug: "social_media_manager" },
  // marketing_manager
  { name: "Kabir Verma",      email: "kabir.verma@brilliantbrains.ai",      roleSlug: "marketing_manager" },
  { name: "Shreya Joshi",     email: "shreya.joshi@brilliantbrains.ai",     roleSlug: "marketing_manager" },
  // sales_executive
  { name: "Amit Kumar",       email: "amit.kumar@brilliantbrains.ai",       roleSlug: "sales_executive" },
  { name: "Divya Reddy",      email: "divya.reddy@brilliantbrains.ai",      roleSlug: "sales_executive" },
  // sales_manager
  { name: "Nikhil Chawla",    email: "nikhil.chawla@brilliantbrains.ai",    roleSlug: "sales_manager" },
  { name: "Pooja Malhotra",   email: "pooja.malhotra@brilliantbrains.ai",   roleSlug: "sales_manager" },
  // hr_executive
  { name: "Sanjay Desai",     email: "sanjay.desai@brilliantbrains.ai",     roleSlug: "hr_executive" },
  { name: "Meera Iyer",       email: "meera.iyer@brilliantbrains.ai",       roleSlug: "hr_executive" },
  // hr_manager
  { name: "Varun Kapoor",     email: "varun.kapoor@brilliantbrains.ai",     roleSlug: "hr_manager" },
  { name: "Swati Banerjee",   email: "swati.banerjee@brilliantbrains.ai",   roleSlug: "hr_manager" },
  // media_manager
  { name: "Rahul Pillai",     email: "rahul.pillai@brilliantbrains.ai",     roleSlug: "media_manager" },
  { name: "Neha Tiwari",      email: "neha.tiwari@brilliantbrains.ai",      roleSlug: "media_manager" },
  // customer_success
  { name: "Aditya Rao",       email: "aditya.rao@brilliantbrains.ai",       roleSlug: "customer_success" },
  { name: "Sneha Chatterjee", email: "sneha.chatterjee@brilliantbrains.ai", roleSlug: "customer_success" },
];

const ADMIN_USER = {
  name: "Suresh Admin",
  email: "suresh.admin@brilliantbrains.ai",
  role: "admin",
};

async function seedUsers() {
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Build slug → ObjectId map from DB
  const roles = await Role.find({ slug: { $in: ROLE_USERS.map((u) => u.roleSlug) } }, "_id slug");
  const roleMap = Object.fromEntries(roles.map((r) => [r.slug, r._id]));

  let created = 0;
  let skipped = 0;

  // Seed custom-role users
  for (const def of ROLE_USERS) {
    const exists = await User.findOne({ email: def.email });
    if (exists) { skipped++; continue; }

    const customRoleId = roleMap[def.roleSlug];
    if (!customRoleId) {
      console.warn(`⚠️  Role not found for slug "${def.roleSlug}" — skipping ${def.email}`);
      continue;
    }

    await User.create({
      name: def.name,
      email: def.email,
      password: hashedPassword,
      role: "user",
      customRoleId,
      isActive: true,
    });
    created++;
  }

  // Seed admin user
  const adminExists = await User.findOne({ email: ADMIN_USER.email });
  if (adminExists) {
    skipped++;
  } else {
    await User.create({
      name: ADMIN_USER.name,
      email: ADMIN_USER.email,
      password: hashedPassword,
      role: ADMIN_USER.role,
      isActive: true,
    });
    created++;
  }

  console.log(`✅ User seed complete: ${created} created, ${skipped} already existed.`);
}

module.exports = seedUsers;

if (require.main === module) {
  require("dotenv").config();
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("✅ MongoDB connected");
      await seedUsers();
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Seed failed:", err);
      process.exit(1);
    });
}
