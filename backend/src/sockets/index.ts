import { Server as SocketServer } from 'socket.io';
import notificationService from '../services/notificationService';

export const initializeSocket = (io: SocketServer): void => {
  notificationService.setSocketIO(io);

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join', (userId: number) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.IO] User ${userId} joined room user_${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};
