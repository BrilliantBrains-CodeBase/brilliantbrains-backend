const Tag = require("../models/Tag.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

exports.createTag = async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) throw new ApiError(400, "Name and slug are required");

  const existing = await Tag.findOne({ $or: [{ slug }, { name }] });
  if (existing) throw new ApiError(400, "A tag with this name or slug already exists");

  const tag = await Tag.create({ name, slug });
  return res.status(201).json(new ApiResponse(201, tag, "Tag created"));
};

exports.getAllTags = async (req, res) => {
  const tags = await Tag.aggregate([
    {
      $lookup: {
        from: "blogs",
        let: { tagId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$$tagId", "$tags"] },
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
      $addFields: {
        blogCount: { $ifNull: [{ $arrayElemAt: ["$blogCountArr.total", 0] }, 0] }
      }
    },
    { $project: { blogCountArr: 0 } },
    { $sort: { name: 1 } }
  ]);

  return res.status(200).json(new ApiResponse(200, tags, "Tags fetched"));
};

exports.updateTag = async (req, res) => {
  const { id } = req.params;
  const { name, slug } = req.body;
  if (!name || !slug) throw new ApiError(400, "Name and slug are required");

  const conflict = await Tag.findOne({ $or: [{ slug }, { name }], _id: { $ne: id } });
  if (conflict) throw new ApiError(400, "Another tag with this name or slug already exists");

  const tag = await Tag.findByIdAndUpdate(id, { name, slug }, { new: true, runValidators: true });
  if (!tag) throw new ApiError(404, "Tag not found");
  return res.status(200).json(new ApiResponse(200, tag, "Tag updated"));
};

exports.deleteTag = async (req, res) => {
  const { id } = req.params;
  const tag = await Tag.findByIdAndDelete(id);
  if (!tag) throw new ApiError(404, "Tag not found");
  return res.status(200).json(new ApiResponse(200, null, "Tag deleted"));
};
