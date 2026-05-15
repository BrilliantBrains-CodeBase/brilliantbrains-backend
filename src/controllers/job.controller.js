const Job = require("../models/Job.model");
const JobApplication = require("../models/JobApplication.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

const slugify = (str) =>
  str.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// Fields the client is allowed to write — protects analytics/system fields
const WRITABLE_FIELDS = [
  "title", "slug", "department", "team", "location",
  "employmentType", "workplaceType", "openings",
  "minExperience", "maxExperience", "experienceLabel",
  "shortDescription", "jobDescription",
  "keyResponsibilities", "requirements", "preferredSkills",
  "qualifications", "benefits", "techStack",
  "salaryMin", "salaryMax", "currency", "hideSalary",
  "seo", "status", "acceptingApplications", "maxApplications",
  "validTill", "featured", "priority", "tags", "hiringManager",
];

const pick = (obj, fields) =>
  fields.reduce((acc, f) => {
    if (f in obj) acc[f] = obj[f];
    return acc;
  }, {});

// @desc  Get all jobs — public sees published only; admins can filter by any status
exports.getAllJobs = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    department,
    location,
    employmentType,
    workplaceType,
    featured,
    search,
    sort = "-createdAt",
    jobId,
    tag,
  } = req.query;

  const isAdmin = req.user && ["admin", "super_admin"].includes(req.user.role);
  const filter = {};

  if (isAdmin && status) {
    filter.status = status;
  } else if (!isAdmin) {
    filter.status = "published";
    filter.acceptingApplications = true;
  }

  if (department) filter.department = { $regex: department, $options: "i" };
  if (location) filter.location = { $regex: location, $options: "i" };
  if (employmentType) filter.employmentType = employmentType;
  if (workplaceType) filter.workplaceType = workplaceType;
  if (featured !== undefined) filter.featured = featured === "true";
  if (jobId) filter.jobId = { $regex: jobId, $options: "i" };
  if (tag) filter.tags = { $in: [tag] };

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { techStack: { $regex: search, $options: "i" } },
      { jobId: { $regex: search, $options: "i" } },
    ];
  }

  // Build Mongoose query — avoid passing null/undefined to .select() or .populate()
  let jobQuery = Job.find(filter);

  if (!isAdmin) {
    jobQuery = jobQuery.select("-hiringManager -recentApplicants -seo");
  }

  if (isAdmin) {
    jobQuery = jobQuery.populate("hiringManager", "name email");
  }

  const [jobs, total] = await Promise.all([
    jobQuery
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    Job.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        jobs,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Jobs fetched successfully"
    )
  );
};

// @desc  Get single job by slug (public — published only)
exports.getJobBySlug = async (req, res) => {
  const job = await Job.findOneAndUpdate(
    { slug: req.params.slug, status: "published" },
    { $inc: { viewsCount: 1 } },
    { new: true }
  );
  if (!job) throw new ApiError(404, "Job not found or not available");
  return res.status(200).json(new ApiResponse(200, job, "Job fetched successfully"));
};

// @desc  Get single job by ID (admin)
exports.getJobById = async (req, res) => {
  const job = await Job.findById(req.params.id).populate("hiringManager", "name email");
  if (!job) throw new ApiError(404, "Job not found");
  return res.status(200).json(new ApiResponse(200, job, "Job fetched successfully"));
};

// @desc  Create job
exports.createJob = async (req, res) => {
  const body = pick(req.body, WRITABLE_FIELDS);
  const { title, slug, ...rest } = body;

  if (!title || !title.trim()) throw new ApiError(400, "Title is required");

  const finalSlug = slug ? slug.toLowerCase().trim() : slugify(title);
  if (!finalSlug) throw new ApiError(400, "Could not generate a valid slug from the title");

  const existing = await Job.findOne({ slug: finalSlug });
  if (existing) throw new ApiError(400, "A job with this slug already exists");

  const job = await Job.create({
    ...rest,
    title: title.trim(),
    slug: finalSlug,
    postedAt: rest.status === "published" ? new Date() : undefined,
  });

  return res.status(201).json(new ApiResponse(201, job, "Job created successfully"));
};

// @desc  Update job
exports.updateJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  const updates = pick(req.body, WRITABLE_FIELDS);

  // Auto-set timestamps based on status transitions
  if (updates.status === "published" && !job.postedAt) {
    updates.postedAt = new Date();
  }
  if (updates.status === "closed" && !job.closedAt) {
    updates.closedAt = new Date();
    if (updates.acceptingApplications === undefined) {
      updates.acceptingApplications = false;
    }
  }
  if (updates.status === "archived" && !job.archivedAt) {
    updates.archivedAt = new Date();
    if (updates.acceptingApplications === undefined) {
      updates.acceptingApplications = false;
    }
  }
  // Re-opening a closed/archived job resets its closure timestamps
  if (updates.status === "published") {
    updates.closedAt = null;
    updates.archivedAt = null;
  }

  const updated = await Job.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  return res.status(200).json(new ApiResponse(200, updated, "Job updated successfully"));
};

// @desc  Publish job (convenience endpoint)
exports.publishJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "published",
        postedAt: new Date(),
        acceptingApplications: true,
        closedAt: null,
        archivedAt: null,
      },
    },
    { new: true }
  );
  if (!job) throw new ApiError(404, "Job not found");
  return res.status(200).json(new ApiResponse(200, job, "Job published"));
};

// @desc  Archive job
exports.archiveJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        status: "archived",
        archivedAt: new Date(),
        acceptingApplications: false,
      },
    },
    { new: true }
  );
  if (!job) throw new ApiError(404, "Job not found");
  return res.status(200).json(new ApiResponse(200, job, "Job archived"));
};

// @desc  Duplicate job (creates a draft copy)
exports.duplicateJob = async (req, res) => {
  const source = await Job.findById(req.params.id).lean();
  if (!source) throw new ApiError(404, "Job not found");

  // Pull only schema-safe writable fields; strip system/analytics fields
  const safeFields = pick(source, WRITABLE_FIELDS);

  const duplicate = await Job.create({
    ...safeFields,
    title: `${source.title} (Copy)`,
    slug: `${source.slug}-copy-${Date.now()}`,
    status: "draft",
    acceptingApplications: true,
    viewsCount: 0,
    applicationsCount: 0,
    shortlistedCount: 0,
    recentApplicants: [],
    postedAt: null,
    closedAt: null,
    archivedAt: null,
  });

  return res.status(201).json(
    new ApiResponse(201, duplicate, "Job duplicated successfully")
  );
};

// @desc  Delete job and all its applications
exports.deleteJob = async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");

  await JobApplication.deleteMany({ job: req.params.id });

  return res.status(200).json(new ApiResponse(200, null, "Job deleted successfully"));
};
