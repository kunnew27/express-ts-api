/**
 * seed.ts — bootstraps permissions, roles, and a super-admin user.
 *
 * Always runs a FULL RESEED:
 *   1. Deletes every document from all managed collections (permissions, roles, users).
 *   2. Inserts permissions.
 *   3. Inserts roles (referencing permission names).
 *   4. Creates the super-admin user.
 *
 * Run:  npx tsx src/seed.ts
 * Or add to package.json:  "seed": "tsx src/seed.ts"
 *
 * Override super-admin credentials via .env:
 *   SUPER_ADMIN_EMAIL=you@company.com
 *   SUPER_ADMIN_PASSWORD=YourStrongPassword
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import PermissionModel, { PERMISSION_DESCRIPTIONS } from '@/models/permission.model';
import Role, { RoleName, Permission } from '@/models/role.model';
import User from '@/models/user.model';

// ── Role → permission map (single source of truth) ────────────────────────────────
const ROLE_DEFINITIONS: Record<RoleName, Permission[]> = {
  /**
   * super_admin — unrestricted.
   * requirePermission() short-circuits for this role; no DB lookup needed.
   */
  super_admin: [
    'users:read',
    'users:create',
    'users:update',
    'users:delete',
    'roles:manage',
  ],

  /** admin — manages users but cannot touch roles/permissions. */
  admin: [
    'users:read',
    'users:update',
    'users:delete',
  ],

  /** user — read-only. */
  user: [
    'users:read',
  ],
};

// ── Tiny logger ───────────────────────────────────────────────────────────────
const log = {
  section: (msg: string) => console.log(`\n${msg}`),
  ok:      (msg: string) => console.log(`   ✔  ${msg}`),
  deleted: (col: string, n: number) =>
    console.log(`   ✗  ${col.padEnd(14)} → ${n} document(s) deleted`),
};

// ── Main ──────────────────────────────────────────────────────────────────────
async function seed(): Promise<void> {
  await connectDB();

  // ── Step 0: wipe all managed collections ─────────────────────────────────────
  log.section('🗑️   Clearing collections...');
  const [pDel, rDel, uDel] = await Promise.all([
    PermissionModel.deleteMany({}),
    Role.deleteMany({}),
    User.deleteMany({}),
  ]);
  log.deleted('permissions', pDel.deletedCount);
  log.deleted('roles', rDel.deletedCount);
  log.deleted('users', uDel.deletedCount);

  // ── Step 1: seed permissions ───────────────────────────────────────────────
  log.section('🌱  Seeding permissions...');
  const permEntries = Object.entries(PERMISSION_DESCRIPTIONS) as [Permission, string][];
  for (const [name, description] of permEntries) {
    await PermissionModel.create({ name, description });
    log.ok(`${name.padEnd(18)} → ${description}`);
  }

  // ── Step 2: seed roles (linked to Permission ObjectIds) ────────────────────
  log.section('🌱  Seeding roles...');

  // Build name → _id map from the freshly inserted permissions
  const allPerms = await PermissionModel.find({}).lean();
  const permMap  = new Map(allPerms.map((p) => [p.name as Permission, p._id]));

  for (const [name, permNames] of Object.entries(ROLE_DEFINITIONS) as [
    RoleName,
    Permission[],
  ][]) {
    const permIds = permNames.map((n) => {
      const id = permMap.get(n);
      if (!id) throw new Error(`Permission "${n}" not found after seed — aborting`);
      return id;
    });
    await Role.create({ name, permissions: permIds });
    log.ok(`${name.padEnd(12)} → [${permNames.join(', ')}]`);
  }

  // ── Step 3: seed super-admin user ─────────────────────────────────────────
  log.section('🌱  Seeding super admin user...');
  const email    = process.env.SUPER_ADMIN_EMAIL    ?? 'super@admin.com';
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'SuperAdmin@123';

  const superRole = await Role.findOne({ name: 'super_admin' });
  if (!superRole) throw new Error('super_admin role not found after seed — aborting');

  await User.create({ name: 'Super Admin', email, password, role: superRole._id });
  log.ok(`Super admin created  →  ${email}`);

  // ── Done ──────────────────────────────────────────────────────────────────
  await mongoose.disconnect();
  console.log('\n✅  Seed complete\n');
}

seed().catch((err: unknown) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
