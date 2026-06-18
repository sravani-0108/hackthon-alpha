import { Client } from 'pg';
import config from '../config';

type TxnHistory = {
  amount: number;
  type: string;
  from: string;
  to?: string;
  daysAgo: number;
};

/**
 * Wipes AML demo data and loads 8 open alerts — one per agent in the AI pipeline order.
 * Run investigations in ALT-A001 → ALT-A008 order to exercise each agent step.
 */
async function seedAgentPipelineTestData(): Promise<void> {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    await client.connect();
    console.log('Resetting AML data and loading 8 agent-pipeline test alerts...\n');

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
    const day = (d: number) => new Date(now - d * 86400000);

    const scenarios = [
      {
        agent: '1 · Customer Profile Agent',
        customer: {
          num: 'CUST-A001',
          name: 'Ravi Deshmukh',
          dob: '1978-04-14',
          address: 'Casino District, Goa',
          pan: 'RAVI1001A',
          occupation: 'Casino Operator',
          country: 'India',
          is_pep: false,
          risk_score: 91,
          risk_category: 'High',
        },
        account: { num: 'ACCT-A001', type: 'Current', balance: 4200000 },
        history: [{ amount: 45000, type: 'Deposit', from: 'CASH-DESK', daysAgo: 20 }],
        trigger: { amount: 52000, type: 'Deposit', from: 'CASH-DESK', daysAgo: 1 },
        alert: {
          code: 'ALT-A001',
          type: 'High-Risk Customer',
          reason: 'Step 1 — Profile Agent: high-risk KYC (score 91, casino operator)',
          risk_score: 68,
          severity: 'High',
          expected: 'Profile → High customer risk',
        },
      },
      {
        agent: '2 · Transaction Analysis Agent',
        customer: {
          num: 'CUST-A002',
          name: 'Kiran Patel',
          dob: '1992-08-03',
          address: '22 Satellite, Ahmedabad',
          pan: 'KIRA1002B',
          occupation: 'Teacher',
          country: 'India',
          is_pep: false,
          risk_score: 12,
          risk_category: 'Low',
        },
        account: { num: 'ACCT-A002', type: 'Savings', balance: 210000 },
        history: [
          { amount: 28000, type: 'Deposit', from: 'SAL-01', daysAgo: 45 },
          { amount: 26500, type: 'Deposit', from: 'SAL-01', daysAgo: 15 },
        ],
        trigger: { amount: 8500000, type: 'Transfer', from: 'ACCT-A002', to: 'EXT-DUBAI', daysAgo: 1 },
        alert: {
          code: 'ALT-A002',
          type: 'Large Transaction',
          reason: 'Step 2 — Transaction Agent: ₹85L transfer (~300× monthly average)',
          risk_score: 82,
          severity: 'Critical',
          expected: 'Transaction → High risk spike',
        },
      },
      {
        agent: '3 · Sanctions Screening Agent',
        customer: {
          num: 'CUST-A003',
          name: 'Hassan Al-Assad',
          dob: '1965-09-11',
          address: 'Kuala Lumpur, Malaysia',
          pan: 'HASS1003C',
          occupation: 'Business Owner',
          country: 'Malaysia',
          is_pep: false,
          risk_score: 85,
          risk_category: 'High',
        },
        account: { num: 'ACCT-A003', type: 'NRI', balance: 5100000 },
        history: [{ amount: 200000, type: 'Transfer', from: 'ACCT-A003', to: 'EXT-SG', daysAgo: 30 }],
        trigger: { amount: 2500000, type: 'Transfer', from: 'ACCT-A003', to: 'EXT-MY', country: 'Malaysia', daysAgo: 1 },
        alert: {
          code: 'ALT-A003',
          type: 'High-Risk Country',
          reason: 'Step 3 — Sanctions Agent: transfer to Malaysia (configured high-risk country) + sanctions screening',
          risk_score: 94,
          severity: 'Critical',
          expected: 'High-risk country + sanctions exposure',
        },
      },
      {
        agent: '4 · PEP Screening Agent',
        customer: {
          num: 'CUST-A004',
          name: 'Vladimir Putin',
          dob: '1952-10-07',
          address: 'Moscow, Russia',
          pan: 'VLAD1004D',
          occupation: 'Government Official',
          country: 'Russia',
          is_pep: true,
          risk_score: 70,
          risk_category: 'High',
        },
        account: { num: 'ACCT-A004', type: 'Current', balance: 3200000 },
        history: [{ amount: 180000, type: 'Deposit', from: 'EXT-IN', to: 'ACCT-A004', daysAgo: 25 }],
        trigger: { amount: 1100000, type: 'Transfer', from: 'ACCT-A004', to: 'EXT-EU', daysAgo: 2 },
        alert: {
          code: 'ALT-A004',
          type: 'PEP Transaction',
          reason: 'Step 4 — PEP Agent: flagged PEP + high-value transfer',
          risk_score: 80,
          severity: 'Critical',
          expected: 'PEP → ESCALATE / SAR',
        },
      },
      {
        agent: '5 · Adverse Media Agent',
        customer: {
          num: 'CUST-A005',
          name: 'Vijay Mallya',
          dob: '1955-12-18',
          address: 'UB City, Bangalore',
          pan: 'VIJA1005E',
          occupation: 'Business Tycoon',
          country: 'India',
          is_pep: false,
          risk_score: 74,
          risk_category: 'High',
        },
        account: { num: 'ACCT-A005', type: 'Current', balance: 18000000 },
        history: [
          { amount: 3200000, type: 'Transfer', from: 'ACCT-A005', to: 'EXT-UAE', daysAgo: 40 },
          { amount: 1500000, type: 'Withdrawal', from: 'ACCT-A005', to: 'CASH', daysAgo: 10 },
        ],
        trigger: { amount: 12000000, type: 'Transfer', from: 'ACCT-A005', to: 'EXT-UK', daysAgo: 1 },
        alert: {
          code: 'ALT-A005',
          type: 'Sudden Activity Spike',
          reason: 'Step 5 — Adverse Media Agent: live Google Search on customer name',
          risk_score: 86,
          severity: 'Critical',
          expected: 'Media → negative news via Google Search',
        },
      },
      {
        agent: '6 · Investigation Synthesis Agent',
        customer: {
          num: 'CUST-A006',
          name: 'Mohammed Ali',
          dob: '1970-02-18',
          address: 'Park Street, Kolkata',
          pan: 'MOHA1006F',
          occupation: 'Jewelry Dealer',
          country: 'India',
          is_pep: false,
          risk_score: 58,
          risk_category: 'Medium',
        },
        account: { num: 'ACCT-A006', type: 'Current', balance: 2800000 },
        history: [
          { amount: 120000, type: 'Deposit', from: 'CLIENT-GOLD', daysAgo: 35 },
          { amount: 95000, type: 'Transfer', from: 'ACCT-A006', to: 'EXT-01', daysAgo: 12 },
        ],
        trigger: { amount: 4200000, type: 'Transfer', from: 'ACCT-A006', to: 'EXT-HK', daysAgo: 1 },
        alert: {
          code: 'ALT-A006',
          type: 'Large Transaction',
          reason: 'Step 6 — Investigation Agent: multi-factor (txn spike + cash business + media)',
          risk_score: 76,
          severity: 'High',
          expected: 'Investigation → combined risk score',
        },
      },
      {
        agent: '7 · Decision Agent',
        customer: {
          num: 'CUST-A007',
          name: 'Anita Sharma',
          dob: '1988-07-22',
          address: 'Sector 18, Noida',
          pan: 'ANIT1007G',
          occupation: 'Retail Manager',
          country: 'India',
          is_pep: false,
          risk_score: 38,
          risk_category: 'Medium',
        },
        account: { num: 'ACCT-A007', type: 'Savings', balance: 290000 },
        history: [
          { amount: 48000, type: 'Withdrawal', from: 'ACCT-A007', to: 'ATM-1', daysAgo: 3 },
          { amount: 49500, type: 'Withdrawal', from: 'ACCT-A007', to: 'ATM-2', daysAgo: 2 },
        ],
        trigger: { amount: 49900, type: 'Withdrawal', from: 'ACCT-A007', to: 'ATM-3', daysAgo: 1 },
        alert: {
          code: 'ALT-A007',
          type: 'Structuring',
          reason: 'Step 7 — Decision Agent: ambiguous structuring (ESCALATE vs CLEAR)',
          risk_score: 55,
          severity: 'Medium',
          expected: 'Decision → ESCALATE (manual review)',
        },
      },
      {
        agent: '8 · Report Agent',
        customer: {
          num: 'CUST-A008',
          name: 'Nirav Modi',
          dob: '1971-02-27',
          address: '33 Albemarle Street, London',
          pan: 'NIRA1008H',
          occupation: 'Diamond Merchant',
          country: 'India',
          is_pep: false,
          risk_score: 88,
          risk_category: 'High',
        },
        account: { num: 'ACCT-A008', type: 'Current', balance: 22000000 },
        history: [
          { amount: 5000000, type: 'Transfer', from: 'ACCT-A008', to: 'EXT-HK', daysAgo: 50 },
          { amount: 4100000, type: 'Transfer', from: 'ACCT-A008', to: 'EXT-SG', daysAgo: 18 },
        ],
        trigger: { amount: 9800000, type: 'Transfer', from: 'ACCT-A008', to: 'EXT-OFFSHORE', daysAgo: 1 },
        alert: {
          code: 'ALT-A008',
          type: 'Large Transaction',
          reason: 'Step 8 — Report Agent: full critical case (profile + txn + media → SAR report)',
          risk_score: 96,
          severity: 'Critical',
          expected: 'Report → SAR + compliance narrative',
        },
      },
    ];

    for (const s of scenarios) {
      const custIns = await client.query(
        `INSERT INTO customers (customer_number, name, dob, address, pan, occupation, country, is_pep, risk_score, risk_category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
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
        ]
      );
      const custId = custIns.rows[0].id;

      const accIns = await client.query(
        `INSERT INTO accounts (customer_id, account_number, account_type, balance, opened_at)
         VALUES ($1,$2,$3,$4, NOW() - INTERVAL '3 years') RETURNING id`,
        [custId, s.account.num, s.account.type, s.account.balance]
      );
      const accId = accIns.rows[0].id;

      for (const h of s.history) {
        await client.query(
          `INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
           VALUES ($1,$2,$3,$4,$5,'India',$6,'Completed')`,
          [accId, h.amount, h.type, h.from, h.to ?? s.account.num, day(h.daysAgo)]
        );
      }

      const triggerCountry = (s.trigger as { country?: string }).country ?? 'India';
      const triggerIns = await client.query(
        `INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Completed') RETURNING id`,
        [
          accId,
          s.trigger.amount,
          s.trigger.type,
          s.trigger.from,
          (s.trigger as { to?: string }).to ?? s.account.num,
          triggerCountry,
          day(s.trigger.daysAgo),
        ]
      );

      await client.query(
        `INSERT INTO alerts (alert_code, customer_id, transaction_id, alert_type, reason, risk_score, severity, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Open')`,
        [
          s.alert.code,
          custId,
          triggerIns.rows[0].id,
          s.alert.type,
          s.alert.reason,
          s.alert.risk_score,
          s.alert.severity,
        ]
      );

      console.log(`  + ${s.alert.code} | ${s.agent}`);
      console.log(`      ${s.customer.name} | ${s.alert.severity} | ${s.alert.expected}\n`);
    }

    await client.query(
      `INSERT INTO notifications (title, message, user_id, is_read) VALUES ($1, $2, $3, false)`,
      [
        '8 Agent Pipeline Test Alerts',
        'Demo data reset. Run AI investigations in order ALT-A001 → ALT-A008 to test each agent.',
        managerId,
      ]
    );

    await client.query('COMMIT');

    console.log('✅ Done — 8 customers, 8 open alerts.\n');
    console.log('Pipeline test order:');
    console.log('  ALT-A001  Profile Agent');
    console.log('  ALT-A002  Transaction Agent');
    console.log('  ALT-A003  Sanctions Agent');
    console.log('  ALT-A004  PEP Agent');
    console.log('  ALT-A005  Adverse Media Agent (Google Search)');
    console.log('  ALT-A006  Investigation Synthesis Agent');
    console.log('  ALT-A007  Decision Agent');
    console.log('  ALT-A008  Report Agent (full SAR case)\n');
    console.log('Login: manager@bank.com / Manager@123\n');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Seed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedAgentPipelineTestData();
}

export default seedAgentPipelineTestData;
