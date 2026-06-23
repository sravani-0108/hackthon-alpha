"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const index_1 = __importDefault(require("./index"));
const models_1 = require("../models");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: index_1.default.db.host,
    port: index_1.default.db.port,
    username: index_1.default.db.user,
    password: index_1.default.db.password,
    database: index_1.default.db.name,
    synchronize: false,
    logging: index_1.default.env === 'development',
    extra: {
        connectionTimeoutMillis: 30000,
    },
    entities: [
        models_1.User,
        models_1.Customer,
        models_1.Account,
        models_1.Transaction,
        models_1.Alert,
        models_1.AlertEvidence,
        models_1.Investigation,
        models_1.AgentResult,
        models_1.Case,
        models_1.SarReport,
        models_1.Notification,
    ],
});
const initializeDatabase = async () => {
    if (!exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.initialize();
    }
    return exports.AppDataSource;
};
exports.initializeDatabase = initializeDatabase;
exports.default = exports.AppDataSource;
//# sourceMappingURL=database.js.map