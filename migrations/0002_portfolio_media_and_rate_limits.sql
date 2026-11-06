-- Upgrade migration for existing Chemistry Atlas D1 databases.
CREATE TABLE IF NOT EXISTS api_rate_limits (
  scope_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(scope_key, window_start)
);
CREATE INDEX IF NOT EXISTS rate_limit_window_idx ON api_rate_limits(window_start);

CREATE TABLE IF NOT EXISTS portfolio_media (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id TEXT REFERENCES portfolios(id) ON DELETE SET NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS portfolio_media_owner_idx ON portfolio_media(school_id,user_id,created_at);
CREATE INDEX IF NOT EXISTS portfolio_media_item_idx ON portfolio_media(portfolio_id);
