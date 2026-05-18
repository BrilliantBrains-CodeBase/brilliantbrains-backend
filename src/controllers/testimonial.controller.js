const Testimonial = require("../models/Testimonial.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// ── Admin: List all (non-deleted) testimonials ─────────────────────────────────
exports.getAllTestimonials = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    isPublished,
    isFeatured,
    testimonialType,
    showOnHomepage,
    verifiedStatus,
    category,
    rating,
    sort = "-createdAt",
  } = req.query;

  const query = { softDeleted: false };

  if (isPublished !== undefined) query.isPublished = isPublished === "true";
  if (isFeatured !== undefined) query.isFeatured = isFeatured === "true";
  if (showOnHomepage !== undefined) query.showOnHomepage = showOnHomepage === "true";
  if (verifiedStatus !== undefined) query.verifiedStatus = verifiedStatus === "true";
  if (testimonialType) query.testimonialType = testimonialType;
  if (category) query.category = category;
  if (rating) query.rating = Number(rating);

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
      { testimonialText: { $regex: search, $options: "i" } },
    ];
  }

  const [testimonials, total] = await Promise.all([
    Testimonial.find(query)
      .populate("createdBy", "name email profileImage")
      .populate("updatedBy", "name email")
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Testimonial.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        testimonials,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Testimonials fetched successfully"
    )
  );
};

// ── Admin: Trash (soft-deleted) ────────────────────────────────────────────────
exports.getTrash = async (req, res) => {
  const { page = 1, limit = 10, sort = "-deletedAt" } = req.query;

  const [testimonials, total] = await Promise.all([
    Testimonial.find({ softDeleted: true })
      .populate("deletedBy", "name email")
      .populate("createdBy", "name email")
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Testimonial.countDocuments({ softDeleted: true }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        testimonials,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Trash fetched successfully"
    )
  );
};

// ── Admin: Dashboard stats ─────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  const baseMatch = { softDeleted: false };

  const [
    total,
    published,
    featured,
    homepage,
    videoCount,
    trashCount,
    ratingAgg,
  ] = await Promise.all([
    Testimonial.countDocuments(baseMatch),
    Testimonial.countDocuments({ ...baseMatch, isPublished: true }),
    Testimonial.countDocuments({ ...baseMatch, isFeatured: true }),
    Testimonial.countDocuments({ ...baseMatch, showOnHomepage: true }),
    Testimonial.countDocuments({ ...baseMatch, testimonialType: "video" }),
    Testimonial.countDocuments({ softDeleted: true }),
    Testimonial.aggregate([
      { $match: { ...baseMatch, isPublished: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          ratings: { $push: "$rating" },
        },
      },
    ]),
  ]);

  // Rating distribution breakdown (1–5)
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (ratingAgg[0]?.ratings) {
    ratingAgg[0].ratings.forEach((r) => {
      const key = Math.round(r);
      if (ratingDistribution[key] !== undefined) ratingDistribution[key]++;
    });
  }

  const recentTestimonials = await Testimonial.find({ softDeleted: false })
    .select("fullName companyName designation rating isPublished isFeatured profileImage createdAt testimonialType")
    .sort("-createdAt")
    .limit(5);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        published,
        featured,
        homepage,
        videoCount,
        trashCount,
        averageRating: ratingAgg[0]?.averageRating
          ? Math.round(ratingAgg[0].averageRating * 10) / 10
          : 0,
        ratingDistribution,
        recentTestimonials,
      },
      "Stats fetched successfully"
    )
  );
};

// ── Admin: Get single by ID ────────────────────────────────────────────────────
exports.getTestimonialById = async (req, res) => {
  const testimonial = await Testimonial.findOne({
    _id: req.params.id,
    softDeleted: false,
  })
    .populate("createdBy", "name email profileImage")
    .populate("updatedBy", "name email");

  if (!testimonial) throw new ApiError(404, "Testimonial not found");

  return res
    .status(200)
    .json(new ApiResponse(200, testimonial, "Testimonial fetched successfully"));
};

// ── Admin: Create ──────────────────────────────────────────────────────────────
exports.createTestimonial = async (req, res) => {
  const data = {
    ...req.body,
    createdBy: req.user._id,
  };

  const testimonial = await Testimonial.create(data);

  return res
    .status(201)
    .json(new ApiResponse(201, testimonial, "Testimonial created successfully"));
};

// ── Admin: Update ──────────────────────────────────────────────────────────────
exports.updateTestimonial = async (req, res) => {
  const existing = await Testimonial.findOne({
    _id: req.params.id,
    softDeleted: false,
  });
  if (!existing) throw new ApiError(404, "Testimonial not found");

  const updates = { ...req.body, updatedBy: req.user._id };

  const updated = await Testimonial.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate("createdBy", "name email profileImage");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Testimonial updated successfully"));
};

