import mongoose from 'mongoose';
import { Permission } from '@/models/role.model';
import PermissionModel from '@/models/permission.model';

/**
 * Resolves an array of permission name strings into their MongoDB ObjectIds.
 *
 * Throws a 400 error (picked up by asyncHandler -> globalErrorHandler)
 * if any name is not found in the permissions collection.
 *
 * @example
 *   const ids = await getPermissionIds(['users:read', 'users:update']);
 */
export async function getPermissionIds(
  permNames: Permission[],
): Promise<mongoose.Types.ObjectId[]> {
  if (permNames.length === 0) return [];

  const permDocs = await PermissionModel.find({ name: { $in: permNames } }).lean();

  if (permDocs.length !== permNames.length) {
    const found   = permDocs.map((p) => p.name);
    const invalid = permNames.filter((p) => !found.includes(p));
    throw Object.assign(
      new Error(`Invalid permission(s): ${invalid.join(', ')}`),
      { statusCode: 400 },
    );
  }

  return permDocs.map((p) => p._id as mongoose.Types.ObjectId);
}
