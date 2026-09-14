-- D1 Schema: Simple Reads

DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS bookmarks;

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  date INTEGER NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('A1','A2','B1','B2')),
  category TEXT NOT NULL CHECK(category IN ('daily-life', 'nature', 'people-culture', 'world', 'science', 'short-story')),
  reading_time INTEGER DEFAULT 3,
  author TEXT DEFAULT 'Simple Reads Editorial',
  cover TEXT,
  views INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  user_device_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(article_id, user_device_id)
);

CREATE INDEX idx_articles_date ON articles(date DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_level ON articles(level);
