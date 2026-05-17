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
const { authenticate, requirePermission, optionalAuthenticate } = require("../middleware/auth.middleware");

// Public routes
router.get("/", optionalAuthenticate, getAllBlogs);
router.get("/slug/:slug", getBlogBySlug);
router.get("/:id/related", getRelatedBlogs);
router.get("/:id", authenticate, requirePermission("blogs"), getBlogById);

// Protected routes
router.post("/", authenticate, requirePermission("blogs"), createBlog);
router.patch("/:id", authenticate, requirePermission("blogs"), updateBlog);
router.delete("/:id", authenticate, requirePermission("blogs"), deleteBlog);

module.exports = router;
