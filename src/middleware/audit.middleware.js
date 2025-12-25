const AuditLog = require("../models/AuditLog.model");

exports.audit = (action, resource) => async (req, _, next) => {
  await AuditLog.create({
    userId: req.user?.id,
    action,
    resource,
    ip: req.ip
  });
  next();
};