// ── Admin: Soft delete ─────────────────────────────────────────────────────────
exports.softDeleteTestimonial = async (req, res) => {
  const testimonial = await Testimonial.findOne({
    _id: req.params.id,
    softDeleted: false,
  });
  if (!testimonial) throw new ApiError(404, "Testimonial not found");

  await Testimonial.findByIdAndUpdate(req.params.id, {
    $set: {
      softDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user._id,
    },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Testimonial moved to trash"));
};

// ── Admin: Restore from trash ──────────────────────────────────────────────────
exports.restoreTestimonial = async (req, res) => {
  const testimonial = await Testimonial.findOne({
    _id: req.params.id,
    softDeleted: true,
  });
  if (!testimonial) throw new ApiError(404, "Testimonial not found in trash");

  await Testimonial.findByIdAndUpdate(req.params.id, {
    $set: { softDeleted: false, deletedAt: null, deletedBy: null },
  });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Testimonial restored successfully"));
};

// ── Admin: Permanent delete ────────────────────────────────────────────────────
exports.permanentDelete = async (req, res) => {
  const testimonial = await Testimonial.findOneAndDelete({
    _id: req.params.id,
    softDeleted: true,
  });
  if (!testimonial) throw new ApiError(404, "Testimonial not found in trash");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Testimonial permanently deleted"));
};

// ── Admin: Bulk soft-delete ────────────────────────────────────────────────────
exports.bulkDelete = async (req, res) => {
  const { ids } = req.body;

  const result = await Testimonial.updateMany(
    { _id: { $in: ids }, softDeleted: false },
    {
      $set: {
        softDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
      },
    }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { affected: result.modifiedCount },
      `${result.modifiedCount} testimonial(s) moved to trash`
    )
  );
};

// ── Admin: Bulk publish / unpublish ───────────────────────────────────────────
exports.bulkPublish = async (req, res) => {
  const { ids, isPublished } = req.body;

  const result = await Testimonial.updateMany(
    { _id: { $in: ids }, softDeleted: false },
    { $set: { isPublished, updatedBy: req.user._id } }
  );

  const verb = isPublished ? "published" : "unpublished";
  return res.status(200).json(
    new ApiResponse(
      200,
      { affected: result.modifiedCount },
      `${result.modifiedCount} testimonial(s) ${verb}`
    )
  );
};

// ── Admin: Bulk feature / unfeature ───────────────────────────────────────────
exports.bulkFeature = async (req, res) => {
  const { ids, isFeatured } = req.body;

  const result = await Testimonial.updateMany(
    { _id: { $in: ids }, softDeleted: false },
    { $set: { isFeatured, updatedBy: req.user._id } }
  );

  const verb = isFeatured ? "featured" : "unfeatured";
  return res.status(200).json(
    new ApiResponse(
      200,
      { affected: result.modifiedCount },
      `${result.modifiedCount} testimonial(s) ${verb}`
    )
  );
};

// ── Admin: Bulk restore from trash ────────────────────────────────────────────
exports.bulkRestore = async (req, res) => {
  const { ids } = req.body;

  const result = await Testimonial.updateMany(
    { _id: { $in: ids }, softDeleted: true },
    { $set: { softDeleted: false, deletedAt: null, deletedBy: null } }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { affected: result.modifiedCount },
      `${result.modifiedCount} testimonial(s) restored`
    )
  );
};

