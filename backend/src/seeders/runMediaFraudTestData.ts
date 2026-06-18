import { Client } from 'pg';
import config from '../config';

/**
 * Adds high-risk sample customers for live adverse media (Google Search) testing.
 * Customer names are stored in DB only — screening always uses Google Search at investigation time.
 */
async function seedMediaFraudTestData(): Promise<void> {
  const client = new Client({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
  });

  try {
    await client.connect();
    console.log('Adding adverse media (fraud) test customers...\n');
    console.log('Adverse Media Agent will Google Search: name + "fraud" / "money laundering"\n');

    const manager = await client.query(`SELECT id FROM users WHERE email = 'manager@bank.com' LIMIT 1`);
    const managerId = manager.rows[0]?.id ?? null;

    const now = Date.now();
    const day = (d: number) => new Date(now - d * 86400000);

    const scenarios = [
      {
        customer: {
          num: 'CUST-M001',
          name: 'Nirav Modi',
          dob: '1971-02-27',
          address: '33 Albemarle Street, London',
          pan: 'NIRA7001F',
          occupation: 'Diamond Merchant',
          country: 'India',
          is_pep: false,
          risk_score: 72,
          risk_category: 'High',
        },
        account: { num: 'ACCT-M001', type: 'Current', balance: 18500000 },
        history: [
          { amount: 4200000, type: 'Transfer', from: 'ACCT-M001', to: 'EXT-HK-01', daysAgo: 45 },
          { amount: 3800000, type: 'Transfer', from: 'ACCT-M001', to: 'EXT-SG-02', daysAgo: 20 },
        ],
        trigger: { amount: 9200000, type: 'Transfer', from: 'ACCT-M001', to: 'EXT-OFFSHORE', daysAgo: 1 },
        alert: {
          code: 'ALT-M001',
          type: 'Large Transaction',
          reason: '₹92L outbound transfer — large value, adverse media screening test',
          risk_score: 85,
          severity: 'Critical',
          googleTest: 'Nirav Modi fraud money laundering PNB',
        },
      },
      {
        customer: {
          num: 'CUST-M002',
          name: 'Vijay Mallya',
          dob: '1955-12-18',
          address: 'UB City, Bangalore',
          pan: 'VIJA7002G',
          occupation: 'Business Tycoon',
          country: 'India',
          is_pep: false,
          risk_score: 78,
          risk_category: 'High',
        },
        account: { num: 'ACCT-M002', type: 'Current', balance: 22000000 },
        history: [
          { amount: 5500000, type: 'Transfer', from: 'ACCT-M002', to: 'EXT-UAE-01', daysAgo: 60 },
          { amount: 2100000, type: 'Withdrawal', from: 'ACCT-M002', to: 'CASH', daysAgo: 15 },
        ],
        trigger: { amount: 15000000, type: 'Transfer', from: 'ACCT-M002', to: 'EXT-UK-01', daysAgo: 2 },
        alert: {
          code: 'ALT-M002',
          type: 'Sudden Activity Spike',
          reason: '₹1.5Cr transfer — sudden activity spike, adverse media screening test',
          risk_score: 88,
          severity: 'Critical',
          googleTest: 'Vijay Mallya fraud money laundering',
        },
      },
      {
        customer: {
          num: 'CUST-M003',
          name: 'Elizabeth Holmes',
          dob: '1984-02-03',
          address: 'Palo Alto, California',
          pan: 'ELIZ7003H',
          occupation: 'CEO',
          country: 'United States',
          is_pep: false,
          risk_score: 65,
          risk_category: 'High',
        },
        account: { num: 'ACCT-M003', type: 'Current', balance: 8900000 },
        history: [
          { amount: 1200000, type: 'Deposit', from: 'INVESTOR-01', to: 'ACCT-M003', daysAgo: 90 },
          { amount: 800000, type: 'Transfer', from: 'ACCT-M003', to: 'EXT-LAB', daysAgo: 30 },
        ],
        trigger: { amount: 4500000, type: 'Transfer', from: 'ACCT-M003', to: 'EXT-SHELL', daysAgo: 1 },
        alert: {
          code: 'ALT-M003',
          type: 'Large Transaction',
          reason: '₹45L transfer — large value, adverse media screening test',
          risk_score: 80,
          severity: 'High',
          googleTest: 'Elizabeth Holmes fraud Theranos',
        },
      },
    ];

    let added = 0;

    for (const s of scenarios) {
      let custId: number;
      const existingCust = await client.query(`SELECT id FROM customers WHERE customer_number = $1`, [
        s.customer.num,
      ]);

      if (existingCust.rows.length) {
        custId = existingCust.rows[0].id;
        await client.query(
          `UPDATE customers SET name=$1, occupation=$2, country=$3, is_pep=$4, risk_score=$5, risk_category=$6, address=$7, pan=$8 WHERE id=$9`,
          [
            s.customer.name,
            s.customer.occupation,
            s.customer.country,
            s.customer.is_pep,
            s.customer.risk_score,
            s.customer.risk_category,
            s.customer.address,
            s.customer.pan,
            custId,
          ]
        );
      } else {
        const ins = await client.query(
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
        custId = ins.rows[0].id;
        added++;
      }

      let accId: number;
      const existingAcc = await client.query(`SELECT id FROM accounts WHERE account_number = $1`, [s.account.num]);
      if (existingAcc.rows.length) {
        accId = existingAcc.rows[0].id;
      } else {
        const ins = await client.query(
          `INSERT INTO accounts (customer_id, account_number, account_type, balance, opened_at)
           VALUES ($1,$2,$3,$4, NOW() - INTERVAL '3 years') RETURNING id`,
          [custId, s.account.num, s.account.type, s.account.balance]
        );
        accId = ins.rows[0].id;
      }

      const existingAlert = await client.query(`SELECT id, transaction_id FROM alerts WHERE alert_code = $1`, [
        s.alert.code,
      ]);

      let triggerTxnId: number;
      const triggerDate = day(s.trigger.daysAgo);

      if (existingAlert.rows.length && existingAlert.rows[0].transaction_id) {
        triggerTxnId = existingAlert.rows[0].transaction_id;
        await client.query(
          `UPDATE transactions SET account_id=$1, amount=$2, transaction_type=$3, sender_account=$4, receiver_account=$5, transaction_date=$6 WHERE id=$7`,
          [accId, s.trigger.amount, s.trigger.type, s.trigger.from, s.trigger.to, triggerDate, triggerTxnId]
        );
      } else {
        const txnIns = await client.query(
          `INSERT INTO transactions (account_id, amount, transaction_type, sender_account, receiver_account, country, transaction_date, status)
           VALUES ($1,$2,$3,$4,$5,'India',$6,'Completed') RETURNING id`,
          [accId, s.trigger.amount, s.trigger.type, s.trigger.from, s.trigger.to, triggerDate]
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

      console.log(`  ✓ ${s.alert.code} | ${s.customer.name}`);
      console.log(`    Adverse media agent will Google Search this customer name at investigation time\n`);
    }

    if (managerId) {
      await client.query(
        `INSERT INTO notifications (title, message, user_id, is_read) VALUES ($1, $2, $3, false)`,
        [
          'Adverse Media Test Alerts Added',
          '3 fraud-name customers added for live Google Search testing (ALT-M001 to ALT-M003).',
          managerId,
        ]
      );
    }

    console.log('✅ Adverse media fraud test data ready.\n');
    console.log('How to test:');
    console.log('  1. Ensure USE_MOCK_SCREENING=false in backend/.env');
    console.log('  2. Alerts page → open ALT-M001, ALT-M002, or ALT-M003');
    console.log('  3. Start AI Investigation');
    console.log('  4. Check agent_results → media_analysis for articles from Google Search\n');
    console.log('Expected: negativeNews=true, articleCount>0, article_urls from web\n');
  } catch (error) {
    console.error('Seed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seedMediaFraudTestData();
}

export default seedMediaFraudTestData;
