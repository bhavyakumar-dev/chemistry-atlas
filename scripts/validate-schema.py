"""Smoke-test the D1 schema/migrations and teacher analytics SQL using stdlib SQLite."""
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
DB = sqlite3.connect(":memory:")
DB.execute("PRAGMA foreign_keys = ON")
migrations = sorted((ROOT / "migrations").glob("*.sql"))
for migration in migrations:
    DB.executescript(migration.read_text())

# The one-time bootstrap guard admits exactly one first-admin transaction.
DB.execute("INSERT INTO bootstrap_guard(id,owner_token,completed_at) VALUES(1,'',NULL) ON CONFLICT(id) DO NOTHING")
DB.execute("UPDATE bootstrap_guard SET owner_token=?,completed_at=? WHERE id=1 AND completed_at IS NULL AND NOT EXISTS (SELECT 1 FROM users)", ("attempt-one", "2026-11-04T00:00:00Z"))
assert DB.execute("SELECT changes()").fetchone()[0] == 1
DB.execute("INSERT INTO schools(id,name,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM bootstrap_guard WHERE id=1 AND owner_token=? AND completed_at=?)", ("bootstrap-school", "Bootstrap School", "2026-11-04", "attempt-one", "2026-11-04T00:00:00Z"))
DB.execute("INSERT INTO users(id,school_id,email,display_name,role,password_hash,created_at) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM bootstrap_guard WHERE id=1 AND owner_token=? AND completed_at=?)", ("bootstrap-admin", "bootstrap-school", "first@example.test", "First Admin", "admin", "hash", "2026-11-04", "attempt-one", "2026-11-04T00:00:00Z"))
DB.execute("UPDATE bootstrap_guard SET owner_token=?,completed_at=? WHERE id=1 AND completed_at IS NULL AND NOT EXISTS (SELECT 1 FROM users)", ("attempt-two", "2026-11-04T00:00:01Z"))
assert DB.execute("SELECT changes()").fetchone()[0] == 0
assert DB.execute("SELECT COUNT(*) FROM users WHERE role='admin'").fetchone()[0] == 1

DB.execute("INSERT INTO schools VALUES ('school-1','Test School','2026-11-04')")
DB.execute("INSERT INTO users(id,school_id,email,display_name,role,password_hash,created_at) VALUES ('teacher-1','school-1','teacher@example.test','Teacher','teacher','hash','2026-11-04'),('student-1','school-1','student@example.test','Student','student','hash','2026-11-04')")
DB.execute("INSERT INTO learning_events(id,school_id,user_id,event_type,topic_id,grade,track,score,max_score,duration_seconds,metadata_json,created_at) VALUES ('event-1','school-1','student-1','quiz_attempt','bonding','11','CISCE',4,5,45,'{}',datetime('now')),('event-2','school-1','student-1','lesson_complete','bonding','11','CISCE',NULL,NULL,120,'{}',datetime('now'))")

queries = {
    "users": "SELECT COUNT(*) AS n FROM users WHERE school_id=? AND role='student' AND disabled=0",
    "active": "SELECT COUNT(DISTINCT e.user_id) AS n FROM learning_events e JOIN users u ON u.id=e.user_id WHERE e.school_id=? AND u.role='student' AND e.created_at>=datetime('now','-7 days')",
    "events": "SELECT COUNT(*) AS n FROM learning_events e JOIN users u ON u.id=e.user_id WHERE e.school_id=? AND u.role='student' AND e.created_at>=datetime('now','-7 days')",
    "attempts": "SELECT COUNT(*) AS attempts, AVG(CASE WHEN e.max_score>0 THEN e.score*100.0/e.max_score END) AS accuracy FROM learning_events e JOIN users u ON u.id=e.user_id WHERE e.school_id=? AND u.role='student' AND e.event_type='quiz_attempt' AND e.created_at>=datetime('now','-30 days')",
    "topics": "SELECT e.topic_id AS topic,COUNT(*) AS attempts,AVG(CASE WHEN e.max_score>0 THEN e.score*100.0/e.max_score END) AS accuracy FROM learning_events e JOIN users u ON u.id=e.user_id WHERE e.school_id=? AND u.role='student' AND e.event_type='quiz_attempt' AND e.topic_id<>'' AND e.created_at>=datetime('now','-30 days') GROUP BY e.topic_id ORDER BY accuracy ASC LIMIT 8",
    "activity": "SELECT e.event_type AS type,COUNT(*) AS count FROM learning_events e JOIN users u ON u.id=e.user_id WHERE e.school_id=? AND u.role='student' AND e.created_at>=datetime('now','-7 days') GROUP BY e.event_type ORDER BY count DESC",
    "cohorts": "SELECT e.grade,e.track,COUNT(DISTINCT e.user_id) AS learners,COUNT(*) AS events,SUM(CASE WHEN e.event_type='quiz_attempt' THEN 1 ELSE 0 END) AS quizAttempts,AVG(CASE WHEN e.event_type='quiz_attempt' AND e.max_score>0 THEN e.score*100.0/e.max_score END) AS accuracy FROM learning_events e JOIN users u ON u.id=e.user_id WHERE e.school_id=? AND u.role='student' AND e.created_at>=datetime('now','-30 days') GROUP BY e.grade,e.track ORDER BY e.grade,e.track",
}
for name, query in queries.items():
    DB.execute(query, ("school-1",)).fetchall()

