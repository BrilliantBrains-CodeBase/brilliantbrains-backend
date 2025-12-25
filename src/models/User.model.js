const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const schema = new mongoose.Schema({
  email: String,
  password: String,
  role: { type: String, enum: Object.values(ROLES) }
});

module.exports = mongoose.model("User", schema);
