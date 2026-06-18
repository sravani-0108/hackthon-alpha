"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
async function runMigrations() {
    try {
        const client = new pg_1.Client({
            host: config_1.default.db.host,
            port: config_1.default.db.port,
            user: config_1.default.db.user,
            password: config_1.default.db.password,
            database: config_1.default.db.name,
            ssl: false,
        });
        await client.connect();
        console.log(`Connected to database: ${config_1.default.db.host}/${config_1.default.db.name}`);
        const schemaPath = path_1.default.join(__dirname, '../docs/schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        await client.query(schema);
        await client.end();
        console.log('Database schema migrated successfully.');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Migration failed:', message);
        process.exit(1);
    }
}
if (require.main === module) {
    runMigrations();
}
exports.default = runMigrations;
//# sourceMappingURL=runMigrations.js.map