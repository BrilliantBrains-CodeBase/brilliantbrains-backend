const Job = require("../models/Job.model");
const JobApplication = require("../models/JobApplication.model");
const ApiResponse = require("../utils/ApiResponse");

exports.getDashboardStats = async (req, res) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalJobs,
    activeJobs,
    draftJobs,
    closedJobs,
    archivedJobs,
    totalApplications,
    shortlistedCount,
    interviewScheduledCount,
    selectedCount,
    rejectedCount,
    newThisWeek,
    recentApplications,
    monthlyBreakdown,
    sourceBreakdown,
    statusBreakdown,
    topJobs,
  ] = await Promise.all([
    Job.countDocuments(),
    Job.countDocuments({ status: "published" }),
    Job.countDocuments({ status: "draft" }),
    Job.countDocuments({ status: "closed" }),
    Job.countDocuments({ status: "archived" }),
    JobApplication.countDocuments(),
    JobApplication.countDocuments({ shortlisted: true }),
    JobApplication.countDocuments({ status: "interview_scheduled" }),
    JobApplication.countDocuments({ status: "selected" }),
    JobApplication.countDocuments({ status: "rejected" }),
    JobApplication.countDocuments({
      appliedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    // Latest 10 applications with job info
    JobApplication.find()
      .populate("job", "title jobId department")
      .sort("-appliedAt")
      .limit(10)
      .select("applicationId firstName lastName email status appliedAt job shortlisted"),
    // Monthly applications for the past 6 months
    JobApplication.aggregate([
      { $match: { appliedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$appliedAt" },
            month: { $month: "$appliedAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    // Source breakdown
    JobApplication.aggregate([
      { $match: { source: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    // Status distribution
    JobApplication.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // Top 5 jobs by application volume
    Job.find({ status: "published" })
      .sort("-applicationsCount")
      .limit(5)
      .select("title jobId department applicationsCount shortlistedCount viewsCount location"),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        overview: {
          totalJobs,
          activeJobs,
          draftJobs,
          closedJobs,
          archivedJobs,
          totalApplications,
          shortlistedCount,
          interviewScheduledCount,
          selectedCount,
          rejectedCount,
          newThisWeek,
        },
        recentApplications,
        monthlyBreakdown,
        sourceBreakdown,
        statusBreakdown,
        topJobs,
      },
      "Dashboard data fetched"
    )
  );
};
