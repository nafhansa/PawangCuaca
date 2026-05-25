CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'konsumen'
                        CHECK (role IN ('superadmin', 'produsen', 'konsumen')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    pawang_level    VARCHAR(20) NOT NULL DEFAULT 'pemula'
                        CHECK (pawang_level IN ('pemula', 'andal', 'elite', 'legenda')),
    report_count    INTEGER NOT NULL DEFAULT 0,
    accuracy_score  DECIMAL(5,2) DEFAULT 0,
    avatar_url      VARCHAR(500),
    bio             TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_pawang_level ON users(pawang_level);
