import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import Role, { Permission } from '@/models/role.model';

/**
 * requirePermission — RBAC permission guard.
 *
 * Usage:  router.delete('/:id', protect, requirePermission('users:delete'), handler)
 *
 * Rules:
 *  • super_admin  → bypasses ALL checks (can do anything, zero DB query).
 *  • Other roles  → must hold EVERY listed permission.
 *  • No role      → 403 Forbidden.
 */
export const requirePermission =
  (...required: Permission[]) =>
  async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    const roleName = req.user?.role;

    // ── No role in token ──────────────────────────────────────────────────────
    if (!roleName) {
      next(
        Object.assign(new Error('Forbidden — no role assigned'), { statusCode: 403 }),
      );
      return;
    }

    // ── super_admin bypasses everything ──────────────────────────────────────
    if (roleName === 'super_admin') {
      next();
      return;
    }

    // ── Fetch role’s permission list from DB ──────────────────────────────────
    const role = await Role.findOne({ name: roleName })
      .populate<{ permissions: Array<{ name: Permission }> }>('permissions')
      .lean();
    if (!role) {
      next(
        Object.assign(new Error(`Forbidden — role "${roleName}" not found`), {
          statusCode: 403,
        }),
      );
      return;
    }

    // ── Check all required permissions are present ────────────────────────────
    const rolePerms = role.permissions.map((p) => p.name);
    const missing   = required.filter((p) => !rolePerms.includes(p));

    if (missing.length > 0) {
      next(
        Object.assign(
          new Error(`Forbidden — missing permission(s): ${missing.join(', ')}`),
          { statusCode: 403 },
        ),
      );
      return;
    }

    next();
  };
