CREATE TABLE threads (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id     INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    title           VARCHAR(255) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'archived')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_location_id ON threads(location_id);
CREATE INDEX idx_threads_status ON threads(status);
CREATE INDEX idx_threads_created_at ON threads(created_at DESC);

CREATE TABLE thread_posts (
    id                SERIAL PRIMARY KEY,
    thread_id         INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    media_url         VARCHAR(500),
    media_type        VARCHAR(20) CHECK (media_type IN ('image', 'video', 'gif')),
    media_size        INTEGER,
    weather_condition VARCHAR(100),
    temperature       DECIMAL(5,2),
    position          INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_thread_posts_thread_id ON thread_posts(thread_id);
CREATE INDEX idx_thread_posts_position ON thread_posts(thread_id, position);
