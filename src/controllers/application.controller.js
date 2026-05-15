const path = require("path");
const fs = require("fs");
const JobApplication = require("../models/JobApplication.model");
const Job = require("../models/Job.model");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");

// @desc  Submit application (public)
exports.submitApplication = async (req, res) => {
  const {
    jobId,
    firstName,
    lastName,
    email,
    phone,
    currentLocation,
    experience,
    currentCompany,
    currentCTC,
    expectedCTC,
    noticePeriod,
    portfolio,
    linkedin,
    github,
    coverLetter,
    skills,
    source,
    utmSource,
    utmCampaign,
  } = req.body;

  if (!firstName || !lastName || !email) {
    throw new ApiError(400, "First name, last name, and email are required");
  }

  // Resolve job by ObjectId or human jobId string
  const job = await Job.findOne({
    $or: [
      ...(jobId && jobId.length === 24 ? [{ _id: jobId }] : []),
      { jobId },
      { slug: jobId },
    ],
    status: "published",
    acceptingApplications: true,
  });
  if (!job) throw new ApiError(404, "Job not found or not accepting applications");

  // Duplicate guard
  const existing = await JobApplication.findOne({
    job: job._id,
    email: email.toLowerCase().trim(),
  });
  if (existing)
    throw new ApiError(400, "You have already applied for this position");

  // Max applications guard
  if (job.maxApplications && job.applicationsCount >= job.maxApplications) {
    throw new ApiError(400, "This position has reached its maximum number of applications");
  }

  // Resume
  let resumeUrl, resumeFileName, resumeMimeType, resumeFileSize;
  if (req.file) {
    resumeUrl = `/uploads/resumes/${req.file.filename}`;
    resumeFileName = req.file.originalname;
    resumeMimeType = req.file.mimetype;
    resumeFileSize = req.file.size;
  }

  const parsedSkills = Array.isArray(skills)
    ? skills
    : skills
    ? String(skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const application = await JobApplication.create({
    job: job._id,
    jobId: job.jobId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase().trim(),
    phone,
    currentLocation,
    experience: experience ? Number(experience) : undefined,
    currentCompany,
    currentCTC: currentCTC ? Number(currentCTC) : undefined,
    expectedCTC: expectedCTC ? Number(expectedCTC) : undefined,
    noticePeriod: noticePeriod ? Number(noticePeriod) : undefined,
    portfolio,
    linkedin,
    github,
    coverLetter,
    skills: parsedSkills,
    resumeUrl,
    resumeFileName,
    resumeMimeType,
    resumeFileSize,
    source,
    utmSource,
    utmCampaign,
  });

  // Update job stats and push to recentApplicants snapshot (keep last 5)
  await Job.findByIdAndUpdate(job._id, {
    $inc: { applicationsCount: 1 },
    $push: {
      recentApplicants: {
        $each: [
          {
            applicantId: application._id,
            name: `${firstName} ${lastName}`,
            email: email.toLowerCase().trim(),
            appliedAt: new Date(),
            status: "applied",
          },
        ],
        $slice: -5,
      },
    },
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      { applicationId: application.applicationId },
      "Application submitted successfully. We will get back to you soon!"
    )
  );
};

// @desc  Get all applications (admin)
exports.getAllApplications = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    shortlisted,
    jobId,
    search,
    sort = "-appliedAt",
    source,
    from,
    to,
  } = req.query;

  const query = {};
  if (status) query.status = status;
  if (shortlisted !== undefined) query.shortlisted = shortlisted === "true";
  if (source) query.source = { $regex: source, $options: "i" };

  if (jobId) {
    if (jobId.startsWith("JOB-")) {
      const job = await Job.findOne({ jobId }).select("_id");
      if (job) query.job = job._id;
      else query.job = null; // force 0 results for unknown jobId
    } else {
      query.job = jobId;
    }
  }

  if (from || to) {
    query.appliedAt = {};
    if (from) query.appliedAt.$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query.appliedAt.$lte = toDate;
    }
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { applicationId: { $regex: search, $options: "i" } },
      { currentCompany: { $regex: search, $options: "i" } },
      { skills: { $regex: search, $options: "i" } },
    ];
  }

  const [applications, total] = await Promise.all([
    JobApplication.find(query)
      .populate("job", "title jobId department location")
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    JobApplication.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        applications,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Applications fetched successfully"
    )
  );
};

// @desc  Get applications for a specific job (admin)
exports.getApplicationsByJob = async (req, res) => {
  const { status, sort = "-appliedAt", page = 1, limit = 20 } = req.query;

  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const query = { job: req.params.jobId };
  if (status) query.status = status;

  const [applications, total] = await Promise.all([
    JobApplication.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit)),
    JobApplication.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        job: {
          _id: job._id,
          title: job.title,
          jobId: job.jobId,
          department: job.department,
        },
        applications,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Applications fetched"
    )
  );
};

