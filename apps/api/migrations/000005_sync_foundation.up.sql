ALTER TABLE inspection_attachments
    ADD COLUMN IF NOT EXISTS potential_finding_id text REFERENCES potential_findings(id);

CREATE TABLE IF NOT EXISTS sync_cursor_tokens (
    token text PRIMARY KEY,
    subject_id text NOT NULL REFERENCES identity_references(subject_id),
    organization_id text NOT NULL REFERENCES organizations(id),
    package_id text NOT NULL REFERENCES inspection_packages(id),
    grant_id text NOT NULL REFERENCES offline_grants(id),
    device_id text NOT NULL,
    projection_version integer NOT NULL CHECK (projection_version > 0),
    high_water_mark bigint NOT NULL CHECK (high_water_mark >= 0),
    issued_at timestamptz NOT NULL,
    UNIQUE (
        subject_id,
        organization_id,
        package_id,
        grant_id,
        device_id,
        projection_version,
        high_water_mark
    )
);

CREATE INDEX IF NOT EXISTS sync_cursor_tokens_scope_idx
    ON sync_cursor_tokens (subject_id, organization_id, package_id, grant_id, device_id);
