CREATE TABLE votes (
    id              SERIAL PRIMARY KEY,
    location_id     INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    forecast_hour   TIMESTAMPTZ NOT NULL,
    vote_type       VARCHAR(10) NOT NULL
                        CHECK (vote_type IN ('upvote', 'downvote')),
    voter_hash      VARCHAR(64) NOT NULL,
    ip_hash         VARCHAR(64) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_votes_unique_voter
    ON votes(location_id, forecast_hour, voter_hash);

CREATE INDEX idx_votes_location_hour ON votes(location_id, forecast_hour);
CREATE INDEX idx_votes_created_at    ON votes(created_at);
