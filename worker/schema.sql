-- D1 Schema für Typo Leaderboard
CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index für schnellere Queries
CREATE INDEX IF NOT EXISTS idx_score ON scores(score DESC);
