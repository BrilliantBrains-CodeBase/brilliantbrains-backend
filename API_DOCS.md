# Brilliant Brains — Backend API Documentation

**Base URL:** `http://localhost:5000/api`  
**Auth:** Cookie-based (`accessToken` HttpOnly cookie set on login)  
**CSRF:** All state-changing requests (POST / PATCH / DELETE) require the header `X-CSRF-Token` obtained from `GET /api/auth/csrf-token`  
**Content-Type:** `application/json` unless noted otherwise  

---

## Table of Contents

1. [Health](#1-health)
2. [Authentication](#2-authentication)
3. [Users](#3-users)
4. [Settings](#4-settings)
5. [Media](#5-media)
6. [Blogs](#6-blogs)
7. [Blog Categories](#7-blog-categories)
8. [Blog Tags](#8-blog-tags)
9. [Jobs](#9-jobs)
10. [Job Applications](#10-job-applications)
11. [Career Settings](#11-career-settings)
12. [Career Dashboard](#12-career-dashboard)

---

## Response Envelope

All responses follow this shape:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { },
  "message": "Human-readable result"
}
```

Errors:
```json
{
  "message": "Error description",
  "stack": "...only in development..."
}
```

---

## 1. Health

### `GET /api/health`
Check server status. No auth required.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": { "status": "OK", "timestamp": "2026-05-15T10:00:00.000Z" },
  "message": "Server is running"
}
```

---

## 2. Authentication

### `GET /api/auth/csrf-token`
Fetch a CSRF token. Must be called before any state-changing request. No auth required.

**Response `200`**
```json
{ "csrfToken": "abc123xyz..." }
```

---

### `POST /api/auth/login`
No auth required. Sets `accessToken` and `refreshToken` cookies on success.

**Body**
```json
{
  "email": "admin@brilliantbrains.ai",
  "password": "Secret@123"
}
```

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "Super Admin",
    "email": "admin@brilliantbrains.ai",
    "role": "super_admin",
    "profileImage": null
  },
  "message": "Login successful"
}
```

**Errors**
| Status | Message |
|--------|---------|
| 400 | Validation error (missing fields) |
| 401 | Invalid credentials |
| 403 | Account is deactivated |

---

### `POST /api/auth/refresh`
Rotate tokens using the `refreshToken` cookie. No CSRF required.

**Response `200`** — new cookies set; data is `null`

---

### `POST /api/auth/logout`
🔒 Requires auth + CSRF token. Clears both cookies.

**Response `200`** — data is `null`

---

### `GET /api/auth/me`
🔒 Requires auth. Returns the currently logged-in user.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "665a1b2c3d4e5f6a7b8c9d0e",
    "name": "Super Admin",
    "email": "admin@brilliantbrains.ai",
    "role": "super_admin",
    "profileImage": null
  },
  "message": "User fetched"
}
```

---

### `PATCH /api/auth/profile`
🔒 Requires auth + CSRF. Update name, email, or profile image.

**Body** (all optional)
```json
{
  "name": "Prashanth Kumar",
  "email": "prashanth@brilliantbrains.ai",
  "profileImage": "https://cdn.example.com/avatar.jpg"
}
```

**Response `200`** — updated user object (same shape as `/me`)

---

### `PATCH /api/auth/password`
🔒 Requires auth + CSRF.

**Body**
```json
{
  "currentPassword": "OldSecret@123",
  "newPassword": "NewSecret@456"
}
```

**Response `200`** — data is `null`

---

## 3. Users

All endpoints require auth + `admin` or `super_admin` role.

### `GET /api/users`
List all users with pagination.

**Query Params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| search | string | — | Search name/email |
| role | string | — | Filter by role |
| status | string | — | `active` or `inactive` |
| sort | string | `-createdAt` | Sort field |

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "users": [
      {
        "_id": "665a1b2c3d4e5f6a7b8c9d0e",
        "name": "Prashanth Kumar",
        "email": "admin@brilliantbrains.ai",
        "role": "super_admin",
        "isActive": true,
        "phoneNumber": "+91 9876543210",
        "profileImage": null,
        "lastLoginAt": "2026-05-15T09:00:00.000Z",
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { "total": 5, "page": 1, "limit": 20, "totalPages": 1 }
  },
  "message": "Users fetched"
}
```

---

### `GET /api/users/:id`
Get a single user by MongoDB ID.

**Response `200`** — single user object (same shape as above)

---

### `POST /api/users`
🔒 Requires auth + admin + CSRF. Create a new admin user.

**Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@brilliantbrains.ai",
  "password": "Temp@12345",
  "role": "admin",
  "phoneNumber": "+91 9876543210"
}
```

**Response `201`** — created user object

**Errors**
| Status | Message |
|--------|---------|
| 400 | User with this email already exists |

---

### `PATCH /api/users/:id`
🔒 Requires auth + admin + CSRF.

**Body** (all optional)
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@brilliantbrains.ai",
  "role": "admin",
  "isActive": false,
  "phoneNumber": "+91 9000000000"
}
```

**Response `200`** — updated user object

---

### `DELETE /api/users/:id`
🔒 Requires `super_admin` + CSRF. Cannot delete another `super_admin`.

**Response `200`** — data is `null`

---

## 4. Settings

### `GET /api/settings`
Public. Returns global site settings.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "brand": {
      "name": "Brilliant Brains",
      "tagline": "Growth. Intelligence. Results.",
      "logo": "/uploads/logo.png",
      "favicon": "/uploads/favicon.ico",
      "footerText": "© 2026 Brilliant Brains",
      "copyright": "All rights reserved"
    },
    "socials": [
      { "platform": "Instagram", "url": "https://instagram.com/brilliantbrains", "icon": "instagram", "isActive": true }
    ],
    "addresses": [
      {
        "label": "HQ",
        "addressLine": "123 MG Road",
        "city": "Bengaluru",
        "state": "Karnataka",
        "country": "India",
        "zipCode": "560001",
        "isPrimary": true,
        "mapUrl": "https://maps.google.com/..."
      }
    ],
    "contacts": {
      "emails": [{ "label": "General", "email": "hello@brilliantbrains.ai", "isPrimary": true }],
      "phones": [{ "label": "Support", "number": "+91 9876543210", "isPrimary": true }]
    }
  },
  "message": "Settings fetched"
}
```

---

### `PATCH /api/settings`
🔒 Requires auth + admin + CSRF. Bulk-update all settings sections at once.

**Body** — any subset of the response shape above

---

### `PATCH /api/settings/brand`
🔒 Requires auth + admin + CSRF.

**Body**
```json
{
  "name": "Brilliant Brains",
  "tagline": "Growth. Intelligence. Results.",
  "logo": "/uploads/logo.png",
  "favicon": "/uploads/favicon.ico",
  "footerText": "© 2026 Brilliant Brains",
  "copyright": "All rights reserved"
}
```

**Response `200`** — full settings object

---

### `PATCH /api/settings/socials`
🔒 Requires auth + admin + CSRF.

**Body**
```json
[
  { "platform": "Instagram", "url": "https://instagram.com/brilliantbrains", "icon": "instagram", "isActive": true },
  { "platform": "LinkedIn", "url": "https://linkedin.com/company/brilliantbrains", "icon": "linkedin", "isActive": true }
]
```

---

### `PATCH /api/settings/addresses`
🔒 Requires auth + admin + CSRF.

**Body**
```json
[
  {
    "label": "HQ",
    "addressLine": "123 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "zipCode": "560001",
    "isPrimary": true,
    "mapUrl": "https://maps.google.com/..."
  }
]
```

---

### `PATCH /api/settings/contacts`
🔒 Requires auth + admin + CSRF.

**Body**
```json
{
  "emails": [
    { "label": "General", "email": "hello@brilliantbrains.ai", "isPrimary": true }
  ],
  "phones": [
    { "label": "Support", "number": "+91 9876543210", "isPrimary": true }
  ]
}
```

---

## 5. Media

All endpoints require auth + admin.

### `GET /api/media`

**Query Params**
| Param | Type | Default |
|-------|------|---------|
| page | number | 1 |
| limit | number | 20 |
| search | string | — |

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "media": [
      {
        "_id": "665a...",
        "originalName": "hero-banner.jpg",
        "filename": "abc123-hero-banner.webp",
        "mimeType": "image/webp",
        "size": 204800,
        "url": "/uploads/media/abc123-hero-banner.webp",
        "uploadedBy": { "_id": "...", "name": "Admin" },
        "createdAt": "2026-05-01T00:00:00.000Z"
      }
    ],
    "pagination": { "total": 42, "page": 1, "limit": 20, "totalPages": 3 }
  },
  "message": "Media fetched"
}
```

---

### `POST /api/media/upload`
🔒 Requires auth + admin + CSRF. `Content-Type: multipart/form-data`. Up to 10 files per request.

**Form Fields**
| Field | Type | Description |
|-------|------|-------------|
| files | File[] | Image files (jpg, png, webp, gif, svg) |

**Response `201`**
```json
{
  "success": true,
  "statusCode": 201,
  "data": [
    {
      "_id": "665a...",
      "url": "/uploads/media/abc123.webp",
      "originalName": "banner.jpg",
      "size": 204800,
      "mimeType": "image/webp"
    }
  ],
  "message": "Media uploaded"
}
```

---

### `DELETE /api/media/:id`
🔒 Requires auth + admin + CSRF. Deletes from database and disk.

**Response `200`** — data is `null`

---

## 6. Blogs

### `GET /api/blogs`
Public (unauthenticated sees only `published`; admins can filter by any status).

**Query Params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number | 10 | |
| status | string | `published` (public) | `draft`, `published`, `scheduled`, `archived` |
| category | string | — | Category ID |
| author | string | — | Author user ID |
| tag | string | — | Tag ID |
| search | string | — | Full-text search on title/summary |
| featured | boolean | — | Filter featured posts |
| sort | string | `-publishedAt` | Sort field |

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "blogs": [
      {
        "_id": "665a...",
        "title": "How AI is Transforming E-Commerce",
        "slug": "ai-transforming-ecommerce",
        "summary": "Short excerpt...",
        "featuredImage": "/uploads/media/blog-thumb.webp",
        "author": { "_id": "...", "name": "Prashanth Kumar", "profileImage": null },
        "category": { "_id": "...", "name": "AI & Tech", "slug": "ai-tech" },
        "tags": [{ "_id": "...", "name": "AI", "slug": "ai" }],
        "status": "published",
        "isFeatured": false,
        "isTrending": false,
        "readTime": 5,
        "stats": { "views": 1200, "likes": 45, "shares": 12 },
        "publishedAt": "2026-04-20T10:00:00.000Z",
        "createdAt": "2026-04-18T08:00:00.000Z"
      }
    ],
    "pagination": { "total": 28, "page": 1, "limit": 10, "totalPages": 3 }
  },
  "message": "Blogs fetched successfully"
}
```

---

### `GET /api/blogs/slug/:slug`
Public. Increments view count.

**Response `200`** — full blog object including `content` field

---

### `GET /api/blogs/:id`
🔒 Requires auth + admin. Get full blog by MongoDB ID.

**Response `200`** — full blog object

---

### `GET /api/blogs/:id/related`
Public. Returns up to 3 blogs in the same category or sharing tags.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [ { "_id": "...", "title": "...", "slug": "...", "featuredImage": "...", "publishedAt": "..." } ],
  "message": "Related blogs fetched"
}
```

---

### `POST /api/blogs`
🔒 Requires auth + admin + CSRF.

**Body**
```json
{
  "title": "How AI is Transforming E-Commerce",
  "slug": "ai-transforming-ecommerce",
  "summary": "Short excerpt shown in listing cards.",
  "content": "<h2>Introduction</h2><p>...</p>",
  "featuredImage": "/uploads/media/blog-thumb.webp",
  "categoryId": "665a1b2c3d4e5f6a7b8c9d01",
  "tags": ["665a1b2c3d4e5f6a7b8c9d02"],
  "status": "draft",
  "isFeatured": false,
  "isTrending": false,
  "scheduledAt": null,
  "seo": {
    "metaTitle": "AI in E-Commerce | Brilliant Brains",
    "metaDescription": "Explore how AI is reshaping online retail.",
    "keywords": ["AI", "ecommerce", "machine learning"],
    "ogImage": "/uploads/media/blog-og.webp",
    "canonicalUrl": "https://brilliantbrains.ai/blogs/ai-transforming-ecommerce"
  }
}
```

**Response `201`** — created blog object

**Errors**
| Status | Message |
|--------|---------|
| 400 | Slug already in use |

---

### `PATCH /api/blogs/:id`
🔒 Requires auth + admin + CSRF. Saves a revision when `content` changes.

**Body** — any subset of the create body

**Response `200`** — updated blog object

---

### `DELETE /api/blogs/:id`
🔒 Requires auth + admin + CSRF. Also deletes all revisions.

**Response `200`** — data is `null`

---

## 7. Blog Categories

### `GET /api/categories`
Public.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "_id": "665a...",
      "name": "AI & Tech",
      "slug": "ai-tech",
      "description": "Articles about AI and technology.",
      "image": null,
      "color": "#FE611C",
      "parentId": null,
      "blogCount": 7
    }
  ],
  "message": "Categories fetched"
}
```

---

### `POST /api/categories`
🔒 Requires auth + admin + CSRF.

**Body**
```json
{
  "name": "AI & Tech",
  "slug": "ai-tech",
  "description": "Articles about AI and technology.",
  "image": "/uploads/media/cat-ai.webp",
  "color": "#FE611C",
  "parentId": null
}
```

**Response `201`** — created category object

---

### `PATCH /api/categories/:id`
🔒 Requires auth + admin + CSRF. Cannot set `parentId` to itself.

**Body** — any subset of create body

**Response `200`** — updated category

---

### `DELETE /api/categories/:id`
🔒 Requires auth + admin + CSRF. Fails if blogs are assigned or child categories exist.

**Response `200`** — data is `null`

---

## 8. Blog Tags

### `GET /api/tags`
Public.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    { "_id": "665a...", "name": "AI", "slug": "ai", "blogCount": 12 }
  ],
  "message": "Tags fetched"
}
```

---

### `POST /api/tags`
🔒 Requires auth + admin + CSRF.

**Body**
```json
{ "name": "AI", "slug": "ai" }
```

**Response `201`** — created tag object

---

### `PATCH /api/tags/:id`
🔒 Requires auth + admin + CSRF.

**Body**
```json
{ "name": "Artificial Intelligence", "slug": "artificial-intelligence" }
```

**Response `200`** — updated tag

---

### `DELETE /api/tags/:id`
🔒 Requires auth + admin + CSRF.

**Response `200`** — data is `null`

---

## 9. Jobs

### `GET /api/jobs`
Public sees only `published` + `acceptingApplications: true`. Admins can filter by any status.

**Query Params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number | 20 | |
| status | string | — | Admin only: `draft`, `published`, `closed`, `archived` |
| department | string | — | Partial match |
| location | string | — | Partial match |
| employmentType | string | — | `full-time`, `part-time`, `contract`, `internship`, `freelance` |
| workplaceType | string | — | `remote`, `hybrid`, `onsite` |
| featured | boolean | — | |
| search | string | — | Searches title, description, department, location, techStack, jobId |
| sort | string | `-createdAt` | |
| jobId | string | — | Filter by human-readable job ID |
| tag | string | — | Filter by tag |

**Response `200`** (public)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "jobs": [
      {
        "_id": "665a...",
        "jobId": "JOB-1747123456-4821",
        "title": "Senior Frontend Engineer",
        "slug": "senior-frontend-engineer",
        "department": "Engineering",
        "team": "Product",
        "location": "Bengaluru, India",
        "employmentType": "full-time",
        "workplaceType": "hybrid",
        "openings": 2,
        "minExperience": 3,
        "maxExperience": 6,
        "experienceLabel": "3–6 years",
        "shortDescription": "Build world-class UIs with React.",
        "techStack": ["React", "TypeScript", "Tailwind"],
        "currency": "INR",
        "hideSalary": true,
        "status": "published",
        "acceptingApplications": true,
        "featured": false,
        "priority": 0,
        "tags": ["frontend", "react"],
        "viewsCount": 340,
        "applicationsCount": 18,
        "postedAt": "2026-05-01T00:00:00.000Z",
        "validTill": "2026-06-30T00:00:00.000Z",
        "createdAt": "2026-04-28T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 12, "page": 1, "limit": 20, "totalPages": 1 }
  },
  "message": "Jobs fetched successfully"
}
```

> **Note:** Public response excludes `hiringManager`, `recentApplicants`, and `seo` fields.

---

### `GET /api/jobs/slug/:slug`
Public (published only). Atomically increments `viewsCount`.

**Response `200`** — full job object

**Errors**
| Status | Message |
|--------|---------|
| 404 | Job not found or not available |

---

### `GET /api/jobs/:id`
🔒 Requires auth + admin. Get job by MongoDB ID including `hiringManager`.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "665a...",
    "jobId": "JOB-1747123456-4821",
    "title": "Senior Frontend Engineer",
    "hiringManager": { "_id": "...", "name": "Recruiter Name", "email": "recruiter@brilliantbrains.ai" },
    "recentApplicants": [
      { "name": "Jane Doe", "email": "jane@example.com", "appliedAt": "2026-05-10T00:00:00.000Z", "status": "applied" }
    ],
    "seo": { "metaTitle": "...", "metaDescription": "..." }
  },
  "message": "Job fetched successfully"
}
```

---

### `POST /api/jobs`
🔒 Requires auth + admin + CSRF. Auto-generates `jobId`. Sets `postedAt` if status is `published`.

**Body**
```json
{
  "title": "Senior Frontend Engineer",
  "slug": "senior-frontend-engineer",
  "department": "Engineering",
  "team": "Product",
  "location": "Bengaluru, India",
  "employmentType": "full-time",
  "workplaceType": "hybrid",
  "openings": 2,
  "minExperience": 3,
  "maxExperience": 6,
  "experienceLabel": "3–6 years",
  "shortDescription": "Build world-class UIs with React.",
  "jobDescription": "<p>Full job description in HTML...</p>",
  "keyResponsibilities": ["Lead frontend architecture", "Mentor junior developers"],
  "requirements": ["3+ years React experience", "TypeScript proficiency"],
  "preferredSkills": ["GraphQL", "Testing (Vitest)"],
  "qualifications": ["B.Tech / B.E. in Computer Science or equivalent"],
  "benefits": ["Health insurance", "Remote-friendly", "ESOPs"],
  "techStack": ["React", "TypeScript", "Tailwind CSS"],
  "salaryMin": 1800000,
  "salaryMax": 2800000,
  "currency": "INR",
  "hideSalary": false,
  "status": "draft",
  "acceptingApplications": true,
  "maxApplications": 200,
  "validTill": "2026-06-30",
  "featured": false,
  "priority": 0,
  "tags": ["frontend", "react", "typescript"],
  "hiringManager": "665a1b2c3d4e5f6a7b8c9d0e",
  "seo": {
    "metaTitle": "Senior Frontend Engineer at Brilliant Brains",
    "metaDescription": "Join our team as a Senior Frontend Engineer."
  }
}
```

**Response `201`** — created job object

**Errors**
| Status | Message |
|--------|---------|
| 400 | Title is required |
| 400 | A job with this slug already exists |

---

### `PATCH /api/jobs/:id`
🔒 Requires auth + admin + CSRF. Auto-manages status timestamps:
- `published` → sets `postedAt`, clears `closedAt` / `archivedAt`
- `closed` → sets `closedAt`, sets `acceptingApplications: false`
- `archived` → sets `archivedAt`, sets `acceptingApplications: false`

**Body** — any writable field (same list as create body)

**Response `200`** — updated job object

---

### `POST /api/jobs/:id/publish`
🔒 Requires auth + admin + CSRF. Convenience shortcut — equivalent to PATCH with `status: published`.

Sets `status: published`, `postedAt: now`, `acceptingApplications: true`, clears `closedAt`/`archivedAt`.

**Response `200`** — updated job object

---

### `POST /api/jobs/:id/archive`
🔒 Requires auth + admin + CSRF.

Sets `status: archived`, `archivedAt: now`, `acceptingApplications: false`.

**Response `200`** — updated job object

---

### `POST /api/jobs/:id/duplicate`
🔒 Requires auth + admin + CSRF.

Creates a draft copy with `title: "<original> (Copy)"`, new slug `<original-slug>-copy-<timestamp>`, and all analytics reset to zero.

**Response `201`** — new job object

---

### `DELETE /api/jobs/:id`
🔒 Requires auth + admin + CSRF. Also deletes all related `JobApplication` records.

**Response `200`** — data is `null`

---

## 10. Job Applications

### `POST /api/applications`
**Public — no auth, no CSRF required.** `Content-Type: multipart/form-data`

Resolves job by MongoDB `_id`, human-readable `jobId` (e.g. `JOB-xxx`), or `slug`. Prevents duplicate applications (same job + email). Respects `maxApplications` cap. Updates `job.recentApplicants` (max 5 snapshot).

**Form Fields**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| jobId | string | ✅ | Job `_id`, `JOB-xxx` ID, or slug |
| firstName | string | ✅ | |
| lastName | string | ✅ | |
| email | string | ✅ | |
| phone | string | — | |
| currentLocation | string | — | |
| experience | number | — | Years of experience |
| currentCompany | string | — | |
| currentCTC | number | — | Current CTC (annual, INR) |
| expectedCTC | number | — | Expected CTC (annual, INR) |
| noticePeriod | number | — | Notice period in days |
| portfolio | string | — | Portfolio URL |
| linkedin | string | — | LinkedIn profile URL |
| github | string | — | GitHub profile URL |
| coverLetter | string | — | Text cover letter |
| skills | string[] | — | Array of skill strings |
| source | string | — | Where they heard about the role |
| utmSource | string | — | UTM source parameter |
| utmCampaign | string | — | UTM campaign parameter |
| resume | File | — | PDF, DOC, or DOCX (max 5 MB) |

**Response `201`**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "_id": "665a...",
    "applicationId": "APP-1747123456-3817",
    "job": "665a...",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "status": "applied",
    "appliedAt": "2026-05-15T10:30:00.000Z"
  },
  "message": "Application submitted successfully"
}
```

**Errors**
| Status | Message |
|--------|---------|
| 404 | Job not found or not accepting applications |
| 409 | You have already applied for this position |
| 429 | This position has reached its maximum number of applications |

---

### `GET /api/applications`
🔒 Requires auth + admin.

**Query Params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number | 20 | |
| status | string | — | Filter by application status |
| shortlisted | boolean | — | Filter shortlisted only |
| jobId | string | — | Filter by job MongoDB ID |
| search | string | — | Search name/email/applicationId |
| sort | string | `-appliedAt` | |
| source | string | — | Filter by source |
| from | date | — | Applied after (ISO date) |
| to | date | — | Applied before (ISO date) |

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "applications": [
      {
        "_id": "665a...",
        "applicationId": "APP-1747123456-3817",
        "job": { "_id": "...", "title": "Senior Frontend Engineer", "jobId": "JOB-xxx" },
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com",
        "phone": "+91 9876543210",
        "experience": 4,
        "status": "applied",
        "shortlisted": false,
        "resumeUrl": "/uploads/resumes/resume-abc123.pdf",
        "source": "LinkedIn",
        "appliedAt": "2026-05-15T10:30:00.000Z"
      }
    ],
    "pagination": { "total": 84, "page": 1, "limit": 20, "totalPages": 5 }
  },
  "message": "Applications fetched"
}
```

---

### `GET /api/applications/export`
🔒 Requires auth + admin. Downloads a CSV file.

**Query Params**
| Param | Type | Description |
|-------|------|-------------|
| jobId | string | Filter by job (optional) |
| status | string | Filter by status (optional) |

**Response** — `Content-Type: text/csv`, `Content-Disposition: attachment; filename="applications.csv"`

---

### `GET /api/applications/job/:jobId`
🔒 Requires auth + admin. List applications for a specific job.

**Params** — `:jobId` is the MongoDB `_id` of the job

**Query Params** — same pagination + status filter as `GET /api/applications`

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "job": { "_id": "...", "title": "Senior Frontend Engineer", "applicationsCount": 18 },
    "applications": [ ],
    "pagination": { "total": 18, "page": 1, "limit": 20, "totalPages": 1 }
  },
  "message": "Applications fetched"
}
```

