import { Client } from 'pg';
import config from '../config';

/**
 * Adds Critical-severity alerts that are false positives — AI investigation should return CLEAR.
 * Safe to re-run (upserts by alert_code).
 */
async function seedFalsePositiveCritical(): Promise<void> {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    await client.connect();
    console.log('Adding false-positive Critical alert scenarios...\n');

    const scenarios = [
      {
        customer: {
          num: 'CUST-111',
          name: 'Arjun Nambiar',
          dob: '1987-08-03',
          address: '42 Indiranagar, Bangalore',
          pan: 'ARJN4567F',
          occupation: 'School Teacher',
          country: 'India',
          is_pep: false,
          risk_score: 12,
          risk_category: 'Low',
        },
        account: { num: 'ACC20011', type: 'Savings', balance: 385000 },
        history: [
          { amount: 220000, type: 'Deposit', from: 'GOVT-SAL', daysAgo: 90 },
          { amount: 218000, type: 'Deposit', from: 'GOVT-SAL', daysAgo: 60 },
          { amount: 221000, type: 'Deposit', from: 'GOVT-SAL', daysAgo: 30 },
        ],
        trigger: { amount: 480000, type: 'Deposit', from: 'GOVT-BONUS', daysAgo: 1 },
        alert: {
          code: 'ALT-1020',
          type: 'Large Transaction',
          reason: 'CRITICAL (rules): Annual performance bonus ₹4.8L — automated threshold breach',
          risk_score: 92,
          severity: 'Critical',
          note: 'Rules engine → Critical | AI expected → CLEAR (2.2× salary, no PEP/media/sanctions)',
        },
      },
      {
        customer: {
          num: 'CUST-112',
          name: 'Kavita Shah',
          dob: '1991-12-19',
          address: '18 FC Road, Pune',
          pan: 'KAVS7890G',
          occupation: 'Staff Nurse',
          country: 'India',
          is_pep: false,
          risk_score: 10,
          risk_category: 'Low',
        },
        account: { num: 'ACC20012', type: 'Savings', balance: 290000 },
        history: [
          { amount: 185000, type: 'Deposit', from: 'HOSP-PAY', daysAgo: 75 },
          { amount: 182000, type: 'Deposit', from: 'HOSP-PAY', daysAgo: 45 },
          { amount: 188000, type: 'Deposit', from: 'HOSP-PAY', daysAgo: 15 },
        ],
        trigger: { amount: 420000, type: 'Deposit', from: 'HOSP-ARREARS', daysAgo: 2 },
        alert: {
          code: 'ALT-1021',
          type: 'Sudden Activity Spike',
          reason: 'CRITICAL (rules): One-time arrears payment ₹4.2L — velocity rule triggered',
          risk_score: 88,
          severity: 'Critical',
          note: 'Rules engine → Critical | AI expected → CLEAR (consistent salary history)',
        },
      },
      {
        customer: {
          num: 'CUST-113',
          name: 'Deepak Iyer',
          dob: '1979-04-25',
          address: '7 Residency Road, Chennai',
          pan: 'DEEP2345H',
          occupation: 'Government Clerk',
          country: 'India',
          is_pep: false,
          risk_score: 18,
          risk_category: 'Low',
        },
        account: { num: 'ACC20013', type: 'Savings', balance: 520000 },
        history: [
          { amount: 95000, type: 'Deposit', from: 'FD-INT', daysAgo: 120 },
          { amount: 95000, type: 'Deposit', from: 'FD-INT', daysAgo: 90 },
          { amount: 95000, type: 'Deposit', from: 'FD-INT', daysAgo: 60 },
          { amount: 95000, type: 'Deposit', from: 'FD-INT', daysAgo: 30 },
        ],
        trigger: { amount: 380000, type: 'Deposit', from: 'FD-MATURITY', daysAgo: 1 },
        alert: {
          code: 'ALT-1022',
          type: 'Large Transaction',
          reason: 'CRITICAL (rules): FD maturity credit ₹3.8L — flagged as unusual inflow',
          risk_score: 85,
          severity: 'Critical',
          note: 'Rules engine → Critical | AI expected → CLEAR (legitimate maturity, low-risk customer)',
        },
      },
    ];

    for (const s of scenarios) {
      let custId: number;
      const existingCust = await client.query(
        `SELECT id FROM customers WHERE customer_number = $1`,
        [s.customer.num]
      );
      if (existingCust.rows.length) {
        custId = existingCust.rows[0].id;
        await client.query(
          `UPDATE customers SET name=$1, occupation=$2, country=$3, is_pep=$4, risk_score=$5, risk_category=$6 WHERE id=$7`,
          [s.customer.name, s.customer.occupation, s.customer.country, s.customer.is_pep, s.customer.risk_score, s.customer.risk_category, custId]
        );
      } else {
        const ins = await client.query(
          `INSERT INTO customers (customer_number, name, dob, address, pan, occupation, country, is_pep, risk_score, risk_category)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
          [s.customer.num, s.customer.name, s.customer.dob, s.customer.address, s.customer.pan, s.customer.occupation, s.customer.country, s.customer.is_pep, s.customer.risk_score, s.customer.risk_category]
        );
        custId = ins.rows[0].id;
      }

      let accId: number;
      const existingAcc = await client.query(`SELECT id FROM accounts WHERE account_number = $1`, [s.account.num]);
      if (existingAcc.rows.length) {
        accId = existingAcc.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO accounts (customer_id, account_number, account_type, balance, opened_at)
           VALUES ($1,$2,$3,$4, NOW() - INTERVAL '4 years') RETURNING id`,
          [custId, s.account.num, s.account.type, s.account.balance]
        );
        accId = ins.rows[0].id;
      }

      const now = Date.now();
      for (const h of s.history) {
        const exists = await client.query(
          `SELECT 1 FROM transactions WHERE account_id=$1 AND amount=$2 AND transaction_date::date=$3::date LIMIT 1`,
          [accId, h.amount, new Date(now - h.daysAgo * 86400000)]
        );
        if (!exists.rows.length) {
          await client.query(
            `INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
             VALUES ($1,$2,$3,$4,$5,'India',$6,'Completed')`,
            [accId, h.amount, h.type, h.from, s.account.num, new Date(now - h.daysAgo * 86400000)]
          );
        }
      }

      const triggerDate = new Date(now - s.trigger.daysAgo * 86400000);
      let triggerTxnId: number;

      const existingAlert = await client.query(`SELECT id, transaction_id FROM alerts WHERE alert_code = $1`, [s.alert.code]);
      if (existingAlert.rows.length && existingAlert.rows[0].transaction_id) {
        triggerTxnId = existingAlert.rows[0].transaction_id;
        await client.query(
          `UPDATE transactions SET account_id=$1, amount=$2, transaction_type=$3, sender_account=$4, transaction_date=$5, country='India' WHERE id=$6`,
          [accId, s.trigger.amount, s.trigger.type, s.trigger.from, triggerDate, triggerTxnId]
        );
      } else {
        const txnIns = await client.query(
          `INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
           VALUES ($1,$2,$3,$4,$5,'India',$6,'Completed') RETURNING id`,
          [accId, s.trigger.amount, s.trigger.type, s.trigger.from, s.account.num, triggerDate]
        );
        triggerTxnId = txnIns.rows[0].id;
      }

      if (existingAlert.rows.length) {
        await client.query(
          `UPDATE alerts SET customer_id=$1, transaction_id=$2, alert_type=$3, reason=$4, risk_score=$5, severity=$6, status='Open' WHERE alert_code=$7`,
          [custId, triggerTxnId, s.alert.type, s.alert.reason, s.alert.risk_score, s.alert.severity, s.alert.code]
        );
      } else {
        await client.query(
          `INSERT INTO alerts (alert_code, customer_id, transaction_id, alert_type, reason, risk_score, severity, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'Open')`,
          [s.alert.code, custId, triggerTxnId, s.alert.type, s.alert.reason, s.alert.risk_score, s.alert.severity]
        );
      }

      console.log(`  ✓ ${s.alert.code} | ${s.customer.name} | Severity: Critical | AI → CLEAR`);
      console.log(`    ${s.alert.note}`);
    }

    console.log('\n✅ False-positive Critical alerts ready.');
    console.log('\nDemo scenario — Rules vs AI:');
    console.log('  ALT-1020  Arjun Nambiar   Critical → AI CLEAR  (annual bonus, 2× salary)');
    console.log('  ALT-1021  Kavita Shah    Critical → AI CLEAR  (arrears payment, normal nurse)');
    console.log('  ALT-1022  Deepak Iyer    Critical → AI CLEAR  (FD maturity, low-risk govt clerk)');
    console.log('\nThese show how 90%+ false-positive reduction works in practice.');
  } catch (error) {
    console.error('Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedFalsePositiveCritical();
}

export default seedFalsePositiveCritical;
