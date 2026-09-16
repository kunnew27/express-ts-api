import 'dotenv/config';
import app from '@/app';
import connectDB from '@/config/db';

const PORT = Number(process.env['PORT']) || 3000;

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}  [${process.env['NODE_ENV'] ?? 'development'}]`
    );
  });
};

start().catch((err: unknown) => {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
});
