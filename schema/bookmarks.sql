-- Bookmark system tables
CREATE TABLE IF NOT EXISTS anon_tokens (
  anon_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anon_id TEXT NOT NULL REFERENCES anon_tokens(anon_id),
  article_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(anon_id, article_id)
);

CREATE TABLE IF NOT EXISTS recovery_codes (
  code TEXT PRIMARY KEY,
  anon_id TEXT NOT NULL REFERENCES anon_tokens(anon_id),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_anon ON bookmarks(anon_id);
CREATE INDEX IF NOT EXISTS idx_recovery_anon ON recovery_codes(anon_id);
