import mongoose, { Document, Schema, Model } from 'mongoose';
import { Permission } from '@/models/role.model';

// ── Human-readable descriptions for every permission ───────────────────────────
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'users:read':   'View user profiles and lists',
  'users:create': 'Create new user accounts',
  'users:update': 'Edit existing user information',
  'users:delete': 'Remove user accounts',
  'roles:manage': 'Create, update, and delete roles and permissions',
};

// ── Document interface ────────────────────────────────────────────────────────
export interface IPermission extends Document {
  name: Permission;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const permissionSchema = new Schema<IPermission>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'users:read',
        'users:create',
        'users:update',
        'users:delete',
        'roles:manage',
      ] satisfies Permission[],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true, collection: 'permissions' },
);

const PermissionModel: Model<IPermission> = mongoose.model<IPermission>(
  'Permission',
  permissionSchema,
);
export default PermissionModel;
