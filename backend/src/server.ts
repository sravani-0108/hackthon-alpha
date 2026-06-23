import 'reflect-metadata';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import config from './config';
import { initializeDatabase } from './config/database';
import { initializeSocket } from './sockets';

let server: http.Server | undefined;

const shutdown = (signal: string): void => {
  console.log(`[Server] ${signal} received, shutting down...`);
  if (!server) {
    process.exit(0);
    return;
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught exception:', error);
  shutdown('uncaughtException');
});

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    console.log('Database connection established.');

    server = http.createServer(app);

    const io = new SocketServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    initializeSocket(io);

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Port ${config.port} is already in use. Stop the other process or set PORT to a free port in .env`
        );
      } else {
        console.error('[Server] HTTP error:', error.message);
      }
      process.exit(1);
    });

    server.listen(config.port, () => {
      console.log(`AML Backend running on port ${config.port}`);
      console.log(`API: http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`Swagger: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', message);
    if (message.includes('ETIMEDOUT') || message.includes('ECONNREFUSED')) {
      console.error(
        'Database connection failed. Check DATABASE_URL, VPN/network access, and that PostgreSQL is reachable.'
      );
    }
    process.exit(1);
  }
};

startServer();
