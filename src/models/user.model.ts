import mongoose, { Document, Schema, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IProfile {
  avatar?:   string; // relative path served to clients
  avatarId?: string; // original filename — used to locate & delete the file
}

export interface IUser extends Document {
  name: string;
  email: string;
  /** Stored as bcrypt hash; field is named `password` in the collection. */
  password: string;
  access_token?: string;
  refresh_token?: string;
  role?: mongoose.Types.ObjectId | null;
  profile: IProfile;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned by default
    },
    access_token: { type: String, select: false },
    refresh_token: { type: String, select: false },
    role:    { type: Schema.Types.ObjectId, ref: 'Role', default: null },
    profile: {
      avatar:   { type: String, default: '' },
      avatarId: { type: String, default: '' }, // filename only, e.g. "1726490123-456.jpg"
    },
  },
  {
    timestamps: true,
    collection: "users", // explicit collection name
  },
);

// ── Pre-save hook: hash password ───────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: verify plain password against stored hash ─────────────────
userSchema.methods.comparePassword = function (
  candidate: string,
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default User;
