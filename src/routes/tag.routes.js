const router = require("express").Router();
const { 
  createTag, 
  getAllTags, 
  deleteTag 
} = require("../controllers/tag.controller");
const { verifyJWT, authorize } = require("../middleware/auth.middleware");

router.get("/", getAllTags);
router.post("/", verifyJWT, authorize("admin", "super_admin"), createTag);
router.delete("/:id", verifyJWT, authorize("admin", "super_admin"), deleteTag);

module.exports = router;
