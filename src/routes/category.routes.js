const router = require("express").Router();
const { 
  createCategory, 
  getAllCategories, 
  updateCategory, 
  deleteCategory 
} = require("../controllers/category.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.get("/", getAllCategories);
router.post("/", authenticate, authorize("admin", "super_admin"), createCategory);
router.patch("/:id", authenticate, authorize("admin", "super_admin"), updateCategory);
router.delete("/:id", authenticate, authorize("admin", "super_admin"), deleteCategory);

module.exports = router;
