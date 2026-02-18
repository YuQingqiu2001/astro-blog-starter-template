-- Allow one email/user to have multiple roles

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('author', 'editor', 'reviewer')),
  journal_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, role),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (journal_id) REFERENCES journals(id)
);

INSERT OR IGNORE INTO user_roles (user_id, email, role, journal_id)
SELECT id, email, role, journal_id FROM users;

CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