---

### `GET /api/applications/:id`
🔒 Requires auth + admin. Single application with full job details.

**Response `200`** — full application object

---

### `PATCH /api/applications/:id/status`
🔒 Requires auth + admin + CSRF. Syncs `shortlisted` boolean with status. Updates `job.shortlistedCount`.

**Body**
```json
{
  "status": "shortlisted",
  "rejectionReason": null,
  "interviewDate": "2026-05-25T11:00:00.000Z",
  "interviewNotes": "Strong profile, schedule call with hiring manager."
}
```

**Status values:** `applied` | `screening` | `shortlisted` | `interview_scheduled` | `interviewed` | `selected` | `rejected` | `on_hold`

**Response `200`** — updated application object

---

### `PATCH /api/applications/:id/notes`
🔒 Requires auth + admin + CSRF.

**Body**
```json
{ "hrNotes": "Good cultural fit. Follow up after background check." }
```

**Response `200`** — updated application object

---

### `PATCH /api/applications/:id/shortlist`
🔒 Requires auth + admin + CSRF. Toggles `shortlisted` flag. Adjusts `job.shortlistedCount` accordingly.

**Body** — none required

**Response `200`** — updated application object

---

### `DELETE /api/applications/:id`
🔒 Requires auth + admin + CSRF. Deletes resume file from disk before removing the record. Decrements `job.applicationsCount` and `job.shortlistedCount` if applicable.

