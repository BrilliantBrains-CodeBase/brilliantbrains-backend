const Category = require("../models/Category.model");
const Blog = require("../models/Blog.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

exports.createCategory = async (req, res) => {
  const { name, slug, description, image, color, parentId } = req.body;
  if (!name || !slug) throw new ApiError(400, "Name and slug are required");

  const existing = await Category.findOne({ $or: [{ slug }, { name }] });
  if (existing) throw new ApiError(400, "A category with this name or slug already exists");

  const category = await Category.create({ name, slug, description, image, color, parentId: parentId || null });
  return res.status(201).json(new ApiResponse(201, category, "Category created"));
};

exports.getAllCategories = async (req, res) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: "blogs",
        let: { catId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$category", "$$catId"] },
                  { $eq: ["$status", "published"] }
                ]
              }
            }
          },
          { $count: "total" }
        ],
        as: "blogCountArr"
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "parentId",
        foreignField: "_id",
        as: "parentData"
      }
    },
    {
      $addFields: {
        blogCount: { $ifNull: [{ $arrayElemAt: ["$blogCountArr.total", 0] }, 0] },
        parentId: {
          $cond: {
            if: { $gt: [{ $size: "$parentData" }, 0] },
            then: { $arrayElemAt: ["$parentData", 0] },
            else: null
          }
        }
      }
    },
    { $project: { blogCountArr: 0, parentData: 0 } },
    { $sort: { name: 1 } }
  ]);

  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, image, color, parentId } = req.body;

  if (parentId && parentId === id) {
    throw new ApiError(400, "A category cannot be its own parent");
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { name, slug, description, image, color, parentId: parentId || null },
    { new: true, runValidators: true }
  );
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, category, "Category updated"));
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;

  const blogCount = await Blog.countDocuments({ category: id });
  if (blogCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete: ${blogCount} article(s) are assigned to this category. Reassign them first.`
    );
  }

  const childCount = await Category.countDocuments({ parentId: id });
  if (childCount > 0) {
    throw new ApiError(400, `Cannot delete: ${childCount} sub-category(ies) reference this category.`);
  }

  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, null, "Category deleted"));
};