// ── Admin: Bulk permanent delete from trash ───────────────────────────────────
exports.bulkPermanentDelete = async (req, res) => {
  const { ids } = req.body;

  const result = await Testimonial.deleteMany({
    _id: { $in: ids },
    softDeleted: true,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { affected: result.deletedCount },
      `${result.deletedCount} testimonial(s) permanently deleted`
    )
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC APIs — Only published, non-deleted. PII fields excluded.
// ══════════════════════════════════════════════════════════════════════════════

const PUBLIC_SELECT =
  "fullName designation companyName companyLogo profileImage testimonialText shortSummary rating socialLinks location testimonialType videoUrl videoThumbnail verifiedStatus isFeatured isPinned displayOrder createdAt";

const PUBLIC_MATCH = { softDeleted: false, isPublished: true };

// ── Public: Featured testimonials ─────────────────────────────────────────────
exports.getPublicFeatured = async (req, res) => {
  const { limit = 6 } = req.query;

  const testimonials = await Testimonial.find({
    ...PUBLIC_MATCH,
    isFeatured: true,
  })
    .select(PUBLIC_SELECT)
    .sort("-isPinned displayOrder -createdAt")
    .limit(Math.min(Number(limit), 50));

  return res
    .status(200)
    .json(new ApiResponse(200, testimonials, "Featured testimonials fetched"));
};

// ── Public: Homepage testimonials ─────────────────────────────────────────────
exports.getPublicHomepage = async (req, res) => {
  const { limit = 8 } = req.query;

  const testimonials = await Testimonial.find({
    ...PUBLIC_MATCH,
    showOnHomepage: true,
  })
    .select(PUBLIC_SELECT)
    .sort("-isPinned displayOrder -createdAt")
    .limit(Math.min(Number(limit), 50));

  return res
    .status(200)
    .json(new ApiResponse(200, testimonials, "Homepage testimonials fetched"));
};

// ── Public: Full testimonial wall (paginated) ──────────────────────────────────
exports.getPublicWall = async (req, res) => {
  const {
    page = 1,
    limit = 12,
    category,
    testimonialType,
    minRating,
    sort = "-isPinned displayOrder -createdAt",
  } = req.query;

  const query = { ...PUBLIC_MATCH };
  if (category) query.category = category;
  if (testimonialType) query.testimonialType = testimonialType;
  if (minRating) query.rating = { $gte: Number(minRating) };

  const [testimonials, total] = await Promise.all([
    Testimonial.find(query)
      .select(PUBLIC_SELECT)
      .sort(sort)
      .limit(Math.min(Number(limit), 50))
      .skip((Number(page) - 1) * Number(limit)),
    Testimonial.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        testimonials,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Testimonial wall fetched"
    )
  );
};

// ── Public: Aggregated stats for frontend ─────────────────────────────────────
exports.getPublicStats = async (req, res) => {
  const [total, agg] = await Promise.all([
    Testimonial.countDocuments(PUBLIC_MATCH),
    Testimonial.aggregate([
      { $match: PUBLIC_MATCH },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total,
        averageRating: agg[0]?.avg
          ? Math.round(agg[0].avg * 10) / 10
          : 0,
      },
      "Public stats fetched"
    )
  );
};

// ── Public: Latest testimonials ───────────────────────────────────────────────
exports.getPublicLatest = async (req, res) => {
  const { limit = 5 } = req.query;

  const testimonials = await Testimonial.find(PUBLIC_MATCH)
    .select(PUBLIC_SELECT)
    .sort("-createdAt")
    .limit(Math.min(Number(limit), 20));

  return res
    .status(200)
    .json(new ApiResponse(200, testimonials, "Latest testimonials fetched"));
};

// ── Public: Random testimonials (for carousels) ───────────────────────────────
exports.getPublicRandom = async (req, res) => {
  const { limit = 4 } = req.query;

  const testimonials = await Testimonial.aggregate([
    { $match: PUBLIC_MATCH },
    { $sample: { size: Math.min(Number(limit), 20) } },
    {
      $project: {
        fullName: 1,
        designation: 1,
        companyName: 1,
        companyLogo: 1,
        profileImage: 1,
        testimonialText: 1,
        shortSummary: 1,
        rating: 1,
        testimonialType: 1,
        verifiedStatus: 1,
        isFeatured: 1,
        createdAt: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, testimonials, "Random testimonials fetched"));
};

// ── Public: Testimonials by category ──────────────────────────────────────────
exports.getPublicByCategory = async (req, res) => {
  const { limit = 10 } = req.query;
  const { category } = req.params;

  const testimonials = await Testimonial.find({
    ...PUBLIC_MATCH,
    category,
  })
    .select(PUBLIC_SELECT)
    .sort("-isPinned displayOrder -createdAt")
    .limit(Math.min(Number(limit), 50));

  return res
    .status(200)
    .json(new ApiResponse(200, testimonials, "Category testimonials fetched"));
};

// ── Public: Testimonials by minimum rating ─────────────────────────────────────
exports.getPublicByRating = async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const minRating = Math.min(Math.max(Number(req.params.rating), 1), 5);

  const query = { ...PUBLIC_MATCH, rating: { $gte: minRating } };

  const [testimonials, total] = await Promise.all([
    Testimonial.find(query)
      .select(PUBLIC_SELECT)
      .sort("-rating -isPinned displayOrder -createdAt")
      .limit(Math.min(Number(limit), 50))
      .skip((Number(page) - 1) * Number(limit)),
    Testimonial.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        testimonials,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      `Testimonials with rating ≥ ${minRating} fetched`
    )
  );
};
