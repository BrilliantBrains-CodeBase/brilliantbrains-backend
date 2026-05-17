const router = require("express").Router();
const {
  createTag,
  getAllTags,
  updateTag,
  deleteTag
} = require("../controllers/tag.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.get("/", getAllTags);
router.post("/", authenticate, requirePermission("blogs"), createTag);
router.patch("/:id", authenticate, requirePermission("blogs"), updateTag);
router.delete("/:id", authenticate, requirePermission("blogs"), deleteTag);

module.exports = router;
