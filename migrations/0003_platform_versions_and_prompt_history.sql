PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS platform_settings (
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (school_id, setting_key)
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  prompt_key TEXT NOT NULL,
  version_major INTEGER NOT NULL DEFAULT 1,
  version_minor INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  change_note TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  UNIQUE (school_id, prompt_key, version_major, version_minor)
);
CREATE INDEX IF NOT EXISTS prompt_versions_history_idx
  ON prompt_versions(school_id, prompt_key, version_major DESC, version_minor DESC);
CREATE INDEX IF NOT EXISTS prompt_versions_active_idx
  ON prompt_versions(school_id, prompt_key, is_active);
