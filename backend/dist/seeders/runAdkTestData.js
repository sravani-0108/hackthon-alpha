"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
/**
 * ADK pipeline test scenarios — PEP, adverse media, sanctions, CLEAR, ESCALATE.
 * Safe to re-run (upserts by customer_number / alert_code).
 */
async function seedAdkTestData() {
    const client = new pg_1.Client({
        host: config_1.default.db.host,
        port: config_1.default.db.port,
        user: config_1.default.db.user,
        password: config_1.default.db.password,
        database: config_1.default.db.name,
    });
    try {
        await client.connect();
        console.log('Adding ADK test scenarios...\n');
        const manager = await client.query(`SELECT id FROM users WHERE email = 'manager@bank.com' LIMIT 1`);
        const managerId = manager.rows[0]?.id ?? null;
        const scenarios = [
            {
                customer: {
                    num: 'CUST-114',
                    name: 'Rajesh Kumar',
                    dob: '1976-03-08',
                    address: '15 MG Road, Jaipur',
                    pan: 'RAJK1122J',
                    occupation: 'Municipal Councilor',
                    country: 'India',
                    is_pep: false,
                    risk_score: 52,
                    risk_category: 'Medium',
                },
                account: { num: 'ACC20014', type: 'Current', balance: 780000 },
                history: [
                    { amount: 95000, type: 'Deposit', from: 'COUNCIL-PAY', daysAgo: 60 },
                    { amount: 98000, type: 'Deposit', from: 'COUNCIL-PAY', daysAgo: 30 },
                ],
                trigger: { amount: 1250000, type: 'Transfer', from: 'ACC20014', to: 'EXT-DEV-01', daysAgo: 1 },
                alert: {
                    code: 'ALT-1030',
                    type: 'Large Transaction',
                    reason: '₹12.5L transfer — PEP registry name match (Rajesh Kumar)',
                    risk_score: 68,
                    severity: 'High',
                    expected: 'ESCALATE',
                },
            },
            {
                customer: {
                    num: 'CUST-115',
                    name: 'Mohammed Ali',
                    dob: '1980-06-12',
                    address: '56 Park Street, Kolkata',
                    pan: 'MOAL3344K',
                    occupation: 'Jeweler',
                    country: 'India',
                    is_pep: true,
                    risk_score: 74,
                    risk_category: 'High',
                },
                account: { num: 'ACC20015', type: 'NRI', balance: 2100000 },
                history: [
                    { amount: 120000, type: 'Deposit', from: 'EXT-GOLD', daysAgo: 45 },
                    { amount: 95000, type: 'Transfer', from: 'ACC20015', to: 'EXT-01', daysAgo: 20 },
                ],
                trigger: { amount: 1850000, type: 'Transfer', from: 'ACC20015', to: 'EXT-GOLD-99', daysAgo: 1 },
                alert: {
                    code: 'ALT-1031',
                    type: 'Large Transaction',
                    reason: '₹18.5L gold trade — PEP flag + adverse media hits',
                    risk_score: 82,
                    severity: 'Critical',
                    expected: 'ESCALATE or SAR',
                },
            },
            {
                customer: {
                    num: 'CUST-116',
                    name: 'Vikram Singh',
                    dob: '1978-11-08',
                    address: '78 Civil Lines, Delhi',
                    pan: 'VIKS5566L',
                    occupation: 'Import/Export Trader',
                    country: 'India',
                    is_pep: true,
                    risk_score: 48,
                    risk_category: 'Medium',
                },
                account: { num: 'ACC20016', type: 'Current', balance: 3200000 },
                history: [
                    { amount: 88000, type: 'Transfer', from: 'ACC20016', to: 'EXT-200', daysAgo: 50 },
                    { amount: 91000, type: 'Transfer', from: 'ACC20016', to: 'EXT-201', daysAgo: 25 },
                ],
                trigger: { amount: 1400000, type: 'Transfer', from: 'ACC20016', to: 'EXT-IMPORT', daysAgo: 2 },
                alert: {
                    code: 'ALT-1032',
                    type: 'Sudden Activity Spike',
                    reason: '₹14L import payment — direct PEP (State Minister)',
                    risk_score: 71,
                    severity: 'High',
                    expected: 'ESCALATE',
                },
            },
            {
                customer: {
                    num: 'CUST-117',
                    name: 'Meera Krishnan',
                    dob: '1995-09-22',
                    address: '3 Anna Salai, Chennai',
                    pan: 'MEER7788M',
                    occupation: 'Graphic Designer',
                    country: 'India',
                    is_pep: false,
                    risk_score: 9,
                    risk_category: 'Low',
                },
                account: { num: 'ACC20017', type: 'Savings', balance: 145000 },
                history: [
                    { amount: 45000, type: 'Deposit', from: 'CLIENT-PAY', daysAgo: 35 },
                    { amount: 48000, type: 'Deposit', from: 'CLIENT-PAY', daysAgo: 5 },
                ],
                trigger: { amount: 52000, type: 'Deposit', from: 'CLIENT-PAY', daysAgo: 1 },
                alert: {
                    code: 'ALT-1033',
                    type: 'Low Value Alert',
                    reason: 'Routine freelance payment — false positive test',
                    risk_score: 14,
                    severity: 'Low',
                    expected: 'CLEAR',
                },
            },
        ];
        let alertsAdded = 0;
        for (const s of scenarios) {
            let custId;
            const existingCust = await client.query(`SELECT id FROM customers WHERE customer_number = $1`, [s.customer.num]);
            if (existingCust.rows.length) {
                custId = existingCust.rows[0].id;
                await client.query(`UPDATE customers SET name=$1, occupation=$2, country=$3, is_pep=$4, risk_score=$5, risk_category=$6 WHERE id=$7`, [s.customer.name, s.customer.occupation, s.customer.country, s.customer.is_pep, s.customer.risk_score, s.customer.risk_category, custId]);
            }
            else {
                const ins = await client.query(`INSERT INTO customers (customer_number, name, dob, address, pan, occupation, country, is_pep, risk_score, risk_category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [s.customer.num, s.customer.name, s.customer.dob, s.customer.address, s.customer.pan, s.customer.occupation, s.customer.country, s.customer.is_pep, s.customer.risk_score, s.customer.risk_category]);
                custId = ins.rows[0].id;
            }
            let accId;
            const existingAcc = await client.query(`SELECT id FROM accounts WHERE account_number = $1`, [s.account.num]);
            if (existingAcc.rows.length) {
                accId = existingAcc.rows[0].id;
            }
            else {
                const ins = await client.query(`INSERT INTO accounts (customer_id, account_number, account_type, balance, opened_at)
           VALUES ($1,$2,$3,$4, NOW() - INTERVAL '3 years') RETURNING id`, [custId, s.account.num, s.account.type, s.account.balance]);
                accId = ins.rows[0].id;
            }
            const now = Date.now();
            for (const h of s.history) {
                const txDate = new Date(now - h.daysAgo * 86400000);
                const exists = await client.query(`SELECT 1 FROM transactions WHERE account_id=$1 AND amount=$2 AND transaction_date::date=$3::date LIMIT 1`, [accId, h.amount, txDate]);
                if (!exists.rows.length) {
                    await client.query(`INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
             VALUES ($1,$2,$3,$4,$5,'India',$6,'Completed')`, [accId, h.amount, h.type, h.from, s.account.num, txDate]);
                }
            }
            const triggerDate = new Date(now - s.trigger.daysAgo * 86400000);
            let triggerTxnId;
            const existingAlert = await client.query(`SELECT id, transaction_id FROM alerts WHERE alert_code = $1`, [s.alert.code]);
            if (existingAlert.rows.length && existingAlert.rows[0].transaction_id) {
                triggerTxnId = existingAlert.rows[0].transaction_id;
                await client.query(`UPDATE transactions SET account_id=$1, amount=$2, transaction_type=$3, sender_account=$4, receiver_account=$5, transaction_date=$6, country='India' WHERE id=$7`, [accId, s.trigger.amount, s.trigger.type, s.trigger.from, s.trigger.to, triggerDate, triggerTxnId]);
            }
            else {
                const txnIns = await client.query(`INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
           VALUES ($1,$2,$3,$4,$5,'India',$6,'Completed') RETURNING id`, [accId, s.trigger.amount, s.trigger.type, s.trigger.from, s.trigger.to, triggerDate]);
                triggerTxnId = txnIns.rows[0].id;
            }
            if (existingAlert.rows.length) {
                await client.query(`UPDATE alerts SET customer_id=$1, transaction_id=$2, alert_type=$3, reason=$4, risk_score=$5, severity=$6, status='Open' WHERE alert_code=$7`, [custId, triggerTxnId, s.alert.type, s.alert.reason, s.alert.risk_score, s.alert.severity, s.alert.code]);
            }
            else {
                await client.query(`INSERT INTO alerts (alert_code, customer_id, transaction_id, alert_type, reason, risk_score, severity, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'Open')`, [s.alert.code, custId, triggerTxnId, s.alert.type, s.alert.reason, s.alert.risk_score, s.alert.severity]);
                alertsAdded++;
            }
            console.log(`  ✓ ${s.alert.code} | ${s.customer.name} | ${s.alert.severity} → ${s.alert.expected}`);
        }
        if (managerId && alertsAdded > 0) {
            await client.query(`INSERT INTO notifications (title, message, user_id, is_read) VALUES ($1, $2, $3, false)`, ['ADK Test Alerts Ready', `${alertsAdded} new ADK test alerts added. Open Alerts to run investigations.`, managerId]);
        }
        console.log('\n✅ ADK test data ready.\n');
        console.log('Recommended investigations:');
        console.log('  ALT-1030  Rajesh Kumar    → PEP name match → ESCALATE');
        console.log('  ALT-1031  Mohammed Ali    → PEP + adverse media → ESCALATE/SAR');
        console.log('  ALT-1032  Vikram Singh    → Direct PEP → ESCALATE');
        console.log('  ALT-1033  Meera Krishnan  → False positive → CLEAR');
        console.log('\nAlso run: npm run db:sample && npm run db:false-positive for more scenarios.');
    }
    catch (error) {
        console.error('ADK test seed failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
if (require.main === module) {
    seedAdkTestData();
}
exports.default = seedAdkTestData;
//# sourceMappingURL=runAdkTestData.js.map