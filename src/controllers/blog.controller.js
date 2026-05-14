const Blog = require("../models/Blog.model");
const BlogRevision = require("../models/BlogRevision.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const calculateReadTime = (htmlContent) => {
  if (!htmlContent) return 1;
  const text = htmlContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const wordCount = text.split(" ").filter(Boolean).length;
  return Math.ceil(wordCount / 225) || 1;
};

// @desc  Get all blogs (public + admin)
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
    sort = "-createdAt",
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
      { summary: { $regex: search, $options: "i" } },
    ];
  }

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .select("-content")
      .populate("author", "name email profileImage")
      .populate("category", "name slug color")
      .populate("tags", "name slug")
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Blog.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      blogs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    }, "Blogs fetched successfully")
  );
};

// @desc  Get single blog by slug (public)
exports.getBlogBySlug = async (req, res) => {
  const blog = await Blog.findOne({ slug: req.params.slug, status: "published" })
    .populate("author", "name email profileImage bio socials")
    .populate("category", "name slug color")
    .populate("tags", "name slug");

  if (!blog) throw new ApiError(404, "Blog not found or not published");

  blog.stats.views += 1;
  await blog.save();

  return res.status(200).json(new ApiResponse(200, blog, "Blog fetched successfully"));
};

// @desc  Get single blog by ID (admin)
exports.getBlogById = async (req, res) => {
  const blog = await Blog.findById(req.params.id)
    .populate("author", "name email profileImage")
    .populate("category", "name slug color")
    .populate("tags", "name slug");

  if (!blog) throw new ApiError(404, "Blog not found");

  return res.status(200).json(new ApiResponse(200, blog, "Blog fetched successfully"));
};

// @desc  Create blog
exports.createBlog = async (req, res) => {
  const { title, slug, summary, categoryId, status, content, featuredImage, tags, seo } = req.body;

  if (!title || !slug) throw new ApiError(400, "Title and slug are required");

  const existing = await Blog.findOne({ slug });
  if (existing) throw new ApiError(400, "This slug is already in use");

  const blog = await Blog.create({
    title,
    slug,
    summary: summary || "",
    category: categoryId || null,
    author: req.user._id,
    content: content || "",
    featuredImage: featuredImage || "",
    tags: tags || [],
    status: status || "draft",
    seo: seo || {},
    readTime: calculateReadTime(content),
    publishedAt: status === "published" ? new Date() : null,
  });

  return res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));
};

// @desc  Update blog
exports.updateBlog = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found");

  const updates = { ...req.body };

  if (updates.content !== undefined) {
    updates.readTime = calculateReadTime(updates.content);
    await BlogRevision.create({
      blogId: blog._id,
      title: blog.title,
      content: blog.content,
      summary: blog.summary,
      featuredImage: blog.featuredImage,
      revision: blog.revision,
      createdBy: req.user._id,
    });
    updates.revision = blog.revision + 1;
  }

  if (updates.status === "published" && !blog.publishedAt) {
    updates.publishedAt = new Date();
  }
  if (updates.status === "draft" || updates.status === "archived") {
    updates.scheduledAt = null;
  }

  const updated = await Blog.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, updated, "Blog updated successfully"));
};

// @desc  Get related blogs
exports.getRelatedBlogs = async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found");

  const related = await Blog.find({
    _id: { $ne: blog._id },
    status: "published",
    $or: [{ category: blog.category }, { tags: { $in: blog.tags } }],
  })
    .select("-content")
    .limit(3)
    .populate("category", "name slug color")
    .populate("author", "name profileImage");

  return res.status(200).json(new ApiResponse(200, related, "Related blogs fetched"));
};

// @desc  Delete blog
exports.deleteBlog = async (req, res) => {
  const blog = await Blog.findByIdAndDelete(req.params.id);
  if (!blog) throw new ApiError(404, "Blog not found");

  await BlogRevision.deleteMany({ blogId: req.params.id });

  return res.status(200).json(new ApiResponse(200, null, "Blog deleted successfully"));
};
