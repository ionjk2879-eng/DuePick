ALTER TABLE inbound_emails ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE inbound_emails ADD COLUMN last_attempt_at TEXT;

ALTER TABLE expenses ADD COLUMN evidence_object_key TEXT;
ALTER TABLE expenses ADD COLUMN evidence_file_name TEXT;
ALTER TABLE expenses ADD COLUMN evidence_content_type TEXT;
ALTER TABLE expenses ADD COLUMN evidence_size INTEGER;

