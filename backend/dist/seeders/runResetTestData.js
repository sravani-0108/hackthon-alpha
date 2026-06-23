"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
/**
 * Wipes all AML demo data (keeps users) and inserts exactly 5 open alerts for ADK testing.
 */
async function resetTestData() {
    const client = new pg_1.Client({
        host: config_1.default.db.host,
        port: config_1.default.db.port,
        user: config_1.default.db.user,
        password: config_1.default.db.password,
        database: config_1.default.db.name,
    });
    try {
        await client.connect();
        console.log('Resetting AML data and loading 5 test records...\n');
        const manager = await client.query(`SELECT id FROM users WHERE email = 'manager@bank.com' LIMIT 1`);
        if (!manager.rows.length) {
            console.error('No manager user found. Run: npm run db:seed');
            process.exit(1);
        }
        const managerId = manager.rows[0].id;
        await client.query('BEGIN');
        await client.query('DELETE FROM sar_reports');
        await client.query('DELETE FROM cases');
        await client.query('DELETE FROM agent_results');
        await client.query('DELETE FROM investigations');
        await client.query('DELETE FROM alert_evidence');
        await client.query('DELETE FROM alerts');
        await client.query('DELETE FROM transactions');
        await client.query('DELETE FROM accounts');
        await client.query('DELETE FROM customers');
        await client.query('DELETE FROM notifications');
        console.log('  Cleared customers, alerts, investigations, cases\n');
        const now = Date.now();
        const day = (d) => new Date(now - d * 86400000);
        const scenarios = [
            {
                customer: {
                    num: 'CUST-T001',
                    name: 'Priya Nair',
                    dob: '1994-06-12',
                    address: '12 MG Road, Kochi',
                    pan: 'PRYN1001A',
                    occupation: 'Software Engineer',
                    country: 'India',
                    is_pep: false,
                    risk_score: 10,
                    risk_category: 'Low',
                },
                account: { num: 'ACCT-T001', type: 'Savings', balance: 185000 },
                history: [
                    { amount: 85000, type: 'Deposit', from: 'EMP-SAL', daysAgo: 45 },
                    { amount: 82000, type: 'Deposit', from: 'EMP-SAL', daysAgo: 15 },
                ],
                trigger: { amount: 88000, type: 'Deposit', from: 'EMP-SAL', daysAgo: 1 },
                alert: {
                    code: 'ALT-T001',
                    type: 'Low Value Alert',
                    reason: 'Routine salary credit — false positive test',
                    risk_score: 12,
                    severity: 'Low',
                    expected: 'CLEAR',
                },
            },
            {
                customer: {
                    num: 'CUST-T002',
                    name: 'Arjun Mehta',
                    dob: '1985-03-20',
                    address: '44 BKC, Mumbai',
                    pan: 'ARJM1002B',
                    occupation: 'Chartered Accountant',
                    country: 'India',
                    is_pep: false,
                    risk_score: 35,
                    risk_category: 'Medium',
                },
                account: { num: 'ACCT-T002', type: 'Current', balance: 920000 },
                history: [
                    { amount: 75000, type: 'Transfer', from: 'ACCT-T002', to: 'EXT-01', daysAgo: 40 },
                    { amount: 68000, type: 'Transfer', from: 'ACCT-T002', to: 'EXT-02', daysAgo: 20 },
                ],
                trigger: { amount: 1850000, type: 'Transfer', from: 'ACCT-T002', to: 'EXT-INTL', daysAgo: 1 },
                alert: {
                    code: 'ALT-T002',
                    type: 'Large Transaction',
                    reason: '₹18.5L transfer — ~25× monthly average',
                    risk_score: 74,
                    severity: 'High',
                    expected: 'ESCALATE',
                },
            },
            {
                customer: {
                    num: 'CUST-T003',
                    name: 'Nirav Modi',
                    dob: '1971-02-27',
                    address: 'Mumbai, India',
                    pan: 'NIRV1003C',
                    occupation: 'Jewelry Trader',
                    country: 'India',
                    is_pep: false,
                    risk_score: 68,
                    risk_category: 'High',
                },
                account: { num: 'ACCT-T003', type: 'Current', balance: 2500000 },
                history: [
                    { amount: 200000, type: 'Deposit', from: 'EXT-IN', to: 'ACCT-T003', daysAgo: 30 },
                ],
                trigger: { amount: 950000, type: 'Transfer', from: 'ACCT-T003', to: 'EXT-UAE', daysAgo: 2 },
                alert: {
                    code: 'ALT-T003',
                    type: 'Adverse Media',
                    reason: 'Customer name has known public fraud/money laundering allegations in open sources',
                    risk_score: 82,
                    severity: 'Critical',
                    expected: 'ESCALATE / SAR (media fail)',
                },
            },
            {
                customer: {
                    num: 'CUST-T004',
                    name: 'Farid Khan',
                    dob: '1982-09-11',
                    address: 'Kuala Lumpur, Malaysia',
                    pan: 'FARK1004D',
                    occupation: 'Business Owner',
                    country: 'Malaysia',
                    is_pep: false,
                    risk_score: 88,
                    risk_category: 'High',
                },
                account: { num: 'ACCT-T004', type: 'NRI', balance: 4100000 },
                history: [
                    { amount: 150000, type: 'Transfer', from: 'ACCT-T004', to: 'EXT-SG', daysAgo: 25 },
                ],
                trigger: {
                    amount: 1200000,
                    type: 'Transfer',
                    from: 'ACCT-T004',
                    to: 'EXT-MY',
                    country: 'Malaysia',
                    daysAgo: 1,
                },
                alert: {
                    code: 'ALT-T004',
                    type: 'High-Risk Country',
                    reason: '₹12L transfer involving Malaysia — configured high-risk country transaction',
                    risk_score: 92,
                    severity: 'Critical',
                    expected: 'ESCALATE / SAR (high-risk country fail)',
                },
            },
            {
                customer: {
                    num: 'CUST-T005',
                    name: 'Sneha Kapoor',
                    dob: '1990-11-05',
                    address: '8 Jubilee Hills, Hyderabad',
                    pan: 'SNEH1005E',
                    occupation: 'Real Estate Agent',
                    country: 'India',
                    is_pep: false,
                    risk_score: 42,
                    risk_category: 'Medium',
                },
                account: { num: 'ACCT-T005', type: 'Savings', balance: 340000 },
                history: [
                    { amount: 95000, type: 'Deposit', from: 'CLIENT-01', daysAgo: 35 },
                    { amount: 48000, type: 'Withdrawal', from: 'ACCT-T005', to: 'ATM-01', daysAgo: 3 },
                    { amount: 49500, type: 'Withdrawal', from: 'ACCT-T005', to: 'ATM-02', daysAgo: 2 },
                ],
                trigger: { amount: 49800, type: 'Withdrawal', from: 'ACCT-T005', to: 'ATM-03', daysAgo: 1 },
                alert: {
                    code: 'ALT-T005',
                    type: 'Structuring',
                    reason: 'Multiple sub-₹50k withdrawals within 72h — structuring pattern',
                    risk_score: 58,
                    severity: 'Medium',
                    expected: 'ESCALATE',
                },
            },
        ];
        for (const s of scenarios) {
            const custIns = await client.query(`INSERT INTO customers (customer_number, name, dob, address, pan, occupation, country, is_pep, risk_score, risk_category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [
                s.customer.num,
                s.customer.name,
                s.customer.dob,
                s.customer.address,
                s.customer.pan,
                s.customer.occupation,
                s.customer.country,
                s.customer.is_pep,
                s.customer.risk_score,
                s.customer.risk_category,
            ]);
            const custId = custIns.rows[0].id;
            const accIns = await client.query(`INSERT INTO accounts (customer_id, account_number, account_type, balance, opened_at)
         VALUES ($1,$2,$3,$4, NOW() - INTERVAL '2 years') RETURNING id`, [custId, s.account.num, s.account.type, s.account.balance]);
            const accId = accIns.rows[0].id;
            for (const h of s.history) {
                await client.query(`INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
           VALUES ($1,$2,$3,$4,$5,'India',$6,'Completed')`, [accId, h.amount, h.type, h.from, 'to' in h ? (h.to ?? s.account.num) : s.account.num, day(h.daysAgo)]);
            }
            const triggerCountry = s.trigger.country ?? 'India';
            const triggerIns = await client.query(`INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Completed') RETURNING id`, [
                accId,
                s.trigger.amount,
                s.trigger.type,
                s.trigger.from,
                s.trigger.to ?? s.account.num,
                triggerCountry,
                day(s.trigger.daysAgo),
            ]);
            await client.query(`INSERT INTO alerts (alert_code, customer_id, transaction_id, alert_type, reason, risk_score, severity, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Open')`, [
                s.alert.code,
                custId,
                triggerIns.rows[0].id,
                s.alert.type,
                s.alert.reason,
                s.alert.risk_score,
                s.alert.severity,
            ]);
            console.log(`  + ${s.alert.code} | ${s.customer.name} | ${s.alert.severity} | expect ${s.alert.expected}`);
        }
        await client.query(`INSERT INTO notifications (title, message, user_id, is_read) VALUES ($1, $2, $3, false)`, ['5 Test Alerts Ready', 'Demo data reset. Five open alerts loaded for ADK workflow testing.', managerId]);
        await client.query('COMMIT');
        console.log('\n✅ Done — 5 customers, 5 open alerts only.\n');
        console.log('Login: manager@bank.com / Manager@123');
        console.log('Alerts page → Start AI Investigation on any ALT-T00x alert.\n');
    }
    catch (error) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('Reset failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
if (require.main === module) {
    resetTestData();
}
exports.default = resetTestData;
//# sourceMappingURL=runResetTestData.js.map