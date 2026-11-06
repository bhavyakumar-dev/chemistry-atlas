PRAGMA foreign_keys = ON;

-- School-scoped rollout switches. Only release-ready and preview modules are
-- eligible for toggling; planned features remain locked in the application.
CREATE TABLE IF NOT EXISTS feature_flag_settings (
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  is_enabled INTEGER NOT NULL CHECK (is_enabled IN (0,1)),
  updated_by TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (school_id, feature_id)
);
CREATE INDEX IF NOT EXISTS feature_flag_school_updated_idx
  ON feature_flag_settings(school_id, updated_at DESC);
