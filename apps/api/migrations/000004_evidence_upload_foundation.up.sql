ALTER TABLE object_metadata
    ADD COLUMN IF NOT EXISTS organization_id text REFERENCES organizations(id),
    ADD COLUMN IF NOT EXISTS bucket_name text,
    ADD COLUMN IF NOT EXISTS object_state text NOT NULL DEFAULT 'QUARANTINED',
    ADD COLUMN IF NOT EXISTS upload_id text;

ALTER TABLE findings
    ADD COLUMN IF NOT EXISTS cap_required boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS evidence_required boolean NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS issued_at timestamptz,
    ADD COLUMN IF NOT EXISTS closed_at timestamptz;

CREATE TABLE IF NOT EXISTS upload_sessions (
    id text PRIMARY KEY,
    upload_kind text NOT NULL CHECK (upload_kind IN ('EVIDENCE', 'INSPECTION_ATTACHMENT')),
    aggregate_id text NOT NULL,
    organization_id text NOT NULL REFERENCES organizations(id),
    initiated_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    bucket_name text NOT NULL,
    staging_object_key text NOT NULL UNIQUE,
    file_name text NOT NULL,
    declared_media_type text NOT NULL,
    declared_size_bytes bigint NOT NULL CHECK (declared_size_bytes >= 0),
    declared_sha256 text NOT NULL,
    expected_aggregate_revision bigint,
    upload_state text NOT NULL CHECK (upload_state IN ('PENDING', 'COMPLETED', 'EXPIRED')),
    expires_at timestamptz NOT NULL,
    object_metadata_id text REFERENCES object_metadata(id),
    created_at timestamptz NOT NULL,
    completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS upload_sessions_expiry_idx
    ON upload_sessions (expires_at)
    WHERE upload_state = 'PENDING';

ALTER TABLE object_metadata
    ADD CONSTRAINT object_metadata_upload_fk
    FOREIGN KEY (upload_id) REFERENCES upload_sessions(id);

CREATE TABLE IF NOT EXISTS evidence_version_states (
    evidence_version_id text PRIMARY KEY REFERENCES evidence_versions(id),
    upload_state text NOT NULL,
    scan_state text NOT NULL,
    review_state text NOT NULL,
    canonical_object_metadata_id text REFERENCES object_metadata(id),
    scan_reason text,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS inspection_attachments (
    id text PRIMARY KEY,
    inspection_id text NOT NULL REFERENCES inspections(id),
    package_id text NOT NULL REFERENCES inspection_packages(id),
    question_id text NOT NULL,
    checklist_response_id text REFERENCES checklist_responses(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    created_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    offline_grant_id text NOT NULL REFERENCES offline_grants(id),
    device_instance_id text NOT NULL,
    file_name text NOT NULL,
    declared_media_type text NOT NULL,
    declared_size_bytes bigint NOT NULL CHECK (declared_size_bytes >= 0),
    declared_sha256 text NOT NULL,
    object_metadata_id text REFERENCES object_metadata(id),
    upload_state text NOT NULL,
    scan_state text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE outbox_messages
    ADD COLUMN IF NOT EXISTS event_version integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS idempotency_key text,
    ADD COLUMN IF NOT EXISTS lease_owner text,
    ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
    ADD COLUMN IF NOT EXISTS terminal_state text;

CREATE UNIQUE INDEX IF NOT EXISTS outbox_messages_idempotency_key_idx
    ON outbox_messages (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS outbox_messages_claimable_idx
    ON outbox_messages (available_at, created_at)
    WHERE delivered_at IS NULL AND terminal_state IS NULL;