// @desc  Get single application (admin)
exports.getApplicationById = async (req, res) => {
  const application = await JobApplication.findById(req.params.id).populate(
    "job",
    "title jobId department location employmentType workplaceType"
  );
  if (!application) throw new ApiError(404, "Application not found");
  return res.status(200).json(new ApiResponse(200, application, "Application fetched"));
};

// @desc  Update application status (admin)
exports.updateStatus = async (req, res) => {
  const { status, rejectionReason, interviewDate, interviewNotes } = req.body;

  const VALID_STATUSES = [
    "applied",
    "screening",
    "shortlisted",
    "interview_scheduled",
    "interviewed",
    "selected",
    "rejected",
    "on_hold",
  ];
  if (!VALID_STATUSES.includes(status)) throw new ApiError(400, "Invalid status value");

  const application = await JobApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const wasShortlisted = application.shortlisted;

  const updates = { status };
  if (status === "rejected" && rejectionReason) updates.rejectionReason = rejectionReason;
  if (status === "interview_scheduled" && interviewDate) {
    updates.interviewDate = new Date(interviewDate);
  }
  if (interviewNotes) updates.interviewNotes = interviewNotes;

  // Sync shortlisted flag with status
  if (status === "shortlisted") updates.shortlisted = true;
  if (["rejected", "on_hold", "applied", "screening"].includes(status)) {
    updates.shortlisted = false;
  }

  const updated = await JobApplication.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true }
  );

  // Keep job shortlistedCount in sync
  const nowShortlisted = updated.shortlisted;
  if (!wasShortlisted && nowShortlisted) {
    await Job.findByIdAndUpdate(application.job, { $inc: { shortlistedCount: 1 } });
  } else if (wasShortlisted && !nowShortlisted) {
    await Job.findByIdAndUpdate(application.job, { $inc: { shortlistedCount: -1 } });
  }

  return res.status(200).json(new ApiResponse(200, updated, "Status updated"));
};

// @desc  Add / update HR notes (admin)
exports.updateHRNotes = async (req, res) => {
  const { hrNotes } = req.body;
  const updated = await JobApplication.findByIdAndUpdate(
    req.params.id,
    { $set: { hrNotes } },
    { new: true }
  );
  if (!updated) throw new ApiError(404, "Application not found");
  return res.status(200).json(new ApiResponse(200, updated, "Notes saved"));
};

// @desc  Toggle shortlist (admin)
exports.toggleShortlist = async (req, res) => {
  const application = await JobApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const newShortlisted = !application.shortlisted;
  const newStatus = newShortlisted ? "shortlisted" : "screening";

  const updated = await JobApplication.findByIdAndUpdate(
    req.params.id,
    { $set: { shortlisted: newShortlisted, status: newStatus } },
    { new: true }
  );

  await Job.findByIdAndUpdate(application.job, {
    $inc: { shortlistedCount: newShortlisted ? 1 : -1 },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      updated,
      newShortlisted ? "Candidate shortlisted" : "Removed from shortlist"
    )
  );
};

// @desc  Delete application (admin)
exports.deleteApplication = async (req, res) => {
  const application = await JobApplication.findByIdAndDelete(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  // Delete resume file from disk
  if (application.resumeUrl) {
    try {
      const filePath = path.join(process.cwd(), "public", application.resumeUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.warn("[Application] Could not delete resume file:", err.message);
    }
  }

  // Decrement job counters
  const counterUpdate = { $inc: { applicationsCount: -1 } };
  if (application.shortlisted) {
    counterUpdate.$inc.shortlistedCount = -1;
  }
  await Job.findByIdAndUpdate(application.job, counterUpdate);

  return res.status(200).json(new ApiResponse(200, null, "Application deleted"));
};

// @desc  Export applications as CSV (admin)
exports.exportApplications = async (req, res) => {
  const { jobId, status } = req.query;
  const query = {};
  if (jobId) query.job = jobId;
  if (status) query.status = status;

  const applications = await JobApplication.find(query)
    .populate("job", "title jobId department")
    .lean();

  const headers = [
    "Application ID",
    "Job Title",
    "Job ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Experience (yrs)",
    "Current Company",
    "Expected CTC",
    "Notice Period (days)",
    "Status",
    "Shortlisted",
    "Source",
    "Applied At",
  ];

  const rows = applications.map((a) => [
    a.applicationId,
    `"${(a.job?.title || "").replace(/"/g, '""')}"`,
    a.job?.jobId || "",
    a.firstName,
    a.lastName,
    a.email,
    a.phone || "",
    a.experience ?? "",
    `"${(a.currentCompany || "").replace(/"/g, '""')}"`,
    a.expectedCTC ?? "",
    a.noticePeriod ?? "",
    a.status,
    a.shortlisted ? "Yes" : "No",
    a.source || "",
    new Date(a.appliedAt).toISOString().split("T")[0],
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="applications-${Date.now()}.csv"`
  );
  return res.send(csv);
};
