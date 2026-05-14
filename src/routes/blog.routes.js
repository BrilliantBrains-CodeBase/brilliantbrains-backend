const router = require("express").Router();
const { 
  createBlog, 
  getAllBlogs, 
  getBlogBySlug, 
  getBlogById,
  updateBlog, 
  deleteBlog, 
  getRelatedBlogs 
} = require("../controllers/blog.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// Public routes
router.get("/", getAllBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id", authenticate, authorize("admin", "super_admin"), getBlogById);
router.get("/:id/related", getRelatedBlogs);

// Protected routes (Admin only)
router.post("/", authenticate, authorize("admin", "super_admin"), createBlog);
router.patch("/:id", authenticate, authorize("admin", "super_admin"), updateBlog);
router.delete("/:id", authenticate, authorize("admin", "super_admin"), deleteBlog);

module.exports = router;
