const Tag = require("../models/Tag.model");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");

exports.createTag = async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) throw new ApiError(400, "Name and slug are required");

  const existing = await Tag.findOne({ slug });
  if (existing) throw new ApiError(400, "Tag slug exists");

  const tag = await Tag.create({ name, slug });
  return res.status(201).json(new ApiResponse(201, tag, "Tag created"));
};

exports.getAllTags = async (req, res) => {
  const tags = await Tag.find();
  return res.status(200).json(new ApiResponse(200, tags, "Tags fetched"));
};

exports.deleteTag = async (req, res) => {
  const { id } = req.params;
  const tag = await Tag.findByIdAndDelete(id);
  if (!tag) throw new ApiError(404, "Tag not found");
  return res.status(200).json(new ApiResponse(200, null, "Tag deleted"));
};
