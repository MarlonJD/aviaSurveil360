CREATE TABLE IF NOT EXISTS checklist_responses (
    id text PRIMARY KEY,
    inspection_id text NOT NULL REFERENCES inspections(id),
    package_id text NOT NULL REFERENCES inspection_packages(id),
    question_id text NOT NULL,
    assigned_inspector_subject_id text REFERENCES identity_references(subject_id),
    response_value text NOT NULL,
    comment_to_auditee text,
    internal_caa_note text,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (inspection_id, question_id)
);

CREATE TABLE IF NOT EXISTS potential_findings (
    id text PRIMARY KEY,
    inspection_id text NOT NULL REFERENCES inspections(id),
    checklist_response_id text NOT NULL REFERENCES checklist_responses(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    status text NOT NULL,
    finding_basis text NOT NULL,
    expected_evidence text,
    comment_to_auditee text NOT NULL,
    internal_caa_note text,
    converted_finding_id text,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS findings (
    id text PRIMARY KEY,
    reference text NOT NULL UNIQUE,
    potential_finding_id text UNIQUE REFERENCES potential_findings(id),
    inspection_id text NOT NULL REFERENCES inspections(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    severity text NOT NULL,
    status text NOT NULL,
    owner_subject_id text,
    next_action text NOT NULL,
    due_date date,
    closure_basis text,
    closure_reason text,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS findings_organization_idx ON findings (organization_id, status);

CREATE TABLE IF NOT EXISTS cap_revisions (
    id text PRIMARY KEY,
    cap_id text NOT NULL,
    finding_id text NOT NULL REFERENCES findings(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    revision integer NOT NULL CHECK (revision > 0),
    status text NOT NULL,
    root_cause text NOT NULL,
    corrective_action text NOT NULL,
    preventive_action text NOT NULL,
    target_completion_date date NOT NULL,
    submitted_by_subject_id text NOT NULL,
    submitted_at timestamptz NOT NULL,
    UNIQUE (cap_id, revision)
);

CREATE TABLE IF NOT EXISTS evidence_versions (
    id text PRIMARY KEY,
    evidence_id text NOT NULL,
    finding_id text NOT NULL REFERENCES findings(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    version integer NOT NULL CHECK (version > 0),
    object_metadata_id text,
    filename text NOT NULL,
    media_type text NOT NULL,
    sha256 text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    status text NOT NULL,
    submitted_by_subject_id text NOT NULL,
    submitted_at timestamptz NOT NULL,
    UNIQUE (evidence_id, version)
);

CREATE TABLE IF NOT EXISTS review_decisions (
    id text PRIMARY KEY,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    expected_revision bigint NOT NULL,
    decision text NOT NULL,
    reason text,
    decided_by_subject_id text NOT NULL,
    decided_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS report_versions (
    id text PRIMARY KEY,
    report_id text NOT NULL,
    inspection_id text NOT NULL REFERENCES inspections(id),
    version integer NOT NULL CHECK (version > 0),
    status text NOT NULL,
    snapshot jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (report_id, version)
);

CREATE TABLE IF NOT EXISTS report_decisions (
    id text PRIMARY KEY,
    report_version_id text NOT NULL REFERENCES report_versions(id),
    expected_version integer NOT NULL,
    decision text NOT NULL,
    reason text,
    decided_by_subject_id text NOT NULL,
    decided_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS offline_grants (
    id text PRIMARY KEY,
    subject_id text NOT NULL REFERENCES identity_references(subject_id),
    device_id text NOT NULL,
    package_id text NOT NULL REFERENCES inspection_packages(id),
    inspection_id text NOT NULL REFERENCES inspections(id),
    assignment_revision bigint NOT NULL,
    granted_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    revoke_reason text,
    UNIQUE (subject_id, device_id, package_id)
);

CREATE TABLE IF NOT EXISTS idempotency_responses (
    scope text NOT NULL,
    operation_id text NOT NULL,
    semantic_hash text NOT NULL,
    response_status integer NOT NULL,
    response_headers jsonb NOT NULL DEFAULT '{}'::jsonb,
    response_body jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (scope, operation_id)
);

CREATE TABLE IF NOT EXISTS authorized_sync_changes (
    sequence_id bigserial PRIMARY KEY,
    subject_id text NOT NULL,
    organization_id text,
    package_id text,
    kind text NOT NULL,
    entity_id text NOT NULL,
    entity_revision bigint,
    payload jsonb NOT NULL,
    changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sync_changes_subject_cursor_idx ON authorized_sync_changes (subject_id, sequence_id);

CREATE TABLE IF NOT EXISTS sync_cursors (
    subject_id text NOT NULL,
    device_id text NOT NULL,
    cursor_sequence bigint NOT NULL DEFAULT 0,
    projection_version integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (subject_id, device_id)
);

CREATE TABLE IF NOT EXISTS object_metadata (
    id text PRIMARY KEY,
    aggregate_type text NOT NULL,
    aggregate_id text NOT NULL,
    object_key text NOT NULL UNIQUE,
    filename text NOT NULL,
    declared_media_type text NOT NULL,
    detected_media_type text,
    sha256 text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    scan_status text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE evidence_versions
    ADD CONSTRAINT evidence_versions_object_metadata_fk
    FOREIGN KEY (object_metadata_id) REFERENCES object_metadata(id);

CREATE TABLE IF NOT EXISTS audit_events (
    sequence_id bigserial PRIMARY KEY,
    event_id text NOT NULL UNIQUE,
    occurred_at timestamptz NOT NULL,
    actor_subject_id text,
    actor_role text,
    organization_id text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    request_id text,
    details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events (entity_type, entity_id, sequence_id);

CREATE TABLE IF NOT EXISTS outbox_messages (
    id text PRIMARY KEY,
    topic text NOT NULL,
    aggregate_type text NOT NULL,
    aggregate_id text NOT NULL,
    payload jsonb NOT NULL,
    available_at timestamptz NOT NULL DEFAULT now(),
    claimed_at timestamptz,
    delivered_at timestamptz,
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outbox_pending_idx ON outbox_messages (available_at, created_at) WHERE delivered_at IS NULL;
