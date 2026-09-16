import { Response } from 'express';
import User from '@/models/user.model';
import Role from '@/models/role.model';
import { AuthRequest } from '@/types';
import { deleteUploadedFile, getAvatarFields } from '@/libs/multer';

// ── GET /api/users/me ─────────────────────────────────────────────────────────────
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    res.status(404).json({ status: 'error', message: 'User not found' });
    return;
  }
  res.status(200).json({ status: 'success', data: { user } });
};

// ── GET /api/users ────────────────────────────────────────────────────────────────
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page       = Math.max(1, parseInt(String(req.query['page']  ?? '1'),  10));
  const limit      = Math.min(100, Math.max(1, parseInt(String(req.query['limit'] ?? '10'), 10)));
  const search     = String(req.query['search'] ?? '').trim();
  const skip       = (page - 1) * limit;

  const SORTABLE_FIELDS = ['name', 'email', 'createdAt', 'updatedAt'] as const;
  type SortableField    = (typeof SORTABLE_FIELDS)[number];
  const rawSortBy       = String(req.query['sortBy']    ?? 'createdAt');
  const rawSortOrder    = String(req.query['sortOrder'] ?? 'desc');
  const sortBy: SortableField = (SORTABLE_FIELDS as readonly string[]).includes(rawSortBy)
    ? (rawSortBy as SortableField) : 'createdAt';
  const sortOrder = rawSortOrder === 'asc' ? 1 : -1;

  const filter = search
    ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
    : {};

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).skip(skip).limit(limit).sort({ [sortBy]: sortOrder }),
  ]);

  const totalPages = Math.ceil(total / limit);
  res.status(200).json({
    status: 'success',
    data: { users },
    pagination: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  });
};

// ── POST /api/users ────────────────────────────────────────────────────────────────
// multipart/form-data: name, email, password, role? + optional avatar file
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role: roleName = 'user' } = req.body as {
    name: string; email: string; password: string; role?: string;
  };

  const exists = await User.findOne({ email });
  if (exists) {
    deleteUploadedFile(req.file?.filename); // discard upload — email taken
    res.status(409).json({ status: 'error', message: 'Email is already registered' });
    return;
  }

  const role = await Role.findOne({ name: roleName });
  if (!role) {
    deleteUploadedFile(req.file?.filename); // discard upload — invalid role
    res.status(400).json({ status: 'error', message: `Role "${roleName}" not found` });
    return;
  }

  const profile = req.file
    ? getAvatarFields(req.file)
    : { avatar: '', avatarId: '' };

  const user = await User.create({ name, email, password, role: role._id, profile });
  res.status(201).json({ status: 'success', data: { user } });
};

// ── GET /api/users/:id ────────────────────────────────────────────────────────────
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params['id']);
  if (!user) {
    res.status(404).json({ status: 'error', message: 'User not found' });
    return;
  }
  res.status(200).json({ status: 'success', data: { user } });
};

// ── PATCH /api/users/:id ───────────────────────────────────────────────────────────
// multipart/form-data: name?, email?, avatar? (optional file)
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params['id']);
  if (!user) {
    deleteUploadedFile(req.file?.filename); // discard upload — user not found
    res.status(404).json({ status: 'error', message: 'User not found' });
    return;
  }

  const { name, email } = req.body as { name?: string; email?: string };
  if (name)  user.name  = name;
  if (email) user.email = email;

  // ── Avatar: delete old by avatarId, save new ─────────────────────────────────
  if (req.file) {
    deleteUploadedFile(user.profile?.avatarId);                       // remove old
    user.profile = { ...user.profile, ...getAvatarFields(req.file) }; // store new
  }

  await user.save();
  res.status(200).json({ status: 'success', data: { user } });
};

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────────
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findByIdAndDelete(req.params['id']);
  if (!user) {
    res.status(404).json({ status: 'error', message: 'User not found' });
    return;
  }
  deleteUploadedFile(user.profile?.avatarId); // clean up avatar file by avatarId
  res.status(204).send();
};