**Response `200`** — data is `null`

---

## 11. Career Settings

### `GET /api/career-settings`
Public. Returns careers page content configuration.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "_id": "665a...",
    "pageTitle": "Careers at Brilliant Brains",
    "pageSubtitle": "Join a team that builds what matters.",
    "heroBadgeText": "We're Hiring",
    "ctaText": "View Open Positions",
    "cultureHeading": "Why join us?",
    "cultureDescription": "We're a team of builders, thinkers, and doers...",
    "perks": [
      { "icon": "🚀", "title": "Fast Growth", "description": "Accelerated learning environment" },
      { "icon": "🌍", "title": "Remote Friendly", "description": "Work from anywhere" }
    ],
    "allowDirectApplications": true,
    "requireCoverLetter": false,
    "autoAcknowledgeEmail": true,
    "acknowledgeEmailSubject": "We received your application!",
    "acknowledgeEmailBody": "Hi {{name}}, thank you for applying...",
    "hrEmail": "careers@brilliantbrains.ai",
    "hrName": "Talent Team",
    "metaTitle": "Careers | Brilliant Brains",
    "metaDescription": "Explore open roles at Brilliant Brains."
  },
  "message": "Career settings fetched"
}
```

---

### `PATCH /api/career-settings`
🔒 Requires auth + admin + CSRF.

**Body** — any subset of the response fields above (all optional)

```json
{
  "pageTitle": "Join Our Team",
  "heroBadgeText": "Now Hiring",
  "perks": [
    { "icon": "💡", "title": "Innovation First", "description": "We ship ideas fast" }
  ],
  "allowDirectApplications": true,
  "requireCoverLetter": false,
  "autoAcknowledgeEmail": true,
  "acknowledgeEmailSubject": "Application received — Brilliant Brains",
  "hrEmail": "careers@brilliantbrains.ai"
}
```

**Response `200`** — updated settings object

---

## 12. Career Dashboard

### `GET /api/career-dashboard`
🔒 Requires auth + admin. Returns aggregated recruitment analytics.

**Response `200`**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "overview": {
      "totalJobs": 15,
      "activeJobs": 8,
      "draftJobs": 4,
      "closedJobs": 2,
      "archivedJobs": 1,
      "totalApplications": 342,
      "shortlistedCount": 28,
      "interviewScheduledCount": 12,
      "selectedCount": 5,
      "rejectedCount": 87,
      "newThisWeek": 34
    },
    "recentApplications": [
      {
        "_id": "665a...",
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com",
        "status": "applied",
        "appliedAt": "2026-05-15T10:30:00.000Z",
        "job": { "title": "Senior Frontend Engineer", "jobId": "JOB-xxx" }
      }
    ],
    "monthlyBreakdown": [
      { "_id": { "year": 2026, "month": 5 }, "count": 34 },
      { "_id": { "year": 2026, "month": 4 }, "count": 61 }
    ],
    "sourceBreakdown": [
      { "_id": "LinkedIn", "count": 142 },
      { "_id": "Website", "count": 98 },
      { "_id": "Referral", "count": 56 }
    ],
    "statusBreakdown": [
      { "_id": "applied", "count": 185 },
      { "_id": "shortlisted", "count": 28 },
      { "_id": "rejected", "count": 87 }
    ],
    "topJobs": [
      {
        "_id": "665a...",
        "title": "Senior Frontend Engineer",
        "department": "Engineering",
        "location": "Bengaluru",
        "applicationsCount": 64
      }
    ]
  },
  "message": "Dashboard stats fetched"
}
```

---

## Background Services

### Blog Scheduler
Runs every **60 seconds** via `setInterval`. Publishes any blog with `status: "scheduled"` and `scheduledAt <= now`.

### Career Scheduler
Runs daily at **02:00 AM** via `node-cron`. Executes three tasks:

| Task | Condition | Action |
|------|-----------|--------|
| Resume cleanup | `expiresAt <= now` AND `resumeDeletedAt = null` | Deletes resume file from disk, nulls resume fields, sets `resumeDeletedAt` |
| Auto-close jobs | `status: published` AND `validTill <= now` | Sets `status: closed`, `acceptingApplications: false`, `closedAt: now` |
| Auto-archive jobs | `status: closed` AND `closedAt <= 30 days ago` | Sets `status: archived`, `archivedAt: now` |

---

## Role Reference

| Role | Permissions |
|------|-------------|
| `super_admin` | Full access including user deletion and super_admin management |
| `admin` | Full access except deleting super_admin users |

---

*Last updated: 2026-05-15*
