ALTER TABLE deals ADD COLUMN paid_at TEXT;

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount >= 0),
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('BUSINESS', 'PERSONAL')),
  business_ratio INTEGER NOT NULL DEFAULT 100 CHECK (business_ratio BETWEEN 0 AND 100),
  payment_method TEXT,
  evidence_type TEXT NOT NULL DEFAULT 'NONE' CHECK (evidence_type IN ('NONE', 'RECEIPT', 'TAX_INVOICE', 'CASH_RECEIPT', 'CARD_SLIP', 'OTHER')),
  evidence_url TEXT,
  deduction_status TEXT NOT NULL DEFAULT 'REVIEW' CHECK (deduction_status IN ('REVIEW', 'CANDIDATE', 'EXCLUDED')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date DESC);
CREATE INDEX idx_expenses_deal ON expenses(deal_id);
