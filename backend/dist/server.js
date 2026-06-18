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
const startServer = async () => {
    try {
        await (0, database_1.initializeDatabase)();
        console.log('Database connection established.');
        const server = http_1.default.createServer(app_1.default);
        const io = new socket_io_1.Server(server, {
            cors: {
                origin: config_1.default.corsOrigin,
                methods: ['GET', 'POST'],
            },
        });
        (0, sockets_1.initializeSocket)(io);
        server.listen(config_1.default.port, () => {
            console.log(`AML Backend running on port ${config_1.default.port}`);
            console.log(`API: http://localhost:${config_1.default.port}${config_1.default.apiPrefix}`);
            console.log(`Swagger: http://localhost:${config_1.default.port}/api-docs`);
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to start server:', message);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map