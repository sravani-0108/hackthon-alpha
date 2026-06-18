"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
const HIGH_RISK_COUNTRIES = [
    'Malaysia',
    'Chinese Taipei',
    'South Sudan',
    'Sierra Leone',
    'Guatemala',
    'Montserrat',
    'Lesotho',
    'Denmark',
    'Madagascar',
    'Slovenia',
    'Saint Lucia',
    'Kuwait',
    'Colombia',
    'Oman',
    'Poland',
];
async function seed() {
    const client = new pg_1.Client({
        host: config_1.default.db.host,
        port: config_1.default.db.port,
        user: config_1.default.db.user,
        password: config_1.default.db.password,
        database: config_1.default.db.name,
    });
    try {
        await client.connect();
        console.log('Connected to database for seeding...');
        for (const country of HIGH_RISK_COUNTRIES) {
            await client.query(`INSERT INTO high_risk_countries (country_name, is_active, updated_at)
         VALUES ($1, true, CURRENT_TIMESTAMP)
         ON CONFLICT (country_name)
         DO UPDATE SET is_active = EXCLUDED.is_active, updated_at = CURRENT_TIMESTAMP`, [country]);
        }
        console.log(`High-risk countries upserted: ${HIGH_RISK_COUNTRIES.length}`);
        const existing = await client.query('SELECT COUNT(*) FROM users');
        if (parseInt(existing.rows[0].count, 10) > 0) {
            console.log('Seed data already exists. Run npm run db:fix to repair linkages.');
            return;
        }
        const bcrypt = await Promise.resolve().then(() => __importStar(require('bcrypt')));
        const passwordHash = await bcrypt.hash('Manager@123', 12);
        const managerResult = await client.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id`, ['Rajesh Kumar', 'manager@bank.com', passwordHash, 'bank_manager']);
        const managerId = managerResult.rows[0].id;
        await client.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)`, [
            'Admin User', 'admin@bank.com', passwordHash, 'admin',
        ]);
        const customers = [
            ['CUST-100', 'Amit Sharma', '1985-03-15', '12 MG Road, Mumbai', 'ABCDE1234F', '123456789012', 'Business Owner', 'India', false, 15, 'Low'],
            ['CUST-101', 'Priya Patel', '1990-07-22', '45 Ring Road, Ahmedabad', 'FGHIJ5678K', '234567890123', 'Software Engineer', 'India', false, 25, 'Low'],
            ['CUST-102', 'Vikram Singh', '1978-11-08', '78 Civil Lines, Delhi', 'KLMNO9012P', '345678901234', 'Import/Export Trader', 'India', true, 45, 'Medium'],
            ['CUST-103', 'Sneha Reddy', '1992-01-30', '23 Banjara Hills, Hyderabad', 'PQRST3456U', '456789012345', 'Real Estate Agent', 'India', false, 55, 'Medium'],
            ['CUST-104', 'Mohammed Ali', '1980-06-12', '56 Park Street, Kolkata', 'UVWXY7890Z', '567890123456', 'Jeweler', 'India', true, 70, 'High'],
            ['CUST-105', 'Rahul Mehta', '1988-04-18', '90 Nariman Point, Mumbai', 'ABCPQ1234R', null, 'Investment Banker', 'India', false, 20, 'Low'],
        ];
        const customerIds = [];
        for (const c of customers) {
            const r = await client.query(`INSERT INTO customers (customer_number, name, dob, address, pan, aadhaar, occupation, country, is_pep, risk_score, risk_category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, c);
            customerIds.push(r.rows[0].id);
        }
        const accountsData = [
            [customerIds[0], 'ACC10001', 'Savings', 250000],
            [customerIds[0], 'ACC10002', 'Current', 1500000],
            [customerIds[1], 'ACC10003', 'Savings', 180000],
            [customerIds[2], 'ACC10004', 'Current', 3200000],
            [customerIds[3], 'ACC10005', 'Savings', 95000],
            [customerIds[4], 'ACC10006', 'NRI', 5800000],
            [customerIds[5], 'ACC10007', 'Savings', 420000],
        ];
        const accountIds = [];
        for (const a of accountsData) {
            const r = await client.query(`INSERT INTO accounts (customer_id, account_number, account_type, balance, opened_at)
         VALUES ($1,$2,$3,$4, NOW() - INTERVAL '2 years') RETURNING id`, a);
            accountIds.push(r.rows[0].id);
        }
        const now = Date.now();
        const day = (d) => new Date(now - d * 86400000);
        // Each transaction on the CORRECT customer account
        const txns = [
            [accountIds[0], 25000, 'Deposit', 'EXT001', 'ACC10001', 'India', day(5)],
            [accountIds[1], 80000, 'Transfer', 'ACC10002', 'EXT100', 'India', day(20)],
            [accountIds[1], 95000, 'Transfer', 'ACC10002', 'EXT101', 'India', day(15)],
            // Vikram baseline + alert txn
            [accountIds[3], 85000, 'Transfer', 'ACC10004', 'EXT200', 'India', day(60)],
            [accountIds[3], 92000, 'Transfer', 'ACC10004', 'EXT201', 'India', day(45)],
            [accountIds[3], 1500000, 'Transfer', 'ACC10004', 'EXT999', 'India', day(2)],
            // Sneha baseline + alert txn
            [accountIds[4], 65000, 'Deposit', 'EXT300', 'ACC10005', 'India', day(55)],
            [accountIds[4], 2500000, 'Transfer', 'ACC10005', 'EXT888', 'India', day(1)],
            // Mohammed Ali — Iran + structuring
            [accountIds[5], 350000, 'Transfer', 'ACC10006', 'EXT777', 'Iran', day(0.5)],
            [accountIds[5], 45000, 'Withdrawal', 'ACC10006', 'ATM001', 'India', day(0.25)],
            [accountIds[5], 48000, 'Withdrawal', 'ACC10006', 'ATM002', 'India', day(0.2)],
            [accountIds[6], 15000, 'Deposit', 'EXT200', 'ACC10007', 'India', day(3)],
        ];
        const txnIds = [];
        for (const t of txns) {
            const r = await client.query(`INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Completed') RETURNING id`, t);
            txnIds.push(r.rows[0].id);
        }
        const alertsData = [
            ['ALT-1001', customerIds[2], txnIds[5], 'Large Transaction', 'High Value Transfer — 17x monthly average', 75, 'High', 'Open'],
            ['ALT-1002', customerIds[3], txnIds[7], 'Large Transaction', 'High Value Transfer — 38x monthly average', 80, 'Critical', 'Open'],
            ['ALT-1003', customerIds[4], txnIds[8], 'High-Risk Country', 'Transfer to Iran — sanctioned jurisdiction', 90, 'Critical', 'Open'],
            ['ALT-1004', customerIds[4], txnIds[9], 'Structuring', 'Multiple sub-threshold withdrawals within 24h', 65, 'High', 'Open'],
        ];
        for (const al of alertsData) {
            await client.query(`INSERT INTO alerts (alert_code, customer_id, transaction_id, alert_type, reason, risk_score, severity, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, al);
        }
        await client.query(`INSERT INTO notifications (title, message, user_id, is_read) VALUES
       ('Welcome to AML System', 'Your account has been set up successfully.', $1, false),
       ('System Initialized', 'AML monitoring is now active.', $1, true)`, [managerId]);
        console.log('Seed data created successfully.');
        console.log('Login: manager@bank.com / Manager@123');
    }
    catch (error) {
        console.error('Seeding failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
if (require.main === module)
    seed();
exports.default = seed;
//# sourceMappingURL=runSeeders.js.map