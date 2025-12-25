#!/bin/bash

set -e

echo "🚀 Setting up Express Backend Template..."

# ------------------------
# Create folder structure
# ------------------------
mkdir -p src/{config,routes,controllers,services,models,middleware,validators,utils,constants}
mkdir -p tests

# ------------------------
# Create core files
# ------------------------
touch src/app.js
touch src/server.js

touch src/config/{db.js,swagger.js,env.js}
touch src/routes/{index.routes.js,auth.routes.js,admin.routes.js,health.routes.js}
touch src/controllers/{auth.controller.js,health.controller.js}
touch src/services/token.service.js
touch src/models/{User.model.js,AuditLog.model.js}
touch src/middleware/{auth.middleware.js,role.middleware.js,rateLimit.middleware.js,validate.middleware.js,audit.middleware.js,csrf.middleware.js,error.middleware.js}
touch src/validators/auth.validator.js
touch src/utils/{ApiError.js,ApiResponse.js,logger.js}
touch src/constants/roles.js

touch tests/health.test.js
touch README.md
touch .gitignore
touch .env.example
touch nodemon.json

# ------------------------
# Initialize npm
# ------------------------
npm init -y

# ------------------------
# Install dependencies
# ------------------------
npm install \
express \
mongoose \
dotenv \
cors \
morgan \
cookie-parser \
csurf \
express-rate-limit \
jsonwebtoken \
zod \
swagger-ui-express \
swagger-jsdoc

# ------------------------
# Install dev dependencies
# ------------------------
npm install -D nodemon eslint

# ------------------------
# Update package.json scripts
# ------------------------
node <<'EOF'
const fs = require("fs");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
pkg.scripts = {
  dev: "nodemon",
  start: "node src/server.js",
  lint: "eslint ."
};
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
EOF

# ------------------------
# nodemon config
# ------------------------
cat <<EOF > nodemon.json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["node_modules", "tests", "logs"],
  "exec": "node src/server.js",
  "env": {
    "NODE_ENV": "development"
  }
}
EOF

# ------------------------
# .gitignore
# ------------------------
cat <<EOF > .gitignore
node_modules
.env
logs
coverage
EOF

# ------------------------
# .env.example
# ------------------------
cat <<EOF > .env.example
PORT=5000
MONGO_URI=mongodb://localhost:27017/app_db
JWT_SECRET=access_secret
JWT_REFRESH_SECRET=refresh_secret
NODE_ENV=development
EOF

# ------------------------
# README
# ------------------------
cat <<EOF > README.md
# Express Backend Template

A production-ready Express.js backend template featuring:

- Cookie-based JWT authentication
- Refresh tokens
- Role-Based Access Control (RBAC)
- Rate limiting
- CSRF protection
- Request validation (Zod)
- Audit logging
- Swagger API documentation

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Swagger Docs: http://localhost:5000/docs
EOF

echo "✅ Setup complete!"
echo "👉 Next steps:"
echo "1. cp .env.example .env"
echo "2. Update env values"
echo "3. npm run dev"
