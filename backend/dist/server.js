"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const database_1 = require("./config/database");
const sockets_1 = require("./sockets");
let server;
const shutdown = (signal) => {
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
const startServer = async () => {
    try {
        await (0, database_1.initializeDatabase)();
        console.log('Database connection established.');
        server = http_1.default.createServer(app_1.default);
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: config_1.default.corsOrigin,
                methods: ['GET', 'POST'],
            },
        });
        (0, sockets_1.initializeSocket)(io);
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${config_1.default.port} is already in use. Stop the other process or set PORT to a free port in .env`);
            }
            else {
                console.error('[Server] HTTP error:', error.message);
            }
            process.exit(1);
        });
        server.listen(config_1.default.port, () => {
            console.log(`AML Backend running on port ${config_1.default.port}`);
            console.log(`API: http://localhost:${config_1.default.port}${config_1.default.apiPrefix}`);
            console.log(`Swagger: http://localhost:${config_1.default.port}/api-docs`);
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to start server:', message);
        if (message.includes('ETIMEDOUT') || message.includes('ECONNREFUSED')) {
            console.error('Database connection failed. Check DATABASE_URL, VPN/network access, and that PostgreSQL is reachable.');
        }
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map