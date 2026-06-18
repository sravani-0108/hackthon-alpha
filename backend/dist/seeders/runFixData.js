"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const config_1 = __importDefault(require("../config"));
/**
 * Repairs alert ↔ transaction ↔ customer linkage and normalises screening reference data.
 * Safe to re-run.
 */
async function fixData() {
    const client = new pg_1.Client({
        host: config_1.default.db.host,
        port: config_1.default.db.port,
        user: config_1.default.db.user,
        password: config_1.default.db.password,
        database: config_1.default.db.name,
    });
    try {
        await client.connect();
        console.log('Repairing data integrity...\n');
        // ── 1. Ensure customer fields are populated ────────────────────────────
        await client.query(`UPDATE customers SET country = 'India' WHERE country IS NULL OR country = ''`);
        await client.query(`UPDATE customers SET is_pep = false WHERE is_pep IS NULL`);
        // Mark known PEP customers by customer_number (authoritative KYC source)
        await client.query(`UPDATE customers SET is_pep = true WHERE customer_number IN ('CUST-102', 'CUST-104')`);
        // ── 2. Fix original seed: transactions must belong to the alert's customer account ──
        const fixes = [
            { alertCode: 'ALT-1001', custNum: 'CUST-102', accountNum: 'ACC10004', amount: 1500000, country: 'India', type: 'Transfer', daysAgo: 2 },
            { alertCode: 'ALT-1002', custNum: 'CUST-103', accountNum: 'ACC10005', amount: 2500000, country: 'India', type: 'Transfer', daysAgo: 1 },
            { alertCode: 'ALT-1003', custNum: 'CUST-104', accountNum: 'ACC10006', amount: 350000, country: 'Iran', type: 'Transfer', daysAgo: 0.5 },
            { alertCode: 'ALT-1004', custNum: 'CUST-104', accountNum: 'ACC10006', amount: 45000, country: 'India', type: 'Withdrawal', daysAgo: 0.25 },
        ];
        for (const f of fixes) {
            const cust = await client.query(`SELECT id FROM customers WHERE customer_number = $1`, [f.custNum]);
            const acc = await client.query(`SELECT id, customer_id FROM accounts WHERE account_number = $1`, [f.accountNum]);
            if (!cust.rows.length || !acc.rows.length)
                continue;
            if (acc.rows[0].customer_id !== cust.rows[0].id) {
                await client.query(`UPDATE accounts SET customer_id = $1 WHERE account_number = $2`, [cust.rows[0].id, f.accountNum]);
            }
            const alert = await client.query(`SELECT id, transaction_id FROM alerts WHERE alert_code = $1`, [f.alertCode]);
            if (!alert.rows.length)
                continue;
            const txnDate = new Date(Date.now() - f.daysAgo * 86400000);
            let txnId = alert.rows[0].transaction_id;
            if (txnId) {
                await client.query(`UPDATE transactions SET account_id = $1, amount = $2, country = $3, transaction_type = $4, transaction_date = $5
           WHERE id = $6`, [acc.rows[0].id, f.amount, f.country, f.type, txnDate, txnId]);
            }
            else {
                const ins = await client.query(`INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
           VALUES ($1,$2,$3,$4,'EXT-FIX',$5,$6,'Completed') RETURNING id`, [acc.rows[0].id, f.amount, f.type, f.accountNum, f.country, txnDate]);
                txnId = ins.rows[0].id;
            }
            await client.query(`UPDATE alerts SET customer_id = $1, transaction_id = $2 WHERE alert_code = $3`, [cust.rows[0].id, txnId, f.alertCode]);
            console.log(`  fixed ${f.alertCode} → ${f.custNum} / ${f.accountNum} / ₹${f.amount.toLocaleString('en-IN')}`);
        }
        // ── 3. Add baseline history for spike calculations (3 months normal activity) ──
        const baselines = [
            { accountNum: 'ACC10004', amount: 85000, type: 'Transfer', daysAgo: 60 },
            { accountNum: 'ACC10004', amount: 92000, type: 'Transfer', daysAgo: 45 },
            { accountNum: 'ACC10004', amount: 78000, type: 'Transfer', daysAgo: 30 },
            { accountNum: 'ACC10005', amount: 65000, type: 'Deposit', daysAgo: 55 },
            { accountNum: 'ACC10005', amount: 72000, type: 'Deposit', daysAgo: 40 },
            { accountNum: 'ACC10006', amount: 120000, type: 'Transfer', daysAgo: 50 },
            { accountNum: 'ACC20002', amount: 65000, type: 'Transfer', daysAgo: 25 },
            { accountNum: 'ACC20002', amount: 72000, type: 'Transfer', daysAgo: 20 },
            { accountNum: 'ACC20003', amount: 80000, type: 'Deposit', daysAgo: 45 },
            { accountNum: 'ACC20001', amount: 42000, type: 'Deposit', daysAgo: 30 },
            { accountNum: 'ACC20001', amount: 42000, type: 'Deposit', daysAgo: 60 },
            { accountNum: 'ACC20005', amount: 120000, type: 'Deposit', daysAgo: 15 },
        ];
        for (const b of baselines) {
            const acc = await client.query(`SELECT id FROM accounts WHERE account_number = $1`, [b.accountNum]);
            if (!acc.rows.length)
                continue;
            const exists = await client.query(`SELECT 1 FROM transactions WHERE account_id = $1 AND amount = $2 AND transaction_date::date = $3::date LIMIT 1`, [acc.rows[0].id, b.amount, new Date(Date.now() - b.daysAgo * 86400000)]);
            if (exists.rows.length)
                continue;
            await client.query(`INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
         VALUES ($1,$2,$3,'HIST','EXT-HIST','India',$4,'Completed')`, [acc.rows[0].id, b.amount, b.type, new Date(Date.now() - b.daysAgo * 86400000)]);
        }
        console.log('  baseline transaction history ensured');
        // ── 4. Fix sample alert ALT-1012 → Sneha Reddy (CUST-103) with correct txn ──
        const sneha = await client.query(`SELECT id FROM customers WHERE customer_number = 'CUST-103'`);
        const snehaAcc = await client.query(`SELECT id FROM accounts WHERE account_number = 'ACC10005'`);
        if (sneha.rows.length && snehaAcc.rows.length) {
            const alt1012 = await client.query(`SELECT id, transaction_id FROM alerts WHERE alert_code = 'ALT-1012'`);
            if (alt1012.rows.length) {
                await client.query(`UPDATE alerts SET customer_id = $1 WHERE alert_code = 'ALT-1012'`, [sneha.rows[0].id]);
                if (alt1012.rows[0].transaction_id) {
                    await client.query(`UPDATE transactions SET account_id = $1, amount = 2500000, country = 'India' WHERE id = $2`, [snehaAcc.rows[0].id, alt1012.rows[0].transaction_id]);
                }
            }
        }
        // Rename duplicate sample customer if present
        await client.query(`
      UPDATE customers SET name = 'Anita Verma', pan = 'ANIT7890E'
      WHERE customer_number = 'CUST-108' AND name = 'Sneha Reddy'
    `);
        // ── 5. Reset wrongly investigated alerts to Open for re-test ───────────
        await client.query(`
      UPDATE alerts SET status = 'Open'
      WHERE status IN ('Cleared', 'Under Investigation') AND alert_code LIKE 'ALT-%'
    `);
        console.log('\n✅ Data repair complete. Re-run AI investigations to see accurate results.');
    }
    catch (error) {
        console.error('Fix failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
if (require.main === module) {
    fixData();
}
exports.default = fixData;
//# sourceMappingURL=runFixData.js.map