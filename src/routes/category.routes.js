const router = require("express").Router();
const { 
  createCategory, 
  getAllCategories, 
  updateCategory, 
  deleteCategory 
} = require("../controllers/category.controller");
const { authenticate, requirePermission } = require("../middleware/auth.middleware");

router.get("/", getAllCategories);
router.post("/", authenticate, requirePermission("blogs"), createCategory);
router.patch("/:id", authenticate, requirePermission("blogs"), updateCategory);
router.delete("/:id", authenticate, requirePermission("blogs"), deleteCategory);

module.exports = router;
