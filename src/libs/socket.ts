import { Server, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';

// ── Singleton instance ─────────────────────────────────────────────────────────
let io: Server | null = null;

/**
 * Initialise Socket.IO on top of the existing HTTP server.
 * Call this once in server.ts, right after creating the HTTP server.
 *
 * @example
 *   const httpServer = http.createServer(app);
 *   initSocket(httpServer);
 */
export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env['SOCKET_CORS_ORIGIN'] ?? '*',
      methods: ['GET', 'POST'],
    },
    // How long (ms) to wait before considering a client disconnected
    pingTimeout:  20_000,
    pingInterval: 25_000,
  });

  // ── Connection lifecycle ───────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    console.log(`🔌  Socket connected:    ${socket.id}`);

    // ── Room helpers ─────────────────────────────────────────────
    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`📦  ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
      console.log(`📤  ${socket.id} left room:   ${room}`);
    });

    // ── Disconnect ───────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌  Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('✅  Socket.IO initialised');
  return io;
}

/**
 * Returns the active Socket.IO server instance.
 * Throws if called before initSocket().
 *
 * @example
 *   // Emit to all connected clients
 *   getIO().emit('notification', { message: 'Hello!' });
 *
 *   // Emit to a specific room
 *   getIO().to('room-id').emit('update', payload);
 *
 *   // Emit to a specific socket
 *   getIO().to(socketId).emit('message', payload);
 */
export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialised. Call initSocket() first.');
  }
  return io;
}
