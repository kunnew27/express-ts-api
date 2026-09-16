import { Response } from "express";
import User from "@/models/user.model";
import Role from "@/models/role.model";
import { AuthRequest } from "@/types";

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ status: "error", message: "User not found" });
    return;
  }
  res.status(200).json({ status: "success", data: { user } });
};

export const getUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  // ── Query params ────────────────────────────────────────────────────────────
  const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query["limit"] ?? "10"), 10)),
  );
  const search = String(req.query["search"] ?? "").trim();
  const skip = (page - 1) * limit;

  // ── Sort ──────────────────────────────────────────────────────────────────────
  const SORTABLE_FIELDS = ["name", "email", "createdAt", "updatedAt"] as const;
  type SortableField = (typeof SORTABLE_FIELDS)[number];

  const rawSortBy = String(req.query["sortBy"] ?? "createdAt");
  const rawSortOrder = String(req.query["sortOrder"] ?? "desc");

  const sortBy: SortableField = (SORTABLE_FIELDS as readonly string[]).includes(
    rawSortBy,
  )
    ? (rawSortBy as SortableField)
    : "createdAt";
  const sortOrder = rawSortOrder === "asc" ? 1 : -1;

  // ── Filter: $regex search across name + email (case-insensitive) ────────────
  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  // ── Run count + paginated query in parallel ──────────────────────────────────
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ [sortBy]: sortOrder }),
  ]);

  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: "success",
    data: { users },
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export const createUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const { name, email, password, role: roleName = 'user' } = req.body as {
    name: string;
    email: string;
    password: string;
    role?: string;
  };

  // ── Duplicate email check ─────────────────────────────────────────────────
  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409).json({ status: "error", message: "Email is already registered" });
    return;
  }

  // ── Resolve role ───────────────────────────────────────────────────────────
  const role = await Role.findOne({ name: roleName });
  if (!role) {
    res.status(400).json({ status: "error", message: `Role "${roleName}" not found` });
    return;
  }

  // ── Create user ────────────────────────────────────────────────────────────
  const user = await User.create({ name, email, password, role: role._id });

  res.status(201).json({ status: "success", data: { user } });
};

export const getUserById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = await User.findById(req.params["id"]);
  if (!user) {
    res.status(404).json({ status: "error", message: "User not found" });
    return;
  }
  res.status(200).json({ status: "success", data: { user } });
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = await User.findByIdAndUpdate(
    req.params["id"],
    { $set: req.body as Record<string, unknown> },
    { new: true, runValidators: true },
  );
  if (!user) {
    res.status(404).json({ status: "error", message: "User not found" });
    return;
  }
  res.status(200).json({ status: "success", data: { user } });
};

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = await User.findByIdAndDelete(req.params["id"]);
  if (!user) {
    res.status(404).json({ status: "error", message: "User not found" });
    return;
  }
  res.status(204).send();
};
