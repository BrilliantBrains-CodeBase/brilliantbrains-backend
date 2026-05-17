const router = require("express").Router();
const controller = require("../controllers/media.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");
const { csrfProtection } = require("../middleware/csrf.middleware");
const upload = require("../middleware/upload.middleware");

router.use(authenticate);

router.get("/", requirePermission("media"), controller.getAllMedia);
router.post("/upload", requirePermission("media"), csrfProtection, upload.array("files", 10), controller.uploadMedia);
router.delete("/:id", requirePermission("media"), csrfProtection, controller.deleteMedia);

module.exports = router;
