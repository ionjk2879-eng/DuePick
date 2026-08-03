PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  inbox_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
  usage_type TEXT NOT NULL CHECK (usage_type IN ('BUSINESS', 'PERSONAL')),
  accounting_category TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id, created_at DESC);

CREATE TABLE deals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client TEXT,
  deal_type TEXT,
  amount INTEGER,
  deliverables TEXT NOT NULL DEFAULT '[]',
  draft_due_date TEXT,
  publish_due_date TEXT,
  revision_count INTEGER,
  secondary_usage TEXT,
  payment_condition TEXT,
  tasks TEXT NOT NULL DEFAULT '[]',
  risks TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'REVIEW' CHECK (status IN ('REVIEW','CONFIRMED','IN_PROGRESS','COMPLETED','PAID')),
  raw_text TEXT NOT NULL,
  source_email_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_deals_user ON deals(user_id, created_at DESC);

CREATE TABLE user_plans (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'FREE' CHECK (plan_type IN ('FREE', 'PRO')),
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inbound_emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resend_email_id TEXT NOT NULL UNIQUE,
  svix_id TEXT NOT NULL UNIQUE,
  sender TEXT,
  recipient TEXT NOT NULL,
  subject TEXT,
  text_body TEXT NOT NULL,
  analysis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'REVIEW' CHECK (status IN ('REVIEW', 'SAVED', 'FAILED')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inbound_user ON inbound_emails(user_id, created_at DESC);
