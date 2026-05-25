CREATE TABLE reports (
    id                SERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id       INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    thread_post_id    INTEGER REFERENCES thread_posts(id) ON DELETE SET NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    weather_condition VARCHAR(100),
    temperature       DECIMAL(5,2),
    media_url         VARCHAR(500),
    media_type        VARCHAR(20) CHECK (media_type IN ('image', 'video', 'gif')),
    media_size        INTEGER,
    upvotes           INTEGER NOT NULL DEFAULT 0,
    downvotes         INTEGER NOT NULL DEFAULT 0,
    accuracy_pct      DECIMAL(5,2),
    status            VARCHAR(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'archived')),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_location_id ON reports(location_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

CREATE TABLE report_votes (
    id          SERIAL PRIMARY KEY,
    report_id   INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type   VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_id, user_id)
);

CREATE INDEX idx_report_votes_report_id ON report_votes(report_id);
CREATE INDEX idx_report_votes_user_id ON report_votes(user_id);
