import { Client } from 'pg';
import config from '../config';

type TxnRow = {
  amount: number;
  type: string;
  from: string;
  to?: string;
  country?: string;
  daysAgo: number;
};

type Scenario = {
  customer: {
    num: string;
    name: string;
    dob: string;
    address: string;
    pan: string;
    occupation: string;
    country: string;
    is_pep: boolean;
    risk_score: number;
    risk_category: string;
  };
  account: { num: string; type: string; balance: number };
  history: TxnRow[];
  trigger: TxnRow;
  alert: {
    code: string;
    type: string;
    reason: string;
    risk_score: number;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    status?: string;
  };
  outcome?: {
    ai_decision: 'SAR' | 'CLEAR' | 'ESCALATE';
    confidence: number;
    report_summary: string;
    alert_status: string;
    case_status?: string;
    sar?: boolean;
  };
};

async function clearAmlData(client: Client): Promise<void> {
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
}

async function insertScenario(
  client: Client,
  managerId: number,
  s: Scenario,
  day: (d: number) => Date
): Promise<void> {
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Completed')`,
      [
        accId,
        h.amount,
        h.type,
        h.from,
        h.to ?? s.account.num,
        h.country ?? 'India',
        day(h.daysAgo),
      ]
    );
  }

  const triggerIns = await client.query(
    `INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Completed') RETURNING id`,
    [
      accId,
      s.trigger.amount,
      s.trigger.type,
      s.trigger.from,
      s.trigger.to ?? s.account.num,
      s.trigger.country ?? 'India',
      day(s.trigger.daysAgo),
    ]
  );
  const txnId = triggerIns.rows[0].id;

  const alertStatus = s.alert.status ?? (s.outcome ? s.outcome.alert_status : 'Open');
  const alertIns = await client.query(
    `INSERT INTO alerts (alert_code, customer_id, transaction_id, alert_type, reason, risk_score, severity, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      s.alert.code,
      custId,
      txnId,
      s.alert.type,
      s.alert.reason,
      s.alert.risk_score,
      s.alert.severity,
      alertStatus,
    ]
  );
  const alertId = alertIns.rows[0].id;

  if (!s.outcome) {
    console.log(`  + ${s.alert.code} | ${s.customer.name} | ${s.alert.severity} | Open (run AI)`);
    return;
  }

  const invIns = await client.query(
    `INSERT INTO investigations (alert_id, manager_id, status, ai_decision, confidence, report_summary, completed_at)
     VALUES ($1,$2,'Completed',$3,$4,$5,NOW()) RETURNING id`,
    [alertId, managerId, s.outcome.ai_decision, s.outcome.confidence, s.outcome.report_summary]
  );
  const invId = invIns.rows[0].id;

  await client.query(
    `INSERT INTO agent_results (investigation_id, agent_type, result) VALUES
     ($1,'decision', $2::jsonb),
     ($1,'pep_check', '{"pepMatch":false,"summary":"No PEP match"}'::jsonb),
     ($1,'sanctions_check', '{"sanctionMatch":false,"summary":"Screening recorded in seed"}'::jsonb)`,
    [invId, JSON.stringify({ decision: s.outcome.ai_decision, confidence: s.outcome.confidence })]
  );

  if (s.outcome.ai_decision === 'SAR' || s.outcome.ai_decision === 'ESCALATE') {
    const caseIns = await client.query(
      `INSERT INTO cases (case_number, investigation_id, alert_id, customer_id, status, priority, summary, closed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        `CASE-${s.alert.code}`,
        invId,
        alertId,
        custId,
        s.outcome.case_status ?? 'SAR Filed',
        s.alert.severity,
        s.outcome.report_summary.slice(0, 500),
        s.outcome.case_status === 'SAR Filed' ? new Date() : null,
      ]
    );

    if (s.outcome.sar) {
      await client.query(
        `INSERT INTO sar_reports (case_id, investigation_id, customer_id, report_number, narrative, filed_by, status)
         VALUES ($1,$2,$3,$4,$5,$6,'Draft')`,
        [
          caseIns.rows[0].id,
          invId,
          custId,
          `SAR-${s.alert.code}`,
          s.outcome.report_summary.slice(0, 2000),
          managerId,
        ]
      );
    }
  }

  console.log(
    `  + ${s.alert.code} | ${s.customer.name} | Alert: ${s.alert.severity} → AI ${s.outcome.ai_decision} | Alert status: ${alertStatus}`
  );
}

