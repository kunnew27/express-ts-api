import { Router } from "express";
import asyncHandler from "@/middleware/asyncHandler";
import protect from "@/middleware/auth.middleware";
import { requirePermission } from "@/middleware/role.middleware";
import validate from "@/middleware/validate";
import {
  getMe,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "@/controllers/user.controller";
import {
  getUsersSchema,
  createUserSchema,
  updateUserSchema,
} from "@/schemas/user.schema";
import { AuthRequest } from "@/types";

const router = Router();

// All user routes require a valid JWT
router.use(protect);

// GET /api/users/me
router.get("/me", asyncHandler<AuthRequest>(getMe));

// POST /api/users  (requires users:create)
router.post(
  "/",
  validate(createUserSchema),
  requirePermission("users:create"),
  asyncHandler<AuthRequest>(createUser),
);

// GET /api/users?page=1&limit=10&search=john  (requires users:read)
router.get(
  "/",
  validate(getUsersSchema),
  requirePermission("users:read"),
  asyncHandler<AuthRequest>(getUsers),
);

// GET /api/users/:id  (requires users:read)
router.get(
  "/:id",
  requirePermission("users:read"),
  asyncHandler<AuthRequest>(getUserById),
);

// PATCH /api/users/:id  (requires users:update)
router.patch(
  "/:id",
  validate(updateUserSchema),
  requirePermission("users:update"),
  asyncHandler<AuthRequest>(updateUser),
);

// DELETE /api/users/:id  (requires users:delete)
router.delete(
  "/:id",
  requirePermission("users:delete"),
  asyncHandler<AuthRequest>(deleteUser),
);

export default router;