required = {row[0] for row in DB.execute("SELECT name FROM sqlite_master WHERE type='table'")}
for table in ("schools", "users", "sessions", "learning_events", "portfolios", "portfolio_media", "api_rate_limits", "audit_log", "platform_settings", "prompt_versions", "scientific_sources", "scientific_datasets", "scientific_model_cards", "feature_flag_settings", "bootstrap_guard"):
    if table not in required:
        raise SystemExit(f"Missing table: {table}")

print("Chemistry Atlas schema validation: PASS")
# Exercise the new version-control schema, including the one-active-version-per-prompt write pattern.
DB.execute("INSERT INTO platform_settings(school_id,setting_key,setting_value,updated_by,updated_at) VALUES ('school-1','platform_version','v4','teacher-1',datetime('now'))")
DB.execute("INSERT INTO prompt_versions(id,school_id,prompt_key,version_major,version_minor,title,prompt_text,change_note,is_active,created_by,created_at) VALUES ('p1','school-1','CHEM-ATLAS-3D-PLATFORM',1,0,'Baseline','Initial test prompt','seed',1,'teacher-1',datetime('now'))")
DB.execute("UPDATE prompt_versions SET is_active=0 WHERE school_id='school-1' AND prompt_key='CHEM-ATLAS-3D-PLATFORM'")
DB.execute("INSERT INTO prompt_versions(id,school_id,prompt_key,version_major,version_minor,title,prompt_text,change_note,is_active,created_by,created_at) VALUES ('p2','school-1','CHEM-ATLAS-3D-PLATFORM',1,1,'Revision','Updated test prompt','revision',1,'teacher-1',datetime('now'))")
assert DB.execute("SELECT COUNT(*) FROM prompt_versions WHERE school_id='school-1' AND prompt_key='CHEM-ATLAS-3D-PLATFORM' AND is_active=1").fetchone()[0] == 1
assert DB.execute("SELECT setting_value FROM platform_settings WHERE school_id='school-1' AND setting_key='platform_version'").fetchone()[0] == 'v4'
DB.execute("INSERT INTO feature_flag_settings(school_id,feature_id,is_enabled,updated_by,updated_at) VALUES('school-1','molecular-studio',1,'teacher-1',datetime('now'))")
assert DB.execute("SELECT is_enabled FROM feature_flag_settings WHERE school_id='school-1' AND feature_id='molecular-studio'").fetchone()[0] == 1
DB.execute("INSERT INTO scientific_sources(id,name,canonical_url,licence_label,reuse_class,created_at) VALUES ('cod','COD','https://cod.psdi.ac.uk/','CC0-1.0','open-data',datetime('now'))")
DB.execute("INSERT INTO scientific_datasets(id,source_id,dataset_version,retrieved_at,sha256,file_format,licence_snapshot,created_at) VALUES ('cod-test','cod','snapshot-1',datetime('now'),'0123456789abcdef','cif','CC0-1.0',datetime('now'))")
DB.execute("INSERT INTO scientific_model_cards(id,model_key,model_version,model_origin,method,created_at) VALUES ('model-test','benzene','1','computed','3D conformer from pinned source',datetime('now'))")
print(f"Migrations: {len(migrations)} applied; teacher analytics SQL: 7/7; version-control, scientific provenance and atomic bootstrap checks: PASS")
