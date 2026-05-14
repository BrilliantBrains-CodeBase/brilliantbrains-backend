const router = require("express").Router();
const { 
  createCategory, 
  getAllCategories, 
  updateCategory, 
  deleteCategory 
} = require("../controllers/category.controller");
const { verifyJWT, authorize } = require("../middleware/auth.middleware");

router.get("/", getAllCategories);
router.post("/", verifyJWT, authorize("admin", "super_admin"), createCategory);
router.patch("/:id", verifyJWT, authorize("admin", "super_admin"), updateCategory);
router.delete("/:id", verifyJWT, authorize("admin", "super_admin"), deleteCategory);

module.exports = router;
