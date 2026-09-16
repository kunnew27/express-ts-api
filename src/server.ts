import 'dotenv/config';
import http from 'http';
import app from '@/app';
import connectDB from '@/config/db';
import { initSocket } from '@/libs/socket';

const PORT = Number(process.env['PORT']) || 3000;

const start = async (): Promise<void> => {
  await connectDB();

  // Wrap Express in a raw HTTP server so Socket.IO can share the same port
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}  [${process.env['NODE_ENV'] ?? 'development'}]`,
    );
  });
};

start().catch((err: unknown) => {
  console.error('💥 Failed to start server:', err);
  process.exit(1);
});
