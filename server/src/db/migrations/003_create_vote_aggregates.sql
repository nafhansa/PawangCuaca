CREATE TABLE vote_aggregates (
    id              SERIAL PRIMARY KEY,
    location_id     INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    forecast_hour   TIMESTAMPTZ NOT NULL,
    upvotes         INTEGER DEFAULT 0,
    downvotes       INTEGER DEFAULT 0,
    accuracy_pct    DECIMAL(5,2) GENERATED ALWAYS AS (
                        CASE
                            WHEN (upvotes + downvotes) = 0 THEN NULL
                            ELSE ROUND((upvotes::DECIMAL / (upvotes + downvotes)) * 100, 2)
                        END
                    ) STORED,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(location_id, forecast_hour)
);

CREATE INDEX idx_agg_location_hour ON vote_aggregates(location_id, forecast_hour);
