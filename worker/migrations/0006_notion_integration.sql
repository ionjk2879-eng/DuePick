CREATE TABLE IF NOT EXISTS notion_connections (
  user_id INTEGER PRIMARY KEY,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT,
  bot_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE deals ADD COLUMN notion_page_id TEXT;
ALTER TABLE deals ADD COLUMN notion_page_url TEXT;
ALTER TABLE deals ADD COLUMN notion_exported_at TEXT;
