ALTER TABLE deals ADD COLUMN payment_due_date TEXT;
CREATE INDEX idx_deals_user_payment_due ON deals(user_id, payment_due_date);

