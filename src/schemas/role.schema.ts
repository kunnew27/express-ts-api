import { z } from 'zod';

const PERMISSION_VALUES = [
  'users:read',
  'users:create',
  'users:update',
  'users:delete',
  'roles:manage',
] as const;

const ROLE_NAME_VALUES = ['super_admin', 'admin', 'user'] as const;

// ── Create role ───────────────────────────────────────────────────────────────
export const createRoleSchema = z.object({
  body: z.object({
    name: z.enum(ROLE_NAME_VALUES, { required_error: 'Role name is required' }),
    permissions: z
      .array(z.enum(PERMISSION_VALUES, { message: 'Invalid permission value' }))
      .optional()
      .default([]),
  }),
});

// ── Update role ───────────────────────────────────────────────────────────────
export const updateRoleSchema = z.object({
  body: z.object({
    permissions: z
      .array(z.enum(PERMISSION_VALUES, { message: 'Invalid permission value' }))
      .optional(),
  }),
  params: z.object({
    id: z.string({ required_error: 'Role ID is required' }),
  }),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type CreateRoleInput = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
