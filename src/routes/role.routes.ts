import { Router } from 'express';
import asyncHandler from '@/middleware/asyncHandler';
import protect from '@/middleware/auth.middleware';
import { requirePermission } from '@/middleware/role.middleware';
import validate from '@/middleware/validate';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '@/controllers/role.controller';
import { createRoleSchema, updateRoleSchema } from '@/schemas/role.schema';
import { AuthRequest } from '@/types';

const router = Router();

// All role routes require a valid JWT + roles:manage permission
router.use(protect, requirePermission('roles:manage'));

// GET /api/roles
router.get('/', asyncHandler<AuthRequest>(getRoles));

// GET /api/roles/:id
router.get('/:id', asyncHandler<AuthRequest>(getRoleById));

// POST /api/roles
router.post('/', validate(createRoleSchema), asyncHandler<AuthRequest>(createRole));

// PATCH /api/roles/:id
router.patch('/:id', validate(updateRoleSchema), asyncHandler<AuthRequest>(updateRole));

// DELETE /api/roles/:id
router.delete('/:id', asyncHandler<AuthRequest>(deleteRole));

export default router;
