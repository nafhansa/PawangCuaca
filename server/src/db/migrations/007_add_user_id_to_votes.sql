ALTER TABLE votes ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_votes_user_id ON votes(user_id);
