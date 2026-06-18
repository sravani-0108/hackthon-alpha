"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../config"));
const DEMO_PASSWORD = 'Manager@123';
const DEMO_USERS = ['manager@bank.com', 'admin@bank.com'];
async function resetAuth() {
    const client = new pg_1.Client({
        host: config_1.default.db.host,
        port: config_1.default.db.port,
        user: config_1.default.db.user,
        password: config_1.default.db.password,
        database: config_1.default.db.name,
    });
    try {
        await client.connect();
        const passwordHash = await bcrypt_1.default.hash(DEMO_PASSWORD, 12);
        for (const email of DEMO_USERS) {
            const result = await client.query(`UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id`, [passwordHash, email]);
            if (result.rowCount) {
                console.log(`  ✓ Reset password for ${email}`);
            }
            else {
                await client.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`, [
                    email === 'manager@bank.com' ? 'Rajesh Kumar' : 'Admin User',
                    email,
                    passwordHash,
                    email === 'manager@bank.com' ? 'bank_manager' : 'admin',
                ]);
                console.log(`  + Created ${email}`);
            }
        }
        console.log(`\n✅ Demo login ready: manager@bank.com / ${DEMO_PASSWORD}`);
    }
    catch (error) {
        console.error('Auth reset failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
if (require.main === module) {
    resetAuth();
}
exports.default = resetAuth;
//# sourceMappingURL=runResetAuth.js.map