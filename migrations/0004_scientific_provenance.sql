PRAGMA foreign_keys = ON;

-- Source registry records the authority and licensing status of datasets.
CREATE TABLE IF NOT EXISTS scientific_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  licence_label TEXT NOT NULL,
  licence_url TEXT,
  reuse_class TEXT NOT NULL CHECK (reuse_class IN ('open-data','record-level-review','reference-only','software')),
  source_version TEXT,
  last_checked_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- A dataset snapshot is immutable once published; updates create a new version.
CREATE TABLE IF NOT EXISTS scientific_datasets (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES scientific_sources(id),
  dataset_version TEXT NOT NULL,
  retrieved_at TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  file_format TEXT NOT NULL,
  record_count INTEGER,
  licence_snapshot TEXT NOT NULL,
  attribution TEXT NOT NULL DEFAULT '',
  units_json TEXT NOT NULL DEFAULT '{}',
  conditions_json TEXT NOT NULL DEFAULT '{}',
  provenance_json TEXT NOT NULL DEFAULT '{}',
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending','passed','failed','needs-review')),
  reviewer_id TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(source_id, dataset_version, sha256)
);
CREATE INDEX IF NOT EXISTS scientific_datasets_source_idx ON scientific_datasets(source_id, retrieved_at DESC);
CREATE INDEX IF NOT EXISTS scientific_datasets_validation_idx ON scientific_datasets(validation_status, created_at DESC);

-- Model cards explain how a displayed scientific model was produced.
CREATE TABLE IF NOT EXISTS scientific_model_cards (
  id TEXT PRIMARY KEY,
  model_key TEXT NOT NULL,
  model_version TEXT NOT NULL,
  model_origin TEXT NOT NULL CHECK (model_origin IN ('experimental','computed','curated','idealised')),
  method TEXT NOT NULL,
  source_dataset_ids_json TEXT NOT NULL DEFAULT '[]',
  units_json TEXT NOT NULL DEFAULT '{}',
  conditions_json TEXT NOT NULL DEFAULT '{}',
  assumptions_json TEXT NOT NULL DEFAULT '[]',
  limitations_json TEXT NOT NULL DEFAULT '[]',
  validation_json TEXT NOT NULL DEFAULT '{}',
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (review_status IN ('draft','teacher-reviewed','scientifically-reviewed','rejected')),
  reviewer_id TEXT REFERENCES users(id),
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(model_key, model_version)
);
CREATE INDEX IF NOT EXISTS scientific_model_cards_review_idx ON scientific_model_cards(review_status, created_at DESC);
