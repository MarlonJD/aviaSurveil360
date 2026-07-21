-- avia-include: migrations/000001_foundation.up.sql
-- avia-include: migrations/000002_workflow_foundation.up.sql

CREATE TABLE schema_migrations (
    version bigint PRIMARY KEY,
    name text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO schema_migrations (version, name) VALUES
    (1, '000001_foundation.up.sql'),
    (2, '000002_workflow_foundation.up.sql');
