# Express Backend API

REST API built with **Express v5**, **TypeScript**, and **MongoDB** featuring JWT authentication, role-based access control (RBAC), and auto-generated API docs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express v5 |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Validation | Zod |
| API Docs | Scalar UI (OpenAPI 3.0) |
| Rate Limiting | express-rate-limit |

---

## Project Structure

```
src/
├── config/
│   └── db.ts                  # MongoDB connection
├── controllers/
│   ├── auth.controller.ts     # register, login, refresh, logout
│   ├── user.controller.ts     # CRUD + me
│   └── role.controller.ts     # CRUD roles
├── docs/
│   └── openapi.ts             # OpenAPI 3.0 spec (Scalar UI)
├── middleware/
│   ├── auth.middleware.ts     # JWT protect guard
│   ├── role.middleware.ts     # requirePermission() RBAC guard
│   ├── rateLimit.ts           # globalLimiter, authLimiter, sensitiveLimiter
│   ├── asyncHandler.ts        # async error wrapper
│   ├── validate.ts            # Zod request validation
│   ├── errorHandler.ts        # global error handler
│   └── notFound.ts            # 404 handler
├── models/
│   ├── user.model.ts
│   ├── role.model.ts
│   └── permission.model.ts
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   └── role.routes.ts
├── schemas/
│   ├── user.schema.ts         # Zod schemas for user routes
│   └── role.schema.ts         # Zod schemas for role routes
├── utils/
│   └── permission.utils.ts    # getPermissionIds() helper
├── app.ts                     # Express app setup
├── server.ts                  # Entry point
└── seed.ts                    # Database seeder
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/express-backend
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Super admin seed credentials
SUPER_ADMIN_EMAIL=super@admin.com
SUPER_ADMIN_PASSWORD=SuperAdmin@123
```

### 3. Seed the database

Creates permissions, roles (`super_admin`, `admin`, `user`), and the super admin account.

```bash
npm run seed
```

> **Warning:** The seed script clears **all** collections before re-seeding.

### 4. Start the server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build && npm start
```

Server runs at `http://localhost:3000`

---

## API Docs

Interactive Scalar UI available at:

```
http://localhost:3000/docs
```

Raw OpenAPI JSON:

```
http://localhost:3000/openapi.json
```

---

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login, returns access + refresh tokens |
| `POST` | `/api/auth/refresh` | No | Refresh access token |
| `POST` | `/api/auth/logout` | No | Logout |

### Users — `/api/users`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | JWT only | Get current user |
| `GET` | `/api/users` | `users:read` | List users (paginated + searchable + sortable) |
| `GET` | `/api/users/:id` | `users:read` | Get user by ID |
| `POST` | `/api/users` | `users:create` | Create a new user |
| `PATCH` | `/api/users/:id` | `users:update` | Update user |
| `DELETE` | `/api/users/:id` | `users:delete` | Delete user |

**Query params for `GET /api/users`:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `10` | Items per page (max 100) |
| `search` | string | — | Regex search on name & email |
| `sortBy` | string | `createdAt` | `name` \| `email` \| `createdAt` \| `updatedAt` |
| `sortOrder` | string | `desc` | `asc` \| `desc` |

### Roles — `/api/roles`

All role routes require JWT + `roles:manage` permission.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/roles` | List all roles with populated permissions |
| `GET` | `/api/roles/:id` | Get role by ID |
| `POST` | `/api/roles` | Create a new role |
| `PATCH` | `/api/roles/:id` | Update role permissions |
| `DELETE` | `/api/roles/:id` | Delete role |

> `super_admin` role is protected — it cannot be modified or deleted.

---

## RBAC — Roles & Permissions

### Roles

| Role | Description |
|---|---|
| `super_admin` | Bypasses all permission checks — full access |
| `admin` | Can read, update, and delete users |
| `user` | Read-only access |

### Permissions

| Permission | Description |
|---|---|
| `users:read` | View user profiles and lists |
| `users:create` | Create new user accounts |
| `users:update` | Edit existing user information |
| `users:delete` | Remove user accounts |
| `roles:manage` | Create, update, and delete roles |

### Permission Matrix

| Permission | `super_admin` | `admin` | `user` |
|---|:---:|:---:|:---:|
| `users:read` | ✅ | ✅ | ✅ |
| `users:create` | ✅ | ❌ | ❌ |
| `users:update` | ✅ | ✅ | ❌ |
| `users:delete` | ✅ | ✅ | ❌ |
| `roles:manage` | ✅ | ❌ | ❌ |

---

## Rate Limiting

| Limiter | Routes | Limit |
|---|---|---|
| `globalLimiter` | All routes | 100 req / IP / 15 min |
| `authLimiter` | `/api/auth/*` | 10 req / IP / 15 min |
| `sensitiveLimiter` | Import & apply manually | 5 req / IP / hour |

When a limit is exceeded the API responds with:

```json
{ "status": "error", "message": "Too many requests, please try again later." }
```

To apply `sensitiveLimiter` to a specific route:

```ts
import { sensitiveLimiter } from '@/middleware/rateLimit';
router.post('/reset-password', sensitiveLimiter, handler);
```

---

## Authentication Flow

```
POST /api/auth/login
  → returns { access_token, refresh_token }

GET /api/users  (Authorization: Bearer <access_token>)

POST /api/auth/refresh  { refresh_token }
  → returns new { access_token, refresh_token }
```

---

## Standard Response Shape

**Success**
```json
{ "status": "success", "data": { ... } }
```

**Paginated**
```json
{
  "status": "success",
  "data": { "users": [...] },
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error**
```json
{ "status": "error", "message": "Something went wrong" }
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run seed` | Reseed the database (clears all data first) |
