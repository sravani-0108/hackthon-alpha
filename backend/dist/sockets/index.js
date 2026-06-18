"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = void 0;
const notificationService_1 = __importDefault(require("../services/notificationService"));
const initializeSocket = (io) => {
    notificationService_1.default.setSocketIO(io);
    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);
        socket.on('join', (userId) => {
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
exports.initializeSocket = initializeSocket;
//# sourceMappingURL=index.js.map