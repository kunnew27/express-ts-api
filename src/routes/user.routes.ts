import { Router } from 'express';
import asyncHandler from '@/middleware/asyncHandler';
import protect from '@/middleware/auth.middleware';
import { requirePermission } from '@/middleware/role.middleware';
import validate from '@/middleware/validate';
import { uploadSingle } from '@/libs/multer';
import {
  getMe,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '@/controllers/user.controller';
import { getUsersSchema, createUserSchema, updateUserSchema } from '@/schemas/user.schema';
import { AuthRequest } from '@/types';

const router = Router();

// All user routes require a valid JWT
router.use(protect);

// Avatar multer preset (image only, 2 MB, saved to disk)
const avatarUpload = uploadSingle('avatar', {
  category: 'image',
  maxSizeMB: 2,
  storage: 'disk',
  folder: 'uploads/avatars',
});

// ── GET /api/users/me ─────────────────────────────────────────────────────────────
router.get('/me', asyncHandler<AuthRequest>(getMe));

// ── POST /api/users ───────────────────────────────────────────────────────────────
// multipart/form-data: name, email, password, role? + optional avatar file
router.post(
  '/',
  avatarUpload,
  validate(createUserSchema),
  requirePermission('users:create'),
  asyncHandler<AuthRequest>(createUser),
);

// ── GET /api/users ────────────────────────────────────────────────────────────────
router.get(
  '/',
  validate(getUsersSchema),
  requirePermission('users:read'),
  asyncHandler<AuthRequest>(getUsers),
);

// ── GET /api/users/:id ────────────────────────────────────────────────────────────
router.get(
  '/:id',
  requirePermission('users:read'),
  asyncHandler<AuthRequest>(getUserById),
);

// ── PATCH /api/users/:id ──────────────────────────────────────────────────────────
// multipart/form-data: name?, email?, avatar? (optional file)
router.patch(
  '/:id',
  avatarUpload,
  validate(updateUserSchema),
  requirePermission('users:update'),
  asyncHandler<AuthRequest>(updateUser),
);

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────────
router.delete(
  '/:id',
  requirePermission('users:delete'),
  asyncHandler<AuthRequest>(deleteUser),
);

export default router;
