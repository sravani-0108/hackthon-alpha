-- AML Alert Triage & Investigation System Schema
-- PostgreSQL 14+

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('bank_manager', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE risk_category AS ENUM ('Low', 'Medium', 'High');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE account_type AS ENUM ('Savings', 'Current', 'Fixed Deposit', 'NRI');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE transaction_type AS ENUM ('Credit', 'Debit', 'Transfer', 'Withdrawal', 'Deposit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE transaction_status AS ENUM ('Pending', 'Completed', 'Failed', 'Reversed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE alert_severity AS ENUM ('Low', 'Medium', 'High', 'Critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE alert_status AS ENUM ('Open', 'Under Investigation', 'Escalated', 'Closed', 'Cleared');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE investigation_status AS ENUM ('Open', 'Under Investigation', 'Legitimate', 'Escalated', 'Closed', 'Completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE ai_decision_type AS ENUM ('CLEAR', 'ESCALATE', 'SAR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE case_status AS ENUM ('Open', 'Assigned', 'Under Review', 'Closed', 'SAR Filed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE agent_type AS ENUM (
  'customer_analysis', 'transaction_analysis', 'sanctions_check',
  'pep_check', 'media_analysis', 'investigation', 'decision', 'report'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'bank_manager',
  refresh_token TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- high_risk_countries
CREATE TABLE IF NOT EXISTS high_risk_countries (
  id SERIAL PRIMARY KEY,
  country_name VARCHAR(150) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_high_risk_countries_country_name UNIQUE (country_name)
);

CREATE INDEX IF NOT EXISTS idx_high_risk_countries_is_active ON high_risk_countries (is_active);

-- customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  customer_number VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  dob DATE NULL,
  address TEXT NULL,
  pan VARCHAR(20) NULL,
  aadhaar VARCHAR(20) NULL,
  occupation VARCHAR(150) NULL,
  country VARCHAR(100) DEFAULT 'India',
  is_pep BOOLEAN NOT NULL DEFAULT FALSE,
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_category risk_category NOT NULL DEFAULT 'Low',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_customers_customer_number UNIQUE (customer_number)
);

CREATE INDEX IF NOT EXISTS idx_customers_risk_category ON customers (risk_category);
CREATE INDEX IF NOT EXISTS idx_customers_country ON customers (country);
CREATE INDEX IF NOT EXISTS idx_customers_is_pep ON customers (is_pep);

-- accounts
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_type account_type NOT NULL DEFAULT 'Savings',
  balance DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  opened_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_accounts_account_number UNIQUE (account_number),
  CONSTRAINT fk_accounts_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON accounts (customer_id);

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  transaction_type transaction_type NOT NULL,
  sender_account VARCHAR(50) NULL,
  receiver_account VARCHAR(50) NULL,
  country VARCHAR(100) NULL,
  transaction_date TIMESTAMP NOT NULL,
  status transaction_status NOT NULL DEFAULT 'Completed',
  CONSTRAINT fk_transactions_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions (account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions (amount);

-- aml_alerts (alerts)
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  alert_code VARCHAR(50) NULL,
  customer_id INTEGER NOT NULL,
  transaction_id INTEGER NULL,
  alert_type VARCHAR(100) NOT NULL,
  reason TEXT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  severity alert_severity NOT NULL DEFAULT 'Medium',
  status alert_status NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alerts_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT fk_alerts_transaction FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_customer_id ON alerts (customer_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_alert_code ON alerts (alert_code);

-- alert_evidence
CREATE TABLE IF NOT EXISTS alert_evidence (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL,
  evidence_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  source VARCHAR(150) NULL,
  metadata JSONB NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alert_evidence_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alert_evidence_alert_id ON alert_evidence (alert_id);

-- investigations
CREATE TABLE IF NOT EXISTS investigations (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL,
  manager_id INTEGER NULL,
  notes TEXT NULL,
  status investigation_status NOT NULL DEFAULT 'Open',
  ai_decision ai_decision_type NULL,
  confidence INTEGER NULL,
  report_summary TEXT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_investigations_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE,
  CONSTRAINT fk_investigations_manager FOREIGN KEY (manager_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_investigations_alert_id ON investigations (alert_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations (status);

-- agent_results
CREATE TABLE IF NOT EXISTS agent_results (
  id SERIAL PRIMARY KEY,
  investigation_id INTEGER NOT NULL,
  agent_type agent_type NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_agent_results_investigation FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_results_investigation_id ON agent_results (investigation_id);
CREATE INDEX IF NOT EXISTS idx_agent_results_agent_type ON agent_results (agent_type);

-- cases
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(50) NOT NULL,
  investigation_id INTEGER NOT NULL,
  alert_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  assigned_to INTEGER NULL,
  status case_status NOT NULL DEFAULT 'Open',
  priority alert_severity NOT NULL DEFAULT 'Medium',
  summary TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP NULL,
  CONSTRAINT uk_cases_case_number UNIQUE (case_number),
  CONSTRAINT fk_cases_investigation FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE,
  CONSTRAINT fk_cases_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE,
  CONSTRAINT fk_cases_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT fk_cases_assigned_to FOREIGN KEY (assigned_to) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases (assigned_to);

-- sar_reports
CREATE TABLE IF NOT EXISTS sar_reports (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL,
  investigation_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  report_number VARCHAR(50) NOT NULL,
  narrative TEXT NOT NULL,
  filed_by INTEGER NULL,
  filed_at TIMESTAMP NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_sar_reports_report_number UNIQUE (report_number),
  CONSTRAINT fk_sar_reports_case FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
  CONSTRAINT fk_sar_reports_investigation FOREIGN KEY (investigation_id) REFERENCES investigations (id) ON DELETE CASCADE,
  CONSTRAINT fk_sar_reports_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT fk_sar_reports_filed_by FOREIGN KEY (filed_by) REFERENCES users (id) ON DELETE SET NULL
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
