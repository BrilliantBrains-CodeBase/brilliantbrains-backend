const router = require("express").Router();
const {
  createTag,
  getAllTags,
  updateTag,
  deleteTag
} = require("../controllers/tag.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.get("/", getAllTags);
router.post("/", authenticate, authorize("admin", "super_admin"), createTag);
router.patch("/:id", authenticate, authorize("admin", "super_admin"), updateTag);
router.delete("/:id", authenticate, authorize("admin", "super_admin"), deleteTag);

module.exports = router;
