import { Request, Response } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import User from "@/models/user.model";
import Role, { type IRole } from "@/models/role.model";

// ── Helpers ───────────────────────────────────────────────────────────────────

const sign = (payload: object, secret: string, expiresIn: string): string =>
  jwt.sign(payload, secret, { expiresIn } as SignOptions);

const generateTokens = (
  id: string,
  email: string,
  role: string,
): { access_token: string; refresh_token: string } => ({
  access_token: sign(
    { id, email, role },
    process.env.JWT_ACCESS_SECRET!,
    process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  ),
  refresh_token: sign(
    { id, email, role },
    process.env.JWT_REFRESH_SECRET!,
    process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  ),
});

// ── Controllers ──────────────────────────────────────────────────────────────

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  const exists = await User.findOne({ email });
  if (exists) {
    res
      .status(409)
      .json({ status: "error", message: "Email is already registered" });
    return;
  }

  const userRole = await Role.findOne({ name: 'user' });
  const user = await User.create({ name, email, password, role: userRole?._id ?? null });
  const tokens = generateTokens(String(user.id), user.email, 'user');

  // Persist tokens to the document
  await User.findByIdAndUpdate(user._id, tokens);

  res.status(201).json({
    status: "success",
    data: {
      user: { id: user._id, name: user.name, email: user.email },
      ...tokens,
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email }).select("+password").populate<{ role: IRole | null }>('role');
  if (!user || !(await user.comparePassword(password))) {
    res
      .status(401)
      .json({ status: "error", message: "Invalid email or password" });
    return;
  }

  const tokens = generateTokens(String(user.id), user.email, user.role?.name ?? 'user');
  await User.findByIdAndUpdate(user._id, tokens);

  res.status(200).json({
    status: "success",
    data: {
      user: { id: user._id, name: user.name, email: user.email },
      ...tokens,
    },
  });
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { refresh_token } = req.body as { refresh_token: string };

  const decoded = jwt.verify(
    refresh_token,
    process.env.JWT_REFRESH_SECRET!,
  ) as { id: string; email: string };

  const user = await User.findById(decoded.id).select("+refresh_token").populate<{ role: IRole | null }>('role');
  if (!user || user.refresh_token !== refresh_token) {
    res
      .status(401)
      .json({ status: "error", message: "Invalid or expired refresh token" });
    return;
  }

  const tokens = generateTokens(String(user.id), user.email, user.role?.name ?? 'user');
  await User.findByIdAndUpdate(user._id, tokens);

  res.status(200).json({ status: "success", data: tokens });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully" });
};
