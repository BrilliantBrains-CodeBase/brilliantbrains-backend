/**
 * Seed script for the Careers module.
 * Creates realistic jobs and applications for development/testing.
 *
 * ⚠️  Clears all existing jobs and applications before seeding.
 *     Never wire to server start — run manually: npm run seed:careers
 */

const mongoose = require("mongoose");
const Job = require("../models/Job.model");
const JobApplication = require("../models/JobApplication.model");
const { logger } = require("../utils/logger");

// ── Helpers ────────────────────────────────────────────────────────────────────
let _seq = 0;

const makeJobId = () => {
  _seq++;
  return `JOB-${Math.floor(Date.now() / 1000) + _seq}-${1000 + (_seq * 37) % 9000}`;
};

const makeAppId = () => {
  _seq++;
  return `APP-${Math.floor(Date.now() / 1000) + _seq}-${1000 + (_seq * 53) % 9000}`;
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
const monthsFrom = (date, m) => { const d = new Date(date); d.setMonth(d.getMonth() + m); return d; };

// ── Job definitions ────────────────────────────────────────────────────────────
const JOB_DEFS = [
  {
    title: "Full Stack Developer",
    department: "Engineering",
    team: "Product",
    location: "Bangalore, India",
    employmentType: "full-time",
    workplaceType: "hybrid",
    openings: 3,
    minExperience: 2, maxExperience: 5, experienceLabel: "2–5 years",
    shortDescription: "Build and maintain scalable web applications using React, Node.js, and cloud-native architectures.",
    jobDescription: "<p>We are looking for a talented Full Stack Developer to join our growing engineering team. You will work on both frontend and backend systems, shipping features end-to-end.</p><p>You'll collaborate closely with designers, product managers, and other engineers to deliver high-quality software on time.</p>",
    keyResponsibilities: [
      "Develop and maintain full-stack web applications",
      "Write clean, testable, well-documented code",
      "Participate in code reviews and technical discussions",
      "Collaborate with design and product teams",
      "Monitor application performance and resolve bugs",
    ],
    requirements: [
      "2+ years of full-stack development experience",
      "Strong proficiency in React and Node.js",
      "Experience with MongoDB or PostgreSQL",
      "Familiarity with REST API design principles",
      "Comfortable with Git and GitHub workflows",
    ],
    preferredSkills: ["TypeScript", "Docker", "AWS or GCP", "Redis", "GraphQL"],
    qualifications: ["B.Tech / B.E. in Computer Science or related field"],
    benefits: ["Competitive salary", "Health insurance", "Flexible work hours", "₹30,000 annual learning budget", "Performance bonus"],
    techStack: ["React", "Node.js", "MongoDB", "Express", "AWS", "Tailwind CSS"],
    salaryMin: 600000, salaryMax: 1200000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: true, priority: 10,
    tags: ["engineering", "fullstack", "react", "nodejs"],
    validTill: daysFrom(60), postedAt: daysAgo(15),
  },
  {
    title: "React Frontend Developer",
    department: "Engineering",
    team: "Frontend",
    location: "Remote",
    employmentType: "full-time",
    workplaceType: "remote",
    openings: 2,
    minExperience: 1, maxExperience: 3, experienceLabel: "1–3 years",
    shortDescription: "Craft pixel-perfect, performant user interfaces with React, TypeScript, and Tailwind CSS.",
    jobDescription: "<p>We're hiring a Frontend Developer to build beautiful, responsive web interfaces. You care deeply about UX, performance, and code quality.</p><p>You'll work fully remote with a collaborative team and ship meaningful product improvements every sprint.</p>",
    keyResponsibilities: [
      "Build responsive UI components with React and Tailwind CSS",
      "Integrate REST APIs and manage application state",
      "Ensure cross-browser compatibility and accessibility",
      "Optimize performance and Core Web Vitals",
      "Work closely with designers to implement Figma designs accurately",
    ],
    requirements: [
      "1+ years of hands-on React experience",
      "Strong HTML, CSS, and JavaScript fundamentals",
      "Experience with state management (Redux, Zustand, or React Context)",
      "Comfortable with Git",
    ],
    preferredSkills: ["TypeScript", "Tailwind CSS", "Framer Motion", "Figma", "Vite"],
    qualifications: ["Degree in Computer Science or demonstrable equivalent experience"],
    benefits: ["Fully remote", "Home office setup allowance", "Health coverage", "Flexible hours"],
    techStack: ["React", "TypeScript", "Tailwind CSS", "Vite", "Zustand"],
    salaryMin: 400000, salaryMax: 800000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: false, priority: 5,
    tags: ["frontend", "react", "remote", "typescript"],
    validTill: daysFrom(45), postedAt: daysAgo(10),
  },
  {
    title: "UI/UX Designer",
    department: "Design",
    team: "Product Design",
    location: "Bangalore, India",
    employmentType: "full-time",
    workplaceType: "hybrid",
    openings: 1,
    minExperience: 2, maxExperience: 4, experienceLabel: "2–4 years",
    shortDescription: "Design intuitive, beautiful user experiences for web and mobile products that genuinely delight users.",
    jobDescription: "<p>Join our design team to create user-centred experiences across our product suite. You will own the design process end-to-end — from discovery and research to high-fidelity prototypes and dev handoff.</p>",
    keyResponsibilities: [
      "Conduct user research and synthesise insights",
      "Create wireframes, user flows, and high-fidelity prototypes",
      "Maintain and evolve the company design system",
      "Collaborate with engineers to achieve pixel-perfect implementation",
      "Run usability testing sessions and iterate based on feedback",
    ],
    requirements: [
      "2+ years of product design experience",
      "Expert-level Figma skills",
      "Portfolio showing end-to-end design projects with measurable outcomes",
      "Good understanding of front-end constraints",
    ],
    preferredSkills: ["Motion design", "User research methods", "Design tokens", "WCAG accessibility"],
    qualifications: ["Degree in Design, HCI, or equivalent portfolio"],
    benefits: ["Creative environment", "Latest design tools provided", "₹20,000 conference budget", "Health insurance"],
    techStack: ["Figma", "FigJam", "Principle", "Zeroheight"],
    salaryMin: 500000, salaryMax: 1000000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: true, priority: 8,
    tags: ["design", "ux", "product", "figma"],
    validTill: daysFrom(30), postedAt: daysAgo(20),
  },
  {
    title: "Digital Marketing Manager",
    department: "Marketing",
    team: "Growth",
    location: "Bangalore, India",
    employmentType: "full-time",
    workplaceType: "onsite",
    openings: 1,
    minExperience: 3, maxExperience: 6, experienceLabel: "3–6 years",
    shortDescription: "Lead multi-channel digital campaigns to drive brand awareness, lead generation, and revenue growth.",
    jobDescription: "<p>We are looking for a Digital Marketing Manager to own our online presence and growth strategy. You will manage SEO, paid ads, content, and social channels with a focus on ROI.</p>",
    keyResponsibilities: [
      "Develop and execute digital marketing strategies across all channels",
      "Manage Google Ads, Meta Ads, and LinkedIn campaigns",
      "Oversee SEO strategy and content calendar",
      "Track KPIs, ROAS, and attribution; present monthly reports",
      "Manage a small team of content creators and designers",
    ],
    requirements: [
      "3+ years of digital marketing experience",
      "Hands-on experience with Google Ads and Meta Ads Manager",
      "Strong analytical skills with GA4 and Looker Studio",
      "Proven track record managing marketing budgets",
    ],
    preferredSkills: ["HubSpot", "Semrush or Ahrefs", "Marketing automation", "Video marketing"],
    qualifications: ["MBA in Marketing or B.Tech + relevant certifications"],
    benefits: ["Performance bonus", "Health insurance", "₹25,000 professional development budget"],
    techStack: ["Google Analytics 4", "Google Ads", "Meta Ads", "HubSpot", "Semrush"],
    salaryMin: 700000, salaryMax: 1400000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: false, priority: 6,
    tags: ["marketing", "growth", "digital", "seo"],
    validTill: daysFrom(40), postedAt: daysAgo(8),
  },
  {
    title: "Content Writer & Strategist",
    department: "Content",
    team: "Marketing",
    location: "Remote",
    employmentType: "full-time",
    workplaceType: "remote",
    openings: 2,
    minExperience: 1, maxExperience: 3, experienceLabel: "1–3 years",
    shortDescription: "Create compelling blogs, case studies, and social content that drives organic traffic and brand credibility.",
    jobDescription: "<p>Join our content team to tell the Brilliant Brains story. You will write blogs, website copy, case studies, and social content that resonates with our tech-savvy audience.</p>",
    keyResponsibilities: [
      "Research and write SEO-optimised blog posts (2–3 per week)",
      "Write website copy, case studies, and whitepapers",
      "Develop monthly content calendars and briefs",
      "Collaborate with the design team for visual content",
      "Track content performance and iterate based on data",
    ],
    requirements: [
      "1+ years of content writing experience",
      "Excellent written English",
      "Basic understanding of on-page SEO",
      "Ability to simplify complex technical topics",
    ],
    preferredSkills: ["WordPress", "Semrush or Ahrefs", "Grammarly Pro", "Basic HTML"],
    qualifications: ["Bachelor's degree in English, Journalism, Mass Communication, or related field"],
    benefits: ["Fully remote", "Flexible hours", "₹15,000 skill development budget"],
    techStack: ["WordPress", "Notion", "Semrush", "Canva", "Google Docs"],
    salaryMin: 300000, salaryMax: 600000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: false, priority: 4,
    tags: ["content", "writing", "remote", "seo"],
    validTill: daysFrom(50), postedAt: daysAgo(5),
  },
  {
    title: "DevOps & Cloud Engineer",
    department: "Engineering",
    team: "Infrastructure",
    location: "Bangalore, India",
    employmentType: "full-time",
    workplaceType: "hybrid",
    openings: 1,
    minExperience: 3, maxExperience: 6, experienceLabel: "3–6 years",
    shortDescription: "Architect and maintain our cloud infrastructure on AWS — reliability, security, and cost optimisation at scale.",
    jobDescription: "<p>We're hiring a DevOps Engineer to own our cloud infrastructure and CI/CD pipelines. You will ensure our systems are highly available, secure, and easy to deploy to.</p>",
    keyResponsibilities: [
      "Design and maintain AWS infrastructure using Terraform",
      "Build and improve CI/CD pipelines with GitHub Actions",
      "Monitor system health and set up alerting (CloudWatch, PagerDuty)",
      "Implement security best practices and manage IAM access",
      "Identify and execute cloud cost optimisation opportunities",
    ],
    requirements: [
      "3+ years of DevOps, SRE, or cloud engineering experience",
      "Deep AWS knowledge (EC2, ECS, S3, RDS, Lambda, CloudFront)",
      "Experience with Docker and Kubernetes",
      "Infrastructure-as-code with Terraform or AWS CDK",
    ],
    preferredSkills: ["GitHub Actions", "Prometheus", "Grafana", "HashiCorp Vault", "DataDog"],
    qualifications: ["B.Tech in Computer Science or equivalent; AWS certifications a plus"],
    benefits: ["AWS certification sponsorship", "Health insurance", "Competitive salary", "Hybrid schedule"],
    techStack: ["AWS", "Docker", "Kubernetes", "Terraform", "GitHub Actions", "Prometheus"],
    salaryMin: 900000, salaryMax: 1800000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: true, priority: 9,
    tags: ["devops", "cloud", "aws", "infrastructure"],
    validTill: daysFrom(35), postedAt: daysAgo(12),
  },
  {
    title: "Business Development Executive",
    department: "Sales",
    team: "Growth",
    location: "Bangalore, India",
    employmentType: "full-time",
    workplaceType: "onsite",
    openings: 2,
    minExperience: 1, maxExperience: 3, experienceLabel: "1–3 years",
    shortDescription: "Drive new business by identifying prospects, building relationships, and closing deals for our digital services.",
    jobDescription: "<p>Join our sales team to bring on new clients for Brilliant Brains. You'll prospect, manage the pipeline, and close deals for our web development, design, and digital marketing services.</p>",
    keyResponsibilities: [
      "Identify and qualify new business opportunities",
      "Run outreach campaigns via email, LinkedIn, and calls",
      "Present services and tailor proposals for each prospect",
      "Negotiate contracts and close deals",
      "Maintain accurate CRM records and pipeline hygiene",
    ],
    requirements: [
      "1+ years of B2B sales or business development experience",
      "Strong communication and presentation skills",
      "Comfortable with CRM tools (HubSpot or Salesforce)",
      "Self-motivated with a results-driven mindset",
    ],
    preferredSkills: ["LinkedIn Sales Navigator", "Proposal writing", "Agency or SaaS sales background"],
    qualifications: ["Bachelor's in Business, Marketing, or related field"],
    benefits: ["Base + attractive commission structure", "Health insurance", "Fast growth track"],
    techStack: ["HubSpot CRM", "LinkedIn Sales Navigator", "Google Workspace", "Notion"],
    salaryMin: 350000, salaryMax: 700000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: false, priority: 5,
    tags: ["sales", "business-development", "growth", "b2b"],
    validTill: daysFrom(55), postedAt: daysAgo(3),
  },
  {
    title: "HR & Talent Acquisition Specialist",
    department: "Human Resources",
    team: "People & Culture",
    location: "Bangalore, India",
    employmentType: "full-time",
    workplaceType: "hybrid",
    openings: 1,
    minExperience: 2, maxExperience: 4, experienceLabel: "2–4 years",
    shortDescription: "Own end-to-end talent acquisition and support a thriving people experience at Brilliant Brains.",
    jobDescription: "<p>We're hiring an HR & Talent Specialist to drive our people strategy. You'll own recruiting across all departments, manage onboarding, and support employee experience initiatives.</p>",
    keyResponsibilities: [
      "Drive end-to-end recruitment across all departments",
      "Source, screen, and interview candidates",
      "Manage onboarding for all new hires",
      "Run employee engagement and retention initiatives",
      "Maintain HR records and ensure compliance",
    ],
    requirements: [
      "2+ years of HR or talent acquisition experience",
      "Experience hiring for both technical and non-technical roles",
      "Strong interpersonal and organisational skills",
    ],
    preferredSkills: ["Applicant Tracking Systems", "HR analytics dashboards", "Employer branding"],
    qualifications: ["MBA in HR or equivalent"],
    benefits: ["People-first culture", "Health insurance", "Professional development budget"],
    techStack: ["Lever", "Google Workspace", "Slack", "Notion"],
    salaryMin: 400000, salaryMax: 800000, currency: "INR", hideSalary: true,
    status: "draft", acceptingApplications: false, featured: false, priority: 2,
    tags: ["hr", "talent-acquisition", "people-ops"],
    validTill: daysFrom(90), postedAt: null,
  },
  {
    title: "Node.js Backend Developer",
    department: "Engineering",
    team: "Backend",
    location: "Remote",
    employmentType: "full-time",
    workplaceType: "remote",
    openings: 2,
    minExperience: 2, maxExperience: 5, experienceLabel: "2–5 years",
    shortDescription: "Design and build robust, scalable REST APIs and microservices with Node.js and MongoDB.",
    jobDescription: "<p>We're expanding our backend team and looking for a Node.js developer who cares about clean architecture, performance, and reliability. You'll build the APIs that power our client-facing products.</p>",
    keyResponsibilities: [
      "Design and implement RESTful APIs and microservices",
      "Write performant, well-tested backend code",
      "Model data and optimise MongoDB queries",
      "Integrate third-party services and webhooks",
      "Review code and mentor junior developers",
    ],
    requirements: [
      "2+ years of Node.js backend development",
      "Experience with Express.js or Fastify",
      "Strong MongoDB knowledge — schema design and aggregation pipelines",
      "Understanding of authentication (JWT, OAuth)",
    ],
    preferredSkills: ["TypeScript", "BullMQ or similar queue", "Redis", "Docker", "Jest"],
    qualifications: ["B.Tech in Computer Science or equivalent"],
    benefits: ["Remote-first", "Flexible hours", "Health insurance", "Learning budget"],
    techStack: ["Node.js", "Express", "MongoDB", "Redis", "BullMQ", "Jest"],
    salaryMin: 600000, salaryMax: 1100000, currency: "INR", hideSalary: false,
    status: "published", acceptingApplications: true, featured: false, priority: 7,
    tags: ["backend", "nodejs", "mongodb", "remote"],
    validTill: daysFrom(45), postedAt: daysAgo(7),
  },
  {
    title: "SEO Specialist",
    department: "Marketing",
    team: "Growth",
    location: "Remote",
    employmentType: "full-time",
    workplaceType: "remote",
    openings: 1,
    minExperience: 2, maxExperience: 4, experienceLabel: "2–4 years",
    shortDescription: "Drive organic growth through technical SEO, content optimisation, and link building strategies.",
    jobDescription: "<p>We're looking for an SEO Specialist to grow our organic search presence. You'll own technical audits, keyword strategy, content optimisation, and off-page link building.</p>",
    keyResponsibilities: [
      "Conduct technical SEO audits and fix issues",
      "Perform keyword research and develop content strategies",
      "Optimise on-page elements across the site",
      "Build high-quality backlinks through outreach",
      "Monitor rankings, traffic, and conversions in GA4 and Search Console",
    ],
    requirements: [
      "2+ years of SEO experience (agency or in-house)",
      "Proficiency in Semrush, Ahrefs, or Moz",
      "Understanding of Core Web Vitals and technical SEO",
      "Experience with Google Search Console and GA4",
    ],
    preferredSkills: ["Schema markup", "International SEO", "CMS (WordPress/Webflow)", "Basic HTML/CSS"],
    qualifications: ["Bachelor's in Marketing, IT, or equivalent"],
    benefits: ["Remote work", "Flexible schedule", "Tool subscriptions provided", "Health insurance"],
    techStack: ["Semrush", "Ahrefs", "Google Search Console", "GA4", "Screaming Frog"],
    salaryMin: 400000, salaryMax: 750000, currency: "INR", hideSalary: false,
    status: "closed", acceptingApplications: false, featured: false, priority: 3,
    tags: ["seo", "marketing", "remote", "organic-growth"],
    validTill: daysAgo(5), postedAt: daysAgo(45),
    closedAt: daysAgo(5),
  },
];

// ── Candidate pool ─────────────────────────────────────────────────────────────
// 30 realistic Indian candidates with varied backgrounds
const CANDIDATES = [
  { firstName: "Rahul",    lastName: "Sharma",    email: "rahul.sharma@gmail.com",      phone: "+91 98765 43210", loc: "Bangalore",  exp: 3, co: "InfyTech",       ctc: 700000,  ectc: 1100000, np: 30,  skills: ["React","Node.js","MongoDB","TypeScript","Git"], portfolio: "https://github.com/rahulsharma", linkedin: "https://linkedin.com/in/rahulsharma" },
  { firstName: "Priya",    lastName: "Patel",     email: "priya.patel@gmail.com",       phone: "+91 97654 32109", loc: "Pune",       exp: 2, co: "Webworks",       ctc: 500000,  ectc: 800000,  np: 60,  skills: ["React","Tailwind CSS","Figma","JavaScript","CSS"], portfolio: "https://priyapatel.design", linkedin: "https://linkedin.com/in/priyapatel" },
  { firstName: "Aditya",   lastName: "Kumar",     email: "aditya.kumar@outlook.com",    phone: "+91 96543 21098", loc: "Hyderabad",  exp: 4, co: "CloudBase",      ctc: 900000,  ectc: 1400000, np: 30,  skills: ["AWS","Docker","Kubernetes","Terraform","Linux"], portfolio: "https://github.com/adityakumar", linkedin: "https://linkedin.com/in/adityakumar" },
  { firstName: "Sneha",    lastName: "Gupta",     email: "sneha.gupta@gmail.com",       phone: "+91 95432 10987", loc: "Delhi",      exp: 1, co: "StartupX",       ctc: 350000,  ectc: 550000,  np: 30,  skills: ["Content Writing","SEO","WordPress","Blogging","Social Media"], portfolio: "https://sneha.medium.com", linkedin: "https://linkedin.com/in/snehagupta" },
  { firstName: "Arjun",    lastName: "Singh",     email: "arjun.singh@yahoo.com",       phone: "+91 94321 09876", loc: "Mumbai",     exp: 2, co: "DigitalHive",    ctc: 600000,  ectc: 950000,  np: 45,  skills: ["Google Ads","Meta Ads","SEO","Analytics","HubSpot"], portfolio: "https://arjunsingh.in", linkedin: "https://linkedin.com/in/arjunsingh" },
  { firstName: "Meera",    lastName: "Nair",      email: "meera.nair@gmail.com",        phone: "+91 93210 98765", loc: "Kochi",      exp: 3, co: "Designhub",      ctc: 650000,  ectc: 950000,  np: 30,  skills: ["Figma","User Research","Prototyping","Design Systems","Accessibility"], portfolio: "https://meera.design", linkedin: "https://linkedin.com/in/meeranair" },
  { firstName: "Vivek",    lastName: "Mehta",     email: "vivek.mehta@gmail.com",       phone: "+91 92109 87654", loc: "Bangalore",  exp: 5, co: "TechForge",      ctc: 1100000, ectc: 1700000, np: 30,  skills: ["Node.js","MongoDB","Redis","Docker","PostgreSQL"], portfolio: "https://github.com/vivekmehta", linkedin: "https://linkedin.com/in/vivekmehta" },
  { firstName: "Divya",    lastName: "Reddy",     email: "divya.reddy@outlook.com",     phone: "+91 91098 76543", loc: "Hyderabad",  exp: 2, co: "Craftix",        ctc: 480000,  ectc: 750000,  np: 60,  skills: ["React","Tailwind CSS","TypeScript","Vite","CSS Animations"], portfolio: "https://divyareddy.dev", linkedin: "https://linkedin.com/in/divyareddy" },
  { firstName: "Karan",    lastName: "Joshi",     email: "karan.joshi@gmail.com",       phone: "+91 90987 65432", loc: "Pune",       exp: 4, co: "MarketBoost",    ctc: 850000,  ectc: 1300000, np: 30,  skills: ["Digital Marketing","SEO","Google Ads","HubSpot","Content Strategy"], portfolio: "https://karanjoshi.in", linkedin: "https://linkedin.com/in/karanjoshi" },
  { firstName: "Ananya",   lastName: "Das",       email: "ananya.das@gmail.com",        phone: "+91 89876 54321", loc: "Kolkata",    exp: 1, co: "WriteLab",       ctc: 280000,  ectc: 420000,  np: 15,  skills: ["Content Writing","SEO","Copywriting","WordPress","Research"], portfolio: "https://ananya.medium.com", linkedin: "https://linkedin.com/in/ananyadase" },
  { firstName: "Rohit",    lastName: "Verma",     email: "rohit.verma@gmail.com",       phone: "+91 88765 43210", loc: "Bangalore",  exp: 3, co: "DevStack",       ctc: 750000,  ectc: 1100000, np: 30,  skills: ["React","Node.js","Express","AWS","TypeScript"], portfolio: "https://github.com/rohitverma", linkedin: "https://linkedin.com/in/rohitverma" },
  { firstName: "Shreya",   lastName: "Iyer",      email: "shreya.iyer@gmail.com",       phone: "+91 87654 32109", loc: "Chennai",    exp: 2, co: "CreativeMinds",  ctc: 520000,  ectc: 800000,  np: 45,  skills: ["Figma","Wireframing","User Research","Adobe XD","Usability Testing"], portfolio: "https://shreya-designs.com", linkedin: "https://linkedin.com/in/shreyaiyer" },
  { firstName: "Nikhil",   lastName: "Bose",      email: "nikhil.bose@outlook.com",     phone: "+91 86543 21098", loc: "Mumbai",     exp: 4, co: "CloudNine",      ctc: 950000,  ectc: 1600000, np: 30,  skills: ["AWS","Kubernetes","Terraform","GitHub Actions","Prometheus"], portfolio: "https://github.com/nikhilbose", linkedin: "https://linkedin.com/in/nikhilbose" },
  { firstName: "Pooja",    lastName: "Shetty",    email: "pooja.shetty@gmail.com",      phone: "+91 85432 10987", loc: "Mangalore",  exp: 1, co: "BrandNova",      ctc: 320000,  ectc: 500000,  np: 30,  skills: ["Sales","CRM","LinkedIn Outreach","Communication","Lead Generation"], portfolio: "https://linkedin.com/in/poojashetty", linkedin: "https://linkedin.com/in/poojashetty" },
  { firstName: "Akash",    lastName: "Pillai",    email: "akash.pillai@gmail.com",      phone: "+91 84321 09876", loc: "Trivandrum", exp: 2, co: "SoftEdge",       ctc: 550000,  ectc: 850000,  np: 60,  skills: ["Node.js","MongoDB","Express","REST APIs","Jest"], portfolio: "https://github.com/akashpillai", linkedin: "https://linkedin.com/in/akashpillai" },
  { firstName: "Riya",     lastName: "Shah",      email: "riya.shah@gmail.com",         phone: "+91 83210 98765", loc: "Ahmedabad",  exp: 1, co: "Pixelate",       ctc: 300000,  ectc: 460000,  np: 30,  skills: ["React","JavaScript","HTML","CSS","Figma"], portfolio: "https://riyashah.design", linkedin: "https://linkedin.com/in/riyashah" },
  { firstName: "Siddharth",lastName: "Rao",       email: "siddharth.rao@gmail.com",     phone: "+91 82109 87654", loc: "Bangalore",  exp: 5, co: "Nexus Digital",  ctc: 1200000, ectc: 1800000, np: 30,  skills: ["React","Node.js","AWS","Docker","MongoDB","Redis"], portfolio: "https://github.com/siddharthrao", linkedin: "https://linkedin.com/in/siddharthrao" },
  { firstName: "Nisha",    lastName: "Kapoor",    email: "nisha.kapoor@outlook.com",    phone: "+91 81098 76543", loc: "Delhi",      exp: 3, co: "GrowthLab",      ctc: 720000,  ectc: 1100000, np: 45,  skills: ["Digital Marketing","SEO","Ahrefs","Content Strategy","LinkedIn Ads"], portfolio: "https://nishakapoor.in", linkedin: "https://linkedin.com/in/nishakapoor" },
  { firstName: "Vikram",   lastName: "Malhotra",  email: "vikram.malhotra@gmail.com",   phone: "+91 80987 65432", loc: "Chandigarh", exp: 3, co: "TalentBridge",   ctc: 680000,  ectc: 1050000, np: 30,  skills: ["Recruitment","HR Operations","ATS","Stakeholder Management","HRBP"], portfolio: "https://linkedin.com/in/vikrammalhotra", linkedin: "https://linkedin.com/in/vikrammalhotra" },
  { firstName: "Kavya",    lastName: "Nambiar",   email: "kavya.nambiar@gmail.com",     phone: "+91 79876 54321", loc: "Kochi",      exp: 2, co: "Inkwell",        ctc: 420000,  ectc: 650000,  np: 30,  skills: ["Content Writing","SEO","Email Marketing","Social Media","Copywriting"], portfolio: "https://kavya.substack.com", linkedin: "https://linkedin.com/in/kavyanambiar" },
  { firstName: "Aman",     lastName: "Tiwari",    email: "aman.tiwari@gmail.com",       phone: "+91 78765 43210", loc: "Lucknow",    exp: 2, co: "ByteBuilders",   ctc: 480000,  ectc: 750000,  np: 30,  skills: ["Node.js","MongoDB","Express","JWT","REST APIs"], portfolio: "https://github.com/amantiwari", linkedin: "https://linkedin.com/in/amantiwari" },
  { firstName: "Deepika",  lastName: "Jain",      email: "deepika.jain@gmail.com",      phone: "+91 77654 32109", loc: "Jaipur",     exp: 1, co: "PixelPerfect",   ctc: 340000,  ectc: 520000,  np: 15,  skills: ["React","HTML","CSS","JavaScript","Figma"], portfolio: "https://deepikajain.dev", linkedin: "https://linkedin.com/in/deepikajain" },
  { firstName: "Pranav",   lastName: "Kulkarni",  email: "pranav.kulkarni@gmail.com",   phone: "+91 76543 21098", loc: "Pune",       exp: 4, co: "InfraCloud",     ctc: 1000000, ectc: 1600000, np: 60,  skills: ["AWS","GCP","Terraform","Kubernetes","Docker","Ansible"], portfolio: "https://github.com/pranavkulkarni", linkedin: "https://linkedin.com/in/pranavkulkarni" },
  { firstName: "Ishita",   lastName: "Banerjee",  email: "ishita.banerjee@outlook.com", phone: "+91 75432 10987", loc: "Kolkata",    exp: 2, co: "SalesPro",       ctc: 450000,  ectc: 700000,  np: 30,  skills: ["Sales","Business Development","Cold Calling","CRM","Proposal Writing"], portfolio: "https://linkedin.com/in/ishitabanerjee", linkedin: "https://linkedin.com/in/ishitabanerjee" },
  { firstName: "Yash",     lastName: "Agarwal",   email: "yash.agarwal@gmail.com",      phone: "+91 74321 09876", loc: "Noida",      exp: 3, co: "Codesmith",      ctc: 750000,  ectc: 1200000, np: 30,  skills: ["React","TypeScript","Redux","Jest","Webpack"], portfolio: "https://github.com/yashagarwal", linkedin: "https://linkedin.com/in/yashagarwal" },
  { firstName: "Tanvi",    lastName: "Deshmukh",  email: "tanvi.deshmukh@gmail.com",    phone: "+91 73210 98765", loc: "Nashik",     exp: 1, co: "ContentFirst",   ctc: 260000,  ectc: 400000,  np: 15,  skills: ["Content Writing","Blogging","Research","SEO Basics","Social Media"], portfolio: "https://tanvi.medium.com", linkedin: "https://linkedin.com/in/tanvideshmukh" },
  { firstName: "Suresh",   lastName: "Krishnan",  email: "suresh.krishnan@gmail.com",   phone: "+91 72109 87654", loc: "Chennai",    exp: 5, co: "NetDynamics",    ctc: 1100000, ectc: 1700000, np: 45,  skills: ["Node.js","MongoDB","Microservices","Docker","TypeScript","Redis"], portfolio: "https://github.com/sureshkrishnan", linkedin: "https://linkedin.com/in/sureshkrishnan" },
  { firstName: "Lipika",   lastName: "Chatterjee",email: "lipika.chatterjee@gmail.com", phone: "+91 71098 76543", loc: "Kolkata",    exp: 3, co: "TalentHQ",       ctc: 620000,  ectc: 950000,  np: 30,  skills: ["HR","Talent Acquisition","ATS","Onboarding","Employee Engagement"], portfolio: "https://linkedin.com/in/lipikachatterjee", linkedin: "https://linkedin.com/in/lipikachatterjee" },
  { firstName: "Rishabh",  lastName: "Srivastava",email: "rishabh.sriv@outlook.com",    phone: "+91 70987 65432", loc: "Lucknow",    exp: 2, co: "GrowthAxis",     ctc: 500000,  ectc: 800000,  np: 30,  skills: ["Sales","Business Development","LinkedIn","Cold Email","Proposal Writing"], portfolio: "https://linkedin.com/in/rishabhsriv", linkedin: "https://linkedin.com/in/rishabhsriv" },
  { firstName: "Harini",   lastName: "Subramanian",email:"harini.sub@gmail.com",        phone: "+91 69876 54321", loc: "Coimbatore", exp: 2, co: "DataGrowth",     ctc: 480000,  ectc: 720000,  np: 30,  skills: ["SEO","Ahrefs","Content Optimisation","Google Search Console","Link Building"], portfolio: "https://harini.in", linkedin: "https://linkedin.com/in/harinisubramanian" },
  { firstName: "Dev",      lastName: "Khanna",    email: "dev.khanna@gmail.com",        phone: "+91 68765 43210", loc: "Gurgaon",    exp: 4, co: "MarketMaker",    ctc: 900000,  ectc: 1400000, np: 60,  skills: ["Google Ads","Meta Ads","Programmatic","Analytics","Marketing Automation"], portfolio: "https://devkhanna.com", linkedin: "https://linkedin.com/in/devkhanna" },
];

// ── Application distribution across jobs ──────────────────────────────────────
// Each entry: [jobIndex, candidateIndex, status, shortlisted, daysAgoApplied, hrNotes]
// jobIndex maps to JOB_DEFS (0-based); only published jobs (0-6, 8-9) get applications
const APP_DISTRIBUTION = [
  // Job 0: Full Stack Developer (featured, 3 openings)
  [0,  0, "shortlisted",          true,  12, "Strong React + Node combo. Good portfolio. Schedule technical round."],
  [0, 10, "interview_scheduled",  true,   9, "5 years experience, very relevant. Interview on 22nd May."],
  [0, 16, "shortlisted",          true,   7, "Senior profile, slightly over budget but worth exploring."],
  [0, 11, "screening",           false,   5, "Frontend heavy, checking if backend depth is enough."],
  [0,  3, "applied",             false,   2, ""],

  // Job 1: React Frontend Developer (remote, 2 openings)
  [1,  1, "selected",             true,  14, "Excellent portfolio. Offer extended. Joining 15 June."],
  [1, 23, "shortlisted",          true,   8, "Good React and TypeScript skills. Moving to final round."],
  [1, 20, "interview_scheduled",  true,   6, "Junior but strong fundamentals. Culture fit interview scheduled."],
  [1, 15, "screening",           false,   4, "Basic React knowledge. Need to assess TypeScript depth."],
  [1, 21, "applied",             false,   1, ""],

  // Job 2: UI/UX Designer (hybrid, 1 opening)
  [2,  5, "shortlisted",          true,  18, "Impressive portfolio with strong research case studies. Move to final round."],
  [2, 11, "interviewed",          true,  15, "Good Figma skills but research methodology is weak."],
  [2,  1, "screening",           false,  10, "More frontend-leaning than UX. Checking fit."],
  [2,  6, "on_hold",             false,   6, "Overqualified but interested. Waiting on approval to renegotiate budget."],

  // Job 3: Digital Marketing Manager (onsite, 1 opening)
  [3,  4, "interviewed",          true,  10, "Strong paid ads background. Needs more SEO depth."],
  [3,  8, "shortlisted",          true,   7, "Excellent GA4 and Ahrefs knowledge. Proceed to final."],
  [3, 17, "screening",           false,   5, "Good digital marketing fundamentals. Checking for leadership experience."],
  [3, 29, "applied",             false,   2, ""],
  [3, 24, "rejected",            false,  12, "Does not meet minimum experience requirement."],

  // Job 4: Content Writer & Strategist (remote, 2 openings)
  [4,  3, "selected",             true,  16, "Great SEO writing sample. Clear, concise style. Offer accepted."],
  [4, 19, "shortlisted",          true,  11, "Good portfolio. Interview cleared. Offer pending approval."],
  [4,  9, "screening",           false,   8, "Decent writing quality. SEO understanding needs deeper probing."],
  [4, 24, "applied",             false,   4, ""],
  [4, 25, "rejected",            false,  14, "Writing samples did not meet quality bar."],

  // Job 5: DevOps & Cloud Engineer (featured, hybrid, 1 opening)
  [5,  2, "selected",             true,  20, "AWS + Terraform expert. Background check cleared. Joining 1 June."],
  [5, 12, "interviewed",          true,  15, "Solid Kubernetes experience. Strong candidate for next opening."],
  [5, 22, "shortlisted",          true,  10, "GCP background, transitioning to AWS. Good potential."],
  [5, 16, "interview_scheduled",  true,   6, "Full-stack + DevOps combo. DevOps skills need validation."],
  [5,  9, "applied",             false,   3, ""],

  // Job 6: Business Development Executive (onsite, 2 openings)
  [6, 13, "shortlisted",          true,   9, "Good communication skills. Clear understanding of agency sales."],
  [6, 27, "interview_scheduled",  true,   6, "Relevant B2B background. Moving to final round."],
  [6, 23, "screening",           false,   4, "Fresher vibe but enthusiastic. Needs sales aptitude test."],
  [6, 14, "applied",             false,   2, ""],

  // Job 8: Node.js Backend Developer (remote, 2 openings) — index 8 in JOB_DEFS
  [8, 14, "shortlisted",          true,  11, "Good Node.js and MongoDB depth. Move to technical round."],
  [8, 20, "interview_scheduled",  true,   8, "Strong Express experience. Checking TypeScript and testing depth."],
  [8, 25, "screening",           false,   5, "Junior level, assessing potential."],
  [8,  0, "on_hold",             false,   3, "Waiting on team headcount confirmation before proceeding."],
  [8, 10, "applied",             false,   1, ""],

  // Job 9: SEO Specialist (closed — a few old applications) — index 9 in JOB_DEFS
  [9, 28, "selected",             true,  42, "Hired. Joined 1 April."],
  [9,  4, "rejected",            false,  40, "Good marketing skills but weak technical SEO."],
  [9, 17, "interviewed",         false,  38, "Decent Ahrefs skills. Was second choice after Harini."],
  [9,  3, "rejected",            false,  35, "Content writing background only, not enough SEO depth."],
];

// ── Seed function ──────────────────────────────────────────────────────────────
async function seedCareers() {
  // Clear existing data
  await Job.deleteMany({});
  await JobApplication.deleteMany({});
  console.log("🗑️  Cleared existing jobs and applications.");

  // Build and insert jobs
  const jobDocs = JOB_DEFS.map((def) => ({
    ...def,
    jobId: makeJobId(),
    slug:  slugify(def.title),
  }));

  const insertedJobs = await Job.insertMany(jobDocs);
  console.log(`✅  Inserted ${insertedJobs.length} jobs.`);

  // Build applications
  const appDocs = APP_DISTRIBUTION.map(([jobIdx, candIdx, status, shortlisted, appliedDaysAgo, hrNotes]) => {
    const job  = insertedJobs[jobIdx];
    const cand = CANDIDATES[candIdx];
    const appliedAt = daysAgo(appliedDaysAgo);

    return {
      applicationId: makeAppId(),
      job:           job._id,
      jobId:         job.jobId,
      firstName:     cand.firstName,
      lastName:      cand.lastName,
      email:         cand.email,
      phone:         cand.phone,
      currentLocation: cand.loc,
      experience:    cand.exp,
      currentCompany: cand.co,
      currentCTC:    cand.ctc,
      expectedCTC:   cand.ectc,
      noticePeriod:  cand.np,
      portfolio:     cand.portfolio,
      linkedin:      cand.linkedin,
      skills:        cand.skills,
      coverLetter:   `I am excited to apply for the ${job.title} role at Brilliant Brains. With ${cand.exp} year${cand.exp !== 1 ? "s" : ""} of relevant experience at ${cand.co}, I am confident I can contribute meaningfully to your team.`,
      status,
      shortlisted:   !!shortlisted,
      hrNotes:       hrNotes || "",
      source:        ["website", "linkedin", "referral", "naukri", "instahyre"][jobIdx % 5],
      appliedAt,
      expiresAt:     monthsFrom(appliedAt, 6),
    };
  });

  const insertedApps = await JobApplication.insertMany(appDocs, { ordered: false });
  console.log(`✅  Inserted ${insertedApps.length} applications.`);

  // Update applicationsCount + shortlistedCount on each job
  for (const job of insertedJobs) {
    const appsForJob = appDocs.filter(a => String(a.job) === String(job._id));
    const appCount  = appsForJob.length;
    const shortCount = appsForJob.filter(a => a.shortlisted).length;
    await Job.findByIdAndUpdate(job._id, {
      applicationsCount: appCount,
      shortlistedCount:  shortCount,
    });
  }
  console.log("✅  Updated applicationsCount and shortlistedCount on jobs.");

  const pubCount  = insertedJobs.filter(j => j.status === "published").length;
  const draftCount = insertedJobs.filter(j => j.status === "draft").length;
  const closedCount = insertedJobs.filter(j => j.status === "closed").length;
  console.log(`\n📋  Summary:`);
  console.log(`    Jobs:         ${insertedJobs.length} (${pubCount} published, ${draftCount} draft, ${closedCount} closed)`);
  console.log(`    Applications: ${insertedApps.length} across ${new Set(APP_DISTRIBUTION.map(a => a[0])).size} jobs`);
  console.log(`    Shortlisted:  ${appDocs.filter(a => a.shortlisted).length}`);
  console.log(`    Selected:     ${appDocs.filter(a => a.status === "selected").length}`);
}

module.exports = seedCareers;

// Allows running directly: npm run seed:careers
if (require.main === module) {
  require("dotenv").config();
  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log("✅  MongoDB connected");
      await seedCareers();
      console.log("\n🎉  Careers seed complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌  Seed failed:", err);
      process.exit(1);
    });
}
