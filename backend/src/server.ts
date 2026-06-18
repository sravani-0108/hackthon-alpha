import 'reflect-metadata';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import config from './config';
import { initializeDatabase } from './config/database';
import { initializeSocket } from './sockets';

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    console.log('Database connection established.');

    const server = http.createServer(app);

    const io = new SocketServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    initializeSocket(io);

    server.listen(config.port, () => {
      console.log(`AML Backend running on port ${config.port}`);
      console.log(`API: http://localhost:${config.port}${config.apiPrefix}`);
      console.log(`Swagger: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to start server:', message);
    process.exit(1);
  }
};

startServer();
