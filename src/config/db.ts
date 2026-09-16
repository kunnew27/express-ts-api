import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined in environment variables');

  await mongoose.connect(uri);
  console.log('✅ MongoDB connected');
};

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  Mongoose disconnected');
});

export default connectDB;
