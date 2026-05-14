const Blog = require("../models/Blog.model");
const Category = require("../models/Category.model");
const Tag = require("../models/Tag.model");
const BlogRevision = require("../models/BlogRevision.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const mongoose = require("mongoose");

// Utility to calculate reading time
const calculateReadTime = (blocks) => {
  if (!blocks || !Array.isArray(blocks)) return 1;
  let wordCount = 0;
  blocks.forEach((block) => {
    if (["paragraph", "heading", "list", "quote", "alert"].includes(block.type)) {
      if (typeof block.data?.text === "string") {
        wordCount += block.data.text.split(/\s+/).length;
      }
      if (Array.isArray(block.data?.items)) {
        block.data.items.forEach((item) => {
          if (typeof item === "string") wordCount += item.split(/\s+/).length;
        });
      }
    }
  });
  return Math.ceil(wordCount / 225) || 1; // 225 words per minute average
};

// @desc    Get all blogs (Admin & Public)
exports.getAllBlogs = async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    category, 
    author, 
    tag, 
    search, 
    featured,
    sort = "-createdAt" 
  } = req.query;

  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (author) query.author = author;
  if (tag) query.tags = { $in: [tag] };
  if (featured) query.isFeatured = featured === "true";
  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { summary: { $regex: search, $options: "i" } }
    ];
  }

  const blogs = await Blog.find(query)
    .populate("author", "name email profileImage")
    .populate("category", "name slug color")
    .populate("tags", "name slug")
    .sort(sort)
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Blog.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit)
      }
    }, "Blogs fetched successfully")
  );
};

// @desc    Get single blog by slug
exports.getBlogBySlug = async (req, res) => {
  const { slug } = req.params;

  const blog = await Blog.findOne({ slug, status: "published" })
    .populate("author", "name email profileImage bio socials")
    .populate("category", "name slug")
    .populate("tags", "name slug");

  if (!blog) {
    throw new ApiError(404, "Blog not found or not published");
  }

  blog.stats.views += 1;
  await blog.save();

  return res.status(200).json(
    new ApiResponse(200, blog, "Blog fetched successfully")
  );
};

// @desc    Create new blog (Draft)
exports.createBlog = async (req, res) => {
  const { title, slug, summary, categoryId } = req.body;

  if (!title || !slug || !categoryId) {
    throw new ApiError(400, "Title, slug and category are required");
  }

  const existingBlog = await Blog.findOne({ slug });
  if (existingBlog) {
    throw new ApiError(400, "Slug already exists");
  }

  const blog = await Blog.create({
    title,
    slug,
    summary,
    category: categoryId,
    author: req.user._id,
    content: { blocks: [] },
    status: "draft"
  });

  return res.status(201).json(
    new ApiResponse(201, blog, "Blog draft created successfully")
  );
};

// @desc    Update blog
exports.updateBlog = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const blog = await Blog.findById(id);
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  if (updates.content?.blocks) {
    updates.readTime = calculateReadTime(updates.content.blocks);
    
    await BlogRevision.create({
      blogId: blog._id,
      title: blog.title,
      content: blog.content,
      summary: blog.summary,
      featuredImage: blog.featuredImage,
      revision: blog.revision,
      createdBy: req.user._id
    });
    
    updates.revision = blog.revision + 1;
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.status(200).json(
    new ApiResponse(200, updatedBlog, "Blog updated successfully")
  );
};

// @desc    Get related blogs
exports.getRelatedBlogs = async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  const related = await Blog.find({
    _id: { $ne: blog._id },
    status: "published",
    $or: [
      { category: blog.category },
      { tags: { $in: blog.tags } }
    ]
  })
  .limit(3)
  .populate("category", "name slug color")
  .populate("author", "name profileImage");

  return res.status(200).json(
    new ApiResponse(200, related, "Related blogs fetched successfully")
  );
};

// @desc    Delete blog
exports.deleteBlog = async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findByIdAndDelete(id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  await BlogRevision.deleteMany({ blogId: id });

  return res.status(200).json(
    new ApiResponse(200, null, "Blog and its revisions deleted successfully")
  );
};
