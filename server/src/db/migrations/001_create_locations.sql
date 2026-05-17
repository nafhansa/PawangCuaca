CREATE TABLE locations (
    id            SERIAL PRIMARY KEY,
    geohash       VARCHAR(12) NOT NULL UNIQUE,
    lat           DECIMAL(9,6) NOT NULL,
    lon           DECIMAL(9,6) NOT NULL,
    label         VARCHAR(255),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_locations_geohash ON locations(geohash);
