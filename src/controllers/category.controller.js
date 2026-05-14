const Category = require("../models/Category.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");

exports.createCategory = async (req, res) => {
  const { name, slug, description, image, color, parentId } = req.body;
  if (!name || !slug) throw new ApiError(400, "Name and slug are required");

  const existing = await Category.findOne({ slug });
  if (existing) throw new ApiError(400, "Slug already exists");

  const category = await Category.create({ name, slug, description, image, color, parentId });
  return res.status(201).json(new ApiResponse(201, category, "Category created"));
};

exports.getAllCategories = async (req, res) => {
  const categories = await Category.find().populate("parentId", "name");
  return res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, category, "Category updated"));
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);
  if (!category) throw new ApiError(404, "Category not found");
  return res.status(200).json(new ApiResponse(200, null, "Category deleted"));
};
