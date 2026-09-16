import multer, { type FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

// ── Types ────────────────────────────────────────────────────────────────────
export type FileCategory = "image" | "document" | "video" | "any";

const ALLOWED_MIMES: Record<FileCategory, string[]> = {
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/csv",
  ],
  video: ["video/mp4", "video/webm", "video/ogg"],
  any: [], // empty = allow all
};

// ── Storage: Memory (returns buffer — good for cloud uploads) ─────────────────
const memoryStorage = multer.memoryStorage();

// ── Storage: Disk (saves to /uploads/<folder>) ───────────────────────────
function diskStorage(folder = "uploads") {
  const dest = path.join(process.cwd(), folder);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

// ── File filter factory ──────────────────────────────────────────────────────────
function fileFilter(category: FileCategory) {
  return (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowed = ALLOWED_MIMES[category];
    if (allowed.length === 0 || allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed: ${allowed.join(", ")}`,
        ) as unknown as null,
        false,
      );
    }
  };
}

// ── Multer factory ───────────────────────────────────────────────────────────────
type UploadOptions = {
  category?: FileCategory; // default: 'any'
  maxSizeMB?: number; // default: 5
  storage?: "memory" | "disk"; // default: 'memory'
  folder?: string; // disk only, default: 'uploads'
};

function createUploader(options: UploadOptions = {}) {
  const {
    category = "any",
    maxSizeMB = 5,
    storage = "memory",
    folder = "uploads",
  } = options;

  return multer({
    storage: storage === "disk" ? diskStorage(folder) : memoryStorage,
    fileFilter: fileFilter(category),
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
}

// ── Ready-to-use presets ────────────────────────────────────────────────────────────

/**
 * Single file upload.
 * @param field     - Form field name (default: 'file')
 * @param options   - UploadOptions
 *
 * @example
 *   router.post('/avatar', uploadSingle('avatar', { category: 'image', maxSizeMB: 2 }), handler);
 *   // req.file → the uploaded file
 */
export function uploadSingle(field = "file", options: UploadOptions = {}) {
  return createUploader(options).single(field);
}

/**
 * Multiple files under the same field name.
 * @param field     - Form field name (default: 'files')
 * @param maxCount  - Max number of files (default: 10)
 * @param options   - UploadOptions
 *
 * @example
 *   router.post('/gallery', uploadMultiple('photos', 5, { category: 'image' }), handler);
 *   // req.files → array of files
 */
export function uploadMultiple(
  field = "files",
  maxCount = 10,
  options: UploadOptions = {},
) {
  return createUploader(options).array(field, maxCount);
}

/**
 * Multiple fields, each with their own name and limit.
 *
 * @example
 *   router.post(
 *     '/post',
 *     uploadFields([
 *       { name: 'thumbnail', maxCount: 1 },
 *       { name: 'attachments', maxCount: 5 },
 *     ]),
 *     handler,
 *   );
 *   // req.files['thumbnail'][0] → thumbnail file
 *   // req.files['attachments']  → array of attachments
 */
export function uploadFields(
  fields: Array<{ name: string; maxCount?: number }>,
  options: UploadOptions = {},
) {
  return createUploader(options).fields(fields);
}

/**
 * No-file middleware — parses multipart/form-data text fields only.
 *
 * @example
 *   router.post('/profile', uploadNone(), handler);
 */
export function uploadNone(options: UploadOptions = {}) {
  return createUploader(options).none();
}

// ── Reusable file helpers ──────────────────────────────────────────────────────────────────

/**
 * Delete a disk-stored file using its bare filename (e.g. `profile.avatarId`).
 * Builds the absolute path as `<cwd>/<folder>/<filename>`.
 * Silently no-ops when filename is falsy or the file does not exist.
 *
 * @param filename - The filename stored in the DB (e.g. "1726490123-456.jpg")
 * @param folder   - Folder relative to cwd (default: "uploads/avatars")
 *
 * @example
 *   deleteUploadedFile(user.profile?.avatarId);
 *   deleteUploadedFile(doc.fileId, 'uploads/documents');
 */
export function deleteUploadedFile(
  filename: string | undefined,
  folder = 'uploads/avatars',
): void {
  if (!filename) return;
  try {
    const abs = path.join(process.cwd(), folder, filename);
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch { /* non-critical — log in production if needed */ }
}

/**
 * Get the avatar fields to save after a successful upload.
 * Returns both the client-facing relative path (`avatar`) and the
 * bare filename used for future deletion (`avatarId`).
 *
 * @example
 *   user.profile = { ...user.profile, ...getAvatarFields(req.file) };
 */
export function getAvatarFields(file: Express.Multer.File) {
  return {
    avatar:   path.relative(process.cwd(), file.path).replace(/\\/g, '/'),
    avatarId: file.filename, // e.g. "1726490123-456.jpg"
  };
}
