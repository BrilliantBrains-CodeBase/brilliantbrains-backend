const router = require("express").Router();
const { 
  createBlog, 
  getAllBlogs, 
  getBlogBySlug, 
  updateBlog, 
  deleteBlog, 
  getRelatedBlogs 
} = require("../controllers/blog.controller");
const { verifyJWT, authorize } = require("../middleware/auth.middleware");

// Public routes
router.get("/", getAllBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id/related", getRelatedBlogs);

// Protected routes (Admin only)
router.post("/", verifyJWT, authorize("admin", "super_admin"), createBlog);
router.patch("/:id", verifyJWT, authorize("admin", "super_admin"), updateBlog);
router.delete("/:id", verifyJWT, authorize("admin", "super_admin"), deleteBlog);

module.exports = router;
