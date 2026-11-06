-- Atomic one-time bootstrap gate. The completed marker and first school/admin
-- creation are committed in one D1 batch to prevent concurrent first-admin races.
CREATE TABLE IF NOT EXISTS bootstrap_guard (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  owner_token TEXT NOT NULL DEFAULT '',
  completed_at TEXT
);
