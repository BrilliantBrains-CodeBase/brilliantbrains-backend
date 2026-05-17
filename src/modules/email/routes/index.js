const router = require("express").Router();

router.use("/smtp-providers", require("./smtpProvider.routes"));
router.use("/routing-rules", require("./emailRoutingRule.routes"));
router.use("/templates", require("./emailTemplate.routes"));
router.use("/logs", require("./emailLog.routes"));

module.exports = router;
