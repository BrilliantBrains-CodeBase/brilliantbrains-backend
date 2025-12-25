Detailed Architecture Documentation
# Express Backend Template

A **production-ready Express.js backend template** designed for real-world applications.
This repository follows clean architecture principles and includes authentication, security,
testing, and documentation out of the box.

This template is intended to be **cloned and reused** for:
- E-commerce backends
- SaaS products
- Admin dashboards
- REST APIs
- MERN / Next.js applications

---

## 🎯 Design Goals

- Clean, scalable folder structure
- Secure by default (cookie-based auth + CSRF)
- Easy to understand and extend
- Separation of concerns
- Production-ready practices (not tutorial-level)

---

## 🏗️ Architecture Overview

The backend follows a **layered architecture**:



Client
→ Routes
→ Middleware
→ Controllers
→ Services
→ Models
→ Database


Each layer has **one responsibility only**.

---

## 📂 Project Structure



src/
├── app.js
├── server.js
│
├── config/
│ ├── db.js
│ ├── env.js
│ └── swagger.js
│
├── routes/
│ ├── index.routes.js
│ ├── auth.routes.js
│ ├── admin.routes.js
│ ├── health.routes.js
│ └── csrf.routes.js
│
├── controllers/
│ ├── auth.controller.js
│ └── health.controller.js
│
├── services/
│ └── token.service.js
│
├── models/
│ ├── User.model.js
│ └── AuditLog.model.js
│
├── middleware/
│ ├── auth.middleware.js
│ ├── role.middleware.js
│ ├── rateLimit.middleware.js
│ ├── csrf.middleware.js
│ ├── validate.middleware.js
│ ├── audit.middleware.js
│ └── error.middleware.js
│
├── validators/
│ └── auth.validator.js
│
├── utils/
│ ├── ApiError.js
│ ├── ApiResponse.js
│ └── logger.js
│
└── constants/
└── roles.js


---

## 🧠 Core Entry Files

### `src/server.js`
Responsible for:
- Loading environment variables
- Connecting to the database
- Starting the HTTP server

This file **does not contain Express logic**.

---

### `src/app.js`
Responsible for:
- Creating the Express app
- Registering middleware
- Registering routes
- Global error handling

This separation allows easier testing and scalability.

---

## ⚙️ Configuration Layer (`config/`)

### `env.js`
Validates required environment variables at startup using Zod.
If a required variable is missing, the app fails immediately.

This prevents runtime crashes in production.

---

### `db.js`
Handles MongoDB connection using Mongoose.

---

### `swagger.js`
Configures Swagger/OpenAPI documentation.
Swagger UI is available at:



http://localhost:5000/docs


---

## 🛣️ Routing Layer (`routes/`)

Routes define **URL structure only**.
They do not contain business logic.

### `index.routes.js`
Central router that mounts all feature routes.

---

### `auth.routes.js`
Handles authentication endpoints:
- Login
- Refresh token
- Logout

---

### `admin.routes.js`
Protected routes using:
- Authentication middleware
- Role-Based Access Control (RBAC)

---

### `health.routes.js`
Simple health check endpoint used for:
- Monitoring
- Load balancers
- CI checks

---

### `csrf.routes.js`
Exposes CSRF token for frontend usage.

---

## 🎮 Controllers Layer (`controllers/`)

Controllers:
- Receive requests
- Call services
- Return responses

They **do not**:
- Access database directly
- Contain business logic

Example responsibilities:
- Setting cookies
- Sending JSON responses

---

## 🧩 Services Layer (`services/`)

Services contain **business logic** and reusable operations.

### `token.service.js`
Handles:
- JWT creation
- Cookie configuration
- Access & refresh token handling

This logic is isolated so it can be reused and tested independently.

---

## 🗄️ Models Layer (`models/`)

Defines MongoDB schemas using Mongoose.

### `User.model.js`
- Stores user credentials
- Stores user role for RBAC

---

### `AuditLog.model.js`
Tracks sensitive actions such as:
- Admin operations
- Protected route access

---

## 🛡️ Middleware Layer (`middleware/`)

Middleware runs **before controllers** and controls request flow.

### Key middleware:

| Middleware | Purpose |
|---------|--------|
| `auth.middleware.js` | Reads JWT from cookies |
| `role.middleware.js` | Enforces RBAC |
| `rateLimit.middleware.js` | Prevents abuse |
| `csrf.middleware.js` | Prevents CSRF attacks |
| `validate.middleware.js` | Validates requests |
| `audit.middleware.js` | Logs sensitive actions |
| `error.middleware.js` | Central error handling |

---

## 🔐 Authentication & Security

### Authentication Model
- JWT stored in **HTTP-only cookies**
- No localStorage usage
- Access token (short-lived)
- Refresh token (long-lived)

---

### CSRF Protection
- Enabled using `csurf`
- Frontend must fetch token from:



GET /api/csrf/token


- Token must be sent in `X-CSRF-Token` header for all state-changing requests

---

### Role-Based Access Control (RBAC)
Roles are defined in:


constants/roles.js


Routes can restrict access using middleware:

```js
authenticate
authorize(ROLES.ADMIN)

🧪 Testing
tests/health.test.js

Uses Jest + Supertest to validate:

App startup

Routing

Health endpoint

Run tests with:

npm test

🚀 Getting Started
Install dependencies
npm install

Setup environment
cp .env.example .env

Start development server
npm run dev

📈 Extending the Template

To add a new feature:

Create route file

Create controller

Create service

Create model (if needed)

Register route in index.routes.js

This keeps features isolated and scalable.

📜 License

MIT


