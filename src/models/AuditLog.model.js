const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  resource: String,
  ip: String
});

module.exports = mongoose.model("AuditLog", schema);
