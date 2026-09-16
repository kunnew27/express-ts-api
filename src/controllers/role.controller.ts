import { Response } from 'express';
import Role, { RoleName, Permission } from '@/models/role.model';
import { AuthRequest } from '@/types';
import { getPermissionIds } from '@/utils/permission.utils';

type PopulatedPermission = { _id: unknown; name: Permission; description: string };

// ── GET /api/roles ────────────────────────────────────────────────────────────
export const getRoles = async (_req: AuthRequest, res: Response): Promise<void> => {
  const roles = await Role
    .find()
    .populate<{ permissions: PopulatedPermission[] }>('permissions')
    .lean();
  res.status(200).json({ status: 'success', data: { roles } });
};

// ── GET /api/roles/:id ────────────────────────────────────────────────────────
export const getRoleById = async (req: AuthRequest, res: Response): Promise<void> => {
  const role = await Role
    .findById(req.params['id'])
    .populate<{ permissions: PopulatedPermission[] }>('permissions')
    .lean();
  if (!role) {
    res.status(404).json({ status: 'error', message: 'Role not found' });
    return;
  }
  res.status(200).json({ status: 'success', data: { role } });
};

// ── POST /api/roles ───────────────────────────────────────────────────────────
export const createRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, permissions: permNames = [] } = req.body as {
    name: RoleName;
    permissions?: Permission[];
  };

  const exists = await Role.findOne({ name });
  if (exists) {
    res.status(409).json({ status: 'error', message: `Role "${name}" already exists` });
    return;
  }

  const permIds = await getPermissionIds(permNames); // throws 400 if invalid

  const role = await (await Role.create({ name, permissions: permIds }))
    .populate<{ permissions: PopulatedPermission[] }>('permissions');

  res.status(201).json({ status: 'success', data: { role } });
};

// ── PATCH /api/roles/:id ──────────────────────────────────────────────────────
export const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { permissions: permNames } = req.body as { permissions?: Permission[] };

  const role = await Role.findById(req.params['id']);
  if (!role) {
    res.status(404).json({ status: 'error', message: 'Role not found' });
    return;
  }

  if (role.name === 'super_admin') {
    res.status(403).json({ status: 'error', message: 'super_admin permissions cannot be modified' });
    return;
  }

  if (permNames !== undefined) {
    role.permissions = await getPermissionIds(permNames); // throws 400 if invalid
  }

  await role.save();
  const populated = await role.populate<{ permissions: PopulatedPermission[] }>('permissions');

  res.status(200).json({ status: 'success', data: { role: populated } });
};

// ── DELETE /api/roles/:id ─────────────────────────────────────────────────────
export const deleteRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const role = await Role.findById(req.params['id']);
  if (!role) {
    res.status(404).json({ status: 'error', message: 'Role not found' });
    return;
  }

  if (role.name === 'super_admin') {
    res.status(403).json({ status: 'error', message: 'super_admin role cannot be deleted' });
    return;
  }

  await role.deleteOne();
  res.status(204).send();
};
