import mongoose, { Document, Schema, Model } from "mongoose";

// ── Permission catalogue ──────────────────────────────────────────────────────
export type Permission =
  | "users:read"
  | "users:create"
  | "users:update"
  | "users:delete"
  | "roles:manage";

// ── Role names ────────────────────────────────────────────────────────────────
export type RoleName = "super_admin" | "admin" | "user";

// ── Document interface ────────────────────────────────────────────────────────
export interface IRole extends Document {
  name: RoleName;
  permissions: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["super_admin", "admin", "user"] satisfies RoleName[],
    },
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
  },
  { timestamps: true, collection: "roles" },
);

const Role: Model<IRole> = mongoose.model<IRole>("Role", roleSchema);

export default Role;