/**
 * Wipes AML demo data and loads open alerts only (no pre-run investigations).
 * - 3 Low severity — run AI manually → expect SAR
 * - 3 Critical severity — run AI manually → expect CLEAR
 * - 6 additional open alerts
 */
async function seedDemoDataset(): Promise<void> {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    await client.connect();
    console.log('Resetting AML data and loading demo dataset...\n');

    const manager = await client.query(`SELECT id FROM users WHERE email = 'manager@bank.com' LIMIT 1`);
    if (!manager.rows.length) {
      console.error('No manager user found. Run: npm run db:seed');
      process.exit(1);
    }
    const managerId = manager.rows[0].id;

    const now = Date.now();
    const day = (d: number) => new Date(now - d * 86400000);

    await client.query('BEGIN');
    await clearAmlData(client);
    console.log('  Cleared customers, alerts, investigations, cases\n');

    const lowToSar: Scenario[] = [
      {
        customer: {
          num: 'CUST-LS01',
          name: 'Mohammed Ali Hassan',
          dob: '1975-12-01',
          address: '102 Park Street, Kolkata',
          pan: 'MOHA9012C',
          occupation: 'Import Trader',
          country: 'Syria',
          is_pep: false,
          risk_score: 22,
          risk_category: 'Low',
        },
        account: { num: 'ACCT-LS01', type: 'NRI', balance: 3200000 },
        history: [{ amount: 85000, type: 'Deposit', from: 'EXT-IN', daysAgo: 40 }],
        trigger: {
          amount: 420000,
          type: 'Transfer',
          from: 'ACCT-LS01',
          to: 'EXT-SY',
          country: 'Syria',
          daysAgo: 2,
        },
        alert: {
          code: 'ALT-LS01',
          type: 'Routine Monitoring',
          reason: 'LOW severity — sanctions name + Syria txn | Run AI → expect SAR',
          risk_score: 18,
          severity: 'Low',
        },
      },
      {
        customer: {
          num: 'CUST-LS02',
          name: 'Nirav Modi',
          dob: '1971-02-27',
          address: 'Mumbai, India',
          pan: 'NIRV2002A',
          occupation: 'Jewelry Trader',
          country: 'India',
          is_pep: false,
          risk_score: 28,
          risk_category: 'Low',
        },
        account: { num: 'ACCT-LS02', type: 'Current', balance: 1800000 },
        history: [{ amount: 120000, type: 'Deposit', from: 'EXT-CLIENT', daysAgo: 30 }],
        trigger: {
          amount: 185000,
          type: 'Transfer',
          from: 'ACCT-LS02',
          to: 'EXT-UAE',
          country: 'India',
          daysAgo: 1,
        },
        alert: {
          code: 'ALT-LS02',
          type: 'Low Value Transfer',
          reason: 'LOW severity — adverse media name match | Run AI → expect SAR',
          risk_score: 15,
          severity: 'Low',
        },
      },
      {
        customer: {
          num: 'CUST-LS03',
          name: 'Farid Khan',
          dob: '1982-09-11',
          address: 'Kuala Lumpur, Malaysia',
          pan: 'FARK2003B',
          occupation: 'Trading Business',
          country: 'Malaysia',
          is_pep: false,
          risk_score: 20,
          risk_category: 'Low',
        },
        account: { num: 'ACCT-LS03', type: 'NRI', balance: 2900000 },
        history: [{ amount: 95000, type: 'Transfer', from: 'ACCT-LS03', to: 'EXT-SG', daysAgo: 25 }],
        trigger: {
          amount: 310000,
          type: 'Transfer',
          from: 'ACCT-LS03',
          to: 'EXT-MY',
          country: 'Malaysia',
          daysAgo: 1,
        },
        alert: {
          code: 'ALT-LS03',
          type: 'Geography Review',
          reason: 'LOW severity — Malaysia corridor | Run AI → expect SAR',
          risk_score: 14,
          severity: 'Low',
        },
      },
    ];

    const criticalToClear: Scenario[] = [
      {
        customer: {
          num: 'CUST-CC01',
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
        account: { num: 'ACCT-CC01', type: 'Savings', balance: 385000 },
        history: [
          { amount: 220000, type: 'Deposit', from: 'GOVT-SAL', daysAgo: 90 },
          { amount: 218000, type: 'Deposit', from: 'GOVT-SAL', daysAgo: 60 },
          { amount: 221000, type: 'Deposit', from: 'GOVT-SAL', daysAgo: 30 },
        ],
        trigger: { amount: 480000, type: 'Deposit', from: 'GOVT-BONUS', daysAgo: 1 },
        alert: {
          code: 'ALT-CC01',
          type: 'Large Transaction',
          reason: 'CRITICAL rules: annual bonus ₹4.8L | Run AI → expect CLEAR',
          risk_score: 92,
          severity: 'Critical',
        },
      },
      {
        customer: {
          num: 'CUST-CC02',
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
        account: { num: 'ACCT-CC02', type: 'Savings', balance: 290000 },
        history: [
          { amount: 185000, type: 'Deposit', from: 'HOSP-PAY', daysAgo: 75 },
          { amount: 182000, type: 'Deposit', from: 'HOSP-PAY', daysAgo: 45 },
        ],
        trigger: { amount: 420000, type: 'Deposit', from: 'HOSP-ARREARS', daysAgo: 2 },
        alert: {
          code: 'ALT-CC02',
          type: 'Sudden Activity Spike',
          reason: 'CRITICAL rules: hospital arrears ₹4.2L | Run AI → expect CLEAR',
          risk_score: 88,
          severity: 'Critical',
        },
      },
      {
        customer: {
          num: 'CUST-CC03',
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
        account: { num: 'ACCT-CC03', type: 'Savings', balance: 520000 },
        history: [
          { amount: 95000, type: 'Deposit', from: 'FD-INT', daysAgo: 120 },
          { amount: 95000, type: 'Deposit', from: 'FD-INT', daysAgo: 60 },
        ],
        trigger: { amount: 380000, type: 'Deposit', from: 'FD-MATURITY', daysAgo: 1 },
        alert: {
          code: 'ALT-CC03',
          type: 'Large Transaction',
          reason: 'CRITICAL rules: FD maturity ₹3.8L | Run AI → expect CLEAR',
          risk_score: 85,
          severity: 'Critical',
        },
      },
    ];

    const randomOpen: Scenario[] = [
      {
        customer: {
          num: 'CUST-RD01',
          name: 'Priya Menon',
          dob: '1993-03-18',
          address: '9 Marine Drive, Kochi',
          pan: 'PRYM3001A',
          occupation: 'UX Designer',
          country: 'India',
          is_pep: false,
          risk_score: 14,
          risk_category: 'Low',
        },
        account: { num: 'ACCT-RD01', type: 'Savings', balance: 210000 },
        history: [{ amount: 72000, type: 'Deposit', from: 'EMP-SAL', daysAgo: 20 }],
        trigger: { amount: 75000, type: 'Deposit', from: 'EMP-SAL', daysAgo: 1 },
        alert: {
          code: 'ALT-RD01',
          type: 'Salary Credit',
          reason: 'Routine monthly salary — open for triage',
          risk_score: 11,
          severity: 'Low',
        },
      },
      {
        customer: {
          num: 'CUST-RD02',
          name: 'Vikram Joshi',
          dob: '1988-07-22',
          address: '55 Andheri West, Mumbai',
          pan: 'VIKR3002B',
          occupation: 'Logistics Manager',
          country: 'India',
          is_pep: false,
          risk_score: 38,
          risk_category: 'Medium',
        },
        account: { num: 'ACCT-RD02', type: 'Current', balance: 640000 },
        history: [
          { amount: 95000, type: 'Transfer', from: 'ACCT-RD02', to: 'VENDOR-01', daysAgo: 18 },
          { amount: 88000, type: 'Transfer', from: 'ACCT-RD02', to: 'VENDOR-02', daysAgo: 8 },
        ],
        trigger: { amount: 1250000, type: 'Transfer', from: 'ACCT-RD02', to: 'EXT-INTL', daysAgo: 1 },
        alert: {
          code: 'ALT-RD02',
          type: 'Large Transaction',
          reason: '₹12.5L international logistics payment',
          risk_score: 62,
          severity: 'High',
        },
      },
      {
        customer: {
          num: 'CUST-RD03',
          name: 'Sneha Kapoor',
          dob: '1990-11-05',
          address: '8 Jubilee Hills, Hyderabad',
          pan: 'SNEH3003C',
          occupation: 'Real Estate Agent',
          country: 'India',
          is_pep: false,
          risk_score: 42,
          risk_category: 'Medium',
        },
        account: { num: 'ACCT-RD03', type: 'Savings', balance: 340000 },
        history: [
          { amount: 48000, type: 'Withdrawal', from: 'ACCT-RD03', to: 'ATM-01', daysAgo: 3 },
          { amount: 49500, type: 'Withdrawal', from: 'ACCT-RD03', to: 'ATM-02', daysAgo: 2 },
        ],
        trigger: { amount: 49800, type: 'Withdrawal', from: 'ACCT-RD03', to: 'ATM-03', daysAgo: 1 },
        alert: {
          code: 'ALT-RD03',
          type: 'Structuring',
          reason: 'Sub-₹50k withdrawals within 72h',
          risk_score: 55,
          severity: 'Medium',
        },
      },
      {
        customer: {
          num: 'CUST-RD04',
          name: 'Rajesh Kumar',
          dob: '1976-03-08',
          address: '15 MG Road, Jaipur',
          pan: 'RAJK3004D',
          occupation: 'Municipal Councilor',
          country: 'India',
          is_pep: false,
          risk_score: 52,
          risk_category: 'Medium',
        },
        account: { num: 'ACCT-RD04', type: 'Current', balance: 780000 },
        history: [{ amount: 95000, type: 'Deposit', from: 'COUNCIL-PAY', daysAgo: 30 }],
        trigger: { amount: 1150000, type: 'Transfer', from: 'ACCT-RD04', to: 'EXT-DEV', daysAgo: 1 },
        alert: {
          code: 'ALT-RD04',
          type: 'PEP Screening',
          reason: 'Large transfer — PEP registry name similarity',
          risk_score: 68,
          severity: 'High',
        },
      },
      {
        customer: {
          num: 'CUST-RD05',
          name: 'Ananya Desai',
          dob: '1995-05-20',
          address: '14 Koramangala, Bangalore',
          pan: 'ANAD3005E',
          occupation: 'Software Consultant',
          country: 'India',
          is_pep: false,
          risk_score: 9,
          risk_category: 'Low',
        },
        account: { num: 'ACCT-RD05', type: 'Savings', balance: 320000 },
        history: [{ amount: 65000, type: 'Deposit', from: 'CLIENT-INV', daysAgo: 25 }],
        trigger: { amount: 68000, type: 'Deposit', from: 'CLIENT-INV', daysAgo: 2 },
        alert: {
          code: 'ALT-RD05',
          type: 'Invoice Payment',
          reason: 'Regular freelance invoice — low risk',
          risk_score: 8,
          severity: 'Low',
        },
      },
      {
        customer: {
          num: 'CUST-RD06',
          name: 'Mohammed Ali',
          dob: '1980-06-12',
          address: '56 Park Street, Kolkata',
          pan: 'MOAL3006F',
          occupation: 'Jeweler',
          country: 'India',
          is_pep: true,
          risk_score: 74,
          risk_category: 'High',
        },
        account: { num: 'ACCT-RD06', type: 'NRI', balance: 2100000 },
        history: [{ amount: 120000, type: 'Deposit', from: 'EXT-GOLD', daysAgo: 20 }],
        trigger: { amount: 1650000, type: 'Transfer', from: 'ACCT-RD06', to: 'EXT-GOLD-99', daysAgo: 1 },
        alert: {
          code: 'ALT-RD06',
          type: 'Large Transaction',
          reason: '₹16.5L gold trade — PEP flagged customer',
          risk_score: 82,
          severity: 'Critical',
        },
      },
    ];

    console.log('Low severity — Open (run AI → expect SAR):');
    for (const s of lowToSar) await insertScenario(client, managerId, s, day);

    console.log('\nCritical severity — Open (run AI → expect CLEAR):');
    for (const s of criticalToClear) await insertScenario(client, managerId, s, day);

    console.log('\nAdditional open alerts:');
    for (const s of randomOpen) await insertScenario(client, managerId, s, day);

    await client.query(
      `INSERT INTO notifications (title, message, user_id, is_read) VALUES ($1, $2, $3, false)`,
      [
        'Demo dataset loaded',
        '12 open alerts — no investigations yet. Start AI Investigation from the Alerts page.',
        managerId,
      ]
    );

    await client.query('COMMIT');

    console.log('\n✅ Demo dataset ready (all alerts Open, no investigations).');
    console.log('  Low → SAR (run AI):  ALT-LS01, ALT-LS02, ALT-LS03');
    console.log('  Critical → CLEAR:    ALT-CC01, ALT-CC02, ALT-CC03');
    console.log('  More open alerts:    ALT-RD01 … ALT-RD06');
    console.log('\nLogin: manager@bank.com / Manager@123');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Demo seed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedDemoDataset();
}

export default seedDemoDataset;
