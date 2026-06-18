import { Client } from 'pg';
import config from '../config';

/**
 * Adds extra sample customers, transactions, and alerts for demo/validation.
 * Safe to re-run — skips records that already exist (by customer_number / alert_code).
 */
async function seedSampleData(): Promise<void> {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    await client.connect();
    console.log('Connected — adding sample validation records...\n');

    const manager = await client.query(`SELECT id FROM users WHERE email = 'manager@bank.com' LIMIT 1`);
    const managerId = manager.rows[0]?.id ?? null;

    // ── Customers ──────────────────────────────────────────────────────────
    const customers = [
      {
        num: 'CUST-106', name: 'Ananya Desai', dob: '1993-05-20',
        address: '14 Koramangala, Bangalore', pan: 'ANAD1234A', occupation: 'Software Consultant',
        country: 'India', is_pep: false, risk_score: 12, risk_category: 'Low',
        note: '→ Run AI investigation → expect CLEAR (normal activity)',
      },
      {
        num: 'CUST-107', name: 'Karan Malhotra', dob: '1982-09-14',
        address: '88 Connaught Place, Delhi', pan: 'KARM5678B', occupation: 'Chartered Accountant',
        country: 'India', is_pep: false, risk_score: 38, risk_category: 'Medium',
        note: '→ Large transfer spike → expect ESCALATE',
      },
      {
        num: 'CUST-108', name: 'Anita Verma', dob: '1991-04-11',
        address: '23 Banjara Hills, Hyderabad', pan: 'ANIT7890E', occupation: 'Real Estate Agent',
        country: 'India', is_pep: false, risk_score: 58, risk_category: 'Medium',
        note: '→ Adverse media test uses Sneha Reddy (CUST-103) — this customer is clean media',
      },
      {
        num: 'CUST-109', name: 'Mohammed Ali Hassan', dob: '1975-12-01',
        address: '102 Park Street, Kolkata', pan: 'MOHA9012C', occupation: 'Import Trader',
        country: 'Syria', is_pep: false, risk_score: 85, risk_category: 'High',
        note: '→ Sanctions name match + Iran txn → expect SAR',
      },
      {
        num: 'CUST-110', name: 'Divya Nair', dob: '1998-02-28',
        address: '5 Marine Drive, Kochi', pan: 'DIVN3456D', occupation: 'Doctor',
        country: 'India', is_pep: false, risk_score: 8, risk_category: 'Low',
        note: '→ Small routine transactions → expect CLEAR',
      },
    ];

    const customerIds: Record<string, number> = {};

    for (const c of customers) {
      const exists = await client.query(`SELECT id FROM customers WHERE customer_number = $1`, [c.num]);
      if (exists.rows.length) {
        customerIds[c.num] = exists.rows[0].id;
        console.log(`  skip customer ${c.num} (exists)`);
        continue;
      }
      const r = await client.query(
        `INSERT INTO customers (customer_number, name, dob, address, pan, occupation, country, is_pep, risk_score, risk_category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [c.num, c.name, c.dob, c.address, c.pan, c.occupation, c.country, c.is_pep, c.risk_score, c.risk_category]
      );
      customerIds[c.num] = r.rows[0].id;
      console.log(`  + customer ${c.num} — ${c.name}  ${c.note}`);
    }

    // Re-fetch any existing customer IDs we skipped
    for (const c of customers) {
      if (!customerIds[c.num]) {
        const r = await client.query(`SELECT id FROM customers WHERE customer_number = $1`, [c.num]);
        if (r.rows.length) customerIds[c.num] = r.rows[0].id;
      }
    }

    // ── Accounts ───────────────────────────────────────────────────────────
    const accounts = [
      { cust: 'CUST-106', num: 'ACC20001', type: 'Savings', balance: 320000 },
      { cust: 'CUST-107', num: 'ACC20002', type: 'Current', balance: 890000 },
      { cust: 'CUST-108', num: 'ACC20003', type: 'Savings', balance: 120000 },
      { cust: 'CUST-109', num: 'ACC20004', type: 'NRI', balance: 4500000 },
      { cust: 'CUST-110', num: 'ACC20005', type: 'Savings', balance: 95000 },
    ];

    const accountIds: Record<string, number> = {};

    for (const a of accounts) {
      const exists = await client.query(`SELECT id FROM accounts WHERE account_number = $1`, [a.num]);
      if (exists.rows.length) {
        accountIds[a.num] = exists.rows[0].id;
        continue;
      }
      const r = await client.query(
        `INSERT INTO accounts (customer_id, account_number, account_type, balance, opened_at)
         VALUES ($1,$2,$3,$4, NOW() - INTERVAL '3 years') RETURNING id`,
        [customerIds[a.cust], a.num, a.type, a.balance]
      );
      accountIds[a.num] = r.rows[0].id;
      console.log(`  + account ${a.num}`);
    }

    for (const a of accounts) {
      if (!accountIds[a.num]) {
        const r = await client.query(`SELECT id FROM accounts WHERE account_number = $1`, [a.num]);
        if (r.rows.length) accountIds[a.num] = r.rows[0].id;
      }
    }

    const now = Date.now();

    // ── Transactions ───────────────────────────────────────────────────────
    const txns: Array<{ acc: string; amount: number; type: string; from: string; to: string; country: string; daysAgo: number }> = [
      // Ananya — normal monthly pattern (~₹40k/month)
      { acc: 'ACC20001', amount: 42000, type: 'Deposit', from: 'EMP-SAL', to: 'ACC20001', country: 'India', daysAgo: 30 },
      { acc: 'ACC20001', amount: 42000, type: 'Deposit', from: 'EMP-SAL', to: 'ACC20001', country: 'India', daysAgo: 60 },
      { acc: 'ACC20001', amount: 8500, type: 'Withdrawal', from: 'ACC20001', to: 'ATM-KOR', country: 'India', daysAgo: 3 },
      // Karan — sudden ₹22L transfer (25x average)
      { acc: 'ACC20002', amount: 65000, type: 'Transfer', from: 'ACC20002', to: 'EXT-501', country: 'India', daysAgo: 25 },
      { acc: 'ACC20002', amount: 72000, type: 'Transfer', from: 'ACC20002', to: 'EXT-502', country: 'India', daysAgo: 20 },
      { acc: 'ACC20002', amount: 2200000, type: 'Transfer', from: 'ACC20002', to: 'EXT-INTL-99', country: 'UAE', daysAgo: 1 },
      // Sneha Reddy — ₹30L property deal (adverse media in agent DB)
      { acc: 'ACC20003', amount: 80000, type: 'Deposit', from: 'EXT-301', to: 'ACC20003', country: 'India', daysAgo: 45 },
      { acc: 'ACC20003', amount: 3000000, type: 'Transfer', from: 'ACC20003', to: 'EXT-PROP-88', country: 'India', daysAgo: 2 },
      // Mohammed Ali Hassan — Iran + large NRI transfer (sanctions name)
      { acc: 'ACC20004', amount: 180000, type: 'Transfer', from: 'ACC20004', to: 'EXT-SG-01', country: 'India', daysAgo: 10 },
      { acc: 'ACC20004', amount: 950000, type: 'Transfer', from: 'ACC20004', to: 'EXT-IR-01', country: 'Iran', daysAgo: 1 },
      { acc: 'ACC20004', amount: 420000, type: 'Transfer', from: 'ACC20004', to: 'EXT-IR-02', country: 'Iran', daysAgo: 0.5 },
      // Divya — small routine
      { acc: 'ACC20005', amount: 120000, type: 'Deposit', from: 'HOSP-PAY', to: 'ACC20005', country: 'India', daysAgo: 15 },
      { acc: 'ACC20005', amount: 3500, type: 'Withdrawal', from: 'ACC20005', to: 'ATM-MAR', country: 'India', daysAgo: 2 },
    ];

    const txnIds: Record<string, number> = {};

    for (const t of txns) {
      const accId = accountIds[t.acc];
      if (!accId) continue;
      const date = new Date(now - t.daysAgo * 86400000);
      const r = await client.query(
        `INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Completed') RETURNING id`,
        [accId, t.amount, t.type, t.from, t.to, t.country, date]
      );
      txnIds[`${t.acc}-${t.amount}-${t.daysAgo}`] = r.rows[0].id;
    }
    console.log(`  + ${txns.length} transactions inserted`);

    // ── Alerts ─────────────────────────────────────────────────────────────
    const alerts = [
      {
        code: 'ALT-1010', cust: 'CUST-106', txnKey: 'ACC20001-8500-3',
        type: 'Sudden Activity Spike', reason: 'Minor withdrawal — likely false positive',
        risk: 18, severity: 'Low', status: 'Open', expected: 'CLEAR',
      },
      {
        code: 'ALT-1011', cust: 'CUST-107', txnKey: 'ACC20002-2200000-1',
        type: 'Large Transaction', reason: '₹22L transfer to UAE — 25x monthly average',
        risk: 72, severity: 'High', status: 'Open', expected: 'ESCALATE',
      },
      {
        code: 'ALT-1012', cust: 'CUST-103', txnKey: 'ACC10005-2500000-1',
        type: 'Large Transaction', reason: '₹25L property transfer — adverse media on customer',
        risk: 78, severity: 'Critical', status: 'Open', expected: 'ESCALATE',
      },
      {
        code: 'ALT-1013', cust: 'CUST-109', txnKey: 'ACC20004-950000-1',
        type: 'High-Risk Country', reason: '₹9.5L transfer to Iran — sanctions name match',
        risk: 95, severity: 'Critical', status: 'Open', expected: 'SAR',
      },
      {
        code: 'ALT-1014', cust: 'CUST-109', txnKey: 'ACC20004-420000-0.5',
        type: 'Rapid Transactions', reason: 'Multiple Iran transfers within 12 hours',
        risk: 88, severity: 'Critical', status: 'Open', expected: 'SAR',
      },
      {
        code: 'ALT-1015', cust: 'CUST-110', txnKey: 'ACC20005-3500-2',
        type: 'Low Value Alert', reason: 'Routine ATM withdrawal — auto-generated test alert',
        risk: 10, severity: 'Low', status: 'Open', expected: 'CLEAR',
      },
    ];

    let alertsAdded = 0;
    for (const al of alerts) {
      const exists = await client.query(`SELECT id FROM alerts WHERE alert_code = $1`, [al.code]);
      if (exists.rows.length) {
        console.log(`  skip alert ${al.code} (exists)`);
        continue;
      }
      const txnId = txnIds[al.txnKey] ?? null;
      await client.query(
        `INSERT INTO alerts (alert_code, customer_id, transaction_id, alert_type, reason, risk_score, severity, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [al.code, customerIds[al.cust], txnId, al.type, al.reason, al.risk, al.severity, al.status]
      );
      console.log(`  + alert ${al.code} — ${al.reason}  [expected: ${al.expected}]`);
      alertsAdded++;
    }

    // Notification for manager
    if (managerId && alertsAdded > 0) {
      await client.query(
        `INSERT INTO notifications (title, message, user_id, is_read) VALUES ($1, $2, $3, false)`,
        [
          `${alertsAdded} New Sample Alerts Added`,
          'Validation sample records are ready. Check Alerts page to test AI investigation.',
          managerId,
        ]
      );
    }

    console.log('\n✅ Sample validation data ready!\n');
    console.log('Test these alerts on the Alerts page:\n');
    console.log('  ALT-1010  Ananya Desai      → expect CLEAR');
    console.log('  ALT-1011  Karan Malhotra    → expect ESCALATE (large transfer spike)');
    console.log('  ALT-1012  Sneha Reddy       → expect ESCALATE (adverse media + large txn)');
    console.log('  ALT-1013  Mohammed Ali Hassan → expect SAR (sanctions + Iran)');
    console.log('  ALT-1014  Mohammed Ali Hassan → expect SAR (rapid Iran transfers)');
    console.log('  ALT-1015  Divya Nair        → expect CLEAR (routine activity)');
    console.log('\nLogin: manager@bank.com / Manager@123');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sample seed failed:', message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedSampleData();
}

export default seedSampleData;
