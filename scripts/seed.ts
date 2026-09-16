/// <reference types="node" />
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/user.model';

const SUPER_USER = {
  name: 'Super',
  email: 'super@example.com',
  password: 'superpwd@2025',
};

const seed = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const existing = await User.findOne({ email: SUPER_USER.email });

  if (existing) {
    console.log(`⚠️  Superuser "${SUPER_USER.email}" already exists — skipping.`);
  } else {
    const user = await User.create(SUPER_USER);
    console.log(`🌱 Superuser created:`);
    console.log(`   id    : ${user._id.toString()}`);
    console.log(`   name  : ${user.name}`);
    console.log(`   email : ${user.email}`);
  }

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
};

seed().catch((err: unknown) => {
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
