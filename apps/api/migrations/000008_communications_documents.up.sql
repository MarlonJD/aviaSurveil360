CREATE TABLE communication_threads (
    id text PRIMARY KEY,
    organization_id text REFERENCES organizations(id),
    visibility text NOT NULL CHECK (visibility IN ('AUDITEE_VISIBLE', 'INTERNAL_CAA')),
    subject text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
        (visibility = 'AUDITEE_VISIBLE' AND organization_id IS NOT NULL)
        OR visibility = 'INTERNAL_CAA'
    )
);

CREATE INDEX communication_threads_org_visibility_updated_idx
    ON communication_threads (organization_id, visibility, updated_at DESC, id)
    WHERE tombstoned_at IS NULL;

CREATE TABLE communication_messages (
    id text PRIMARY KEY,
    thread_id text NOT NULL REFERENCES communication_threads(id),
    organization_id text REFERENCES organizations(id),
    visibility text NOT NULL CHECK (visibility IN ('AUDITEE_VISIBLE', 'INTERNAL_CAA')),
    sender_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    audience text NOT NULL CHECK (audience IN ('CAA', 'AUDITEE')),
    direction text NOT NULL CHECK (
        direction IN ('CAA_TO_AUDITEE', 'AUDITEE_TO_CAA', 'CAA_INTERNAL')
    ),
    subject text NOT NULL,
    body text NOT NULL,
    idempotency_key text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (sender_subject_id, idempotency_key),
    CHECK (
        (
            visibility = 'AUDITEE_VISIBLE'
            AND organization_id IS NOT NULL
            AND direction IN ('CAA_TO_AUDITEE', 'AUDITEE_TO_CAA')
        )
        OR (
            visibility = 'INTERNAL_CAA'
            AND direction = 'CAA_INTERNAL'
            AND audience = 'CAA'
        )
    )
);

CREATE INDEX communication_messages_org_visibility_created_idx
    ON communication_messages (
        organization_id,
        visibility,
        created_at DESC,
        id DESC
    );

CREATE TABLE communication_attachments (
    id text PRIMARY KEY,
    message_id text NOT NULL REFERENCES communication_messages(id),
    organization_id text REFERENCES organizations(id),
    object_metadata_id text NOT NULL REFERENCES object_metadata(id),
    file_name text NOT NULL,
    media_type text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    sha256 text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX communication_attachments_message_idx
    ON communication_attachments (message_id, id);

CREATE UNIQUE INDEX communication_attachments_object_metadata_uidx
    ON communication_attachments (object_metadata_id);

CREATE TABLE document_records (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES organizations(id),
    kind text NOT NULL CHECK (kind IN ('REPORT', 'EVIDENCE', 'CHECKLIST_TEMPLATE')),
    title text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX document_records_org_kind_idx
    ON document_records (organization_id, kind, updated_at DESC, id)
    WHERE tombstoned_at IS NULL;

CREATE TABLE document_versions (
    id text PRIMARY KEY,
    document_id text NOT NULL REFERENCES document_records(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    version integer NOT NULL CHECK (version > 0),
    visibility text NOT NULL CHECK (visibility IN ('AUDITEE_VISIBLE', 'CAA_ONLY')),
    status text NOT NULL,
    file_name text NOT NULL,
    media_type text NOT NULL,
    sha256 text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    object_metadata_id text REFERENCES object_metadata(id),
    created_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (document_id, version)
);

CREATE INDEX document_versions_org_visibility_created_idx
    ON document_versions (
        organization_id,
        visibility,
        created_at DESC,
        id DESC
    );

CREATE TABLE document_render_jobs (
    id text PRIMARY KEY,
    document_id text NOT NULL REFERENCES document_records(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    requested_version integer NOT NULL CHECK (requested_version > 0),
    status text NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
    idempotency_key text NOT NULL UNIQUE,
    input_snapshot jsonb NOT NULL,
    output_document_version_id text REFERENCES document_versions(id),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX document_render_jobs_claimable_idx
    ON document_render_jobs (created_at, id)
    WHERE status IN ('PENDING', 'FAILED');

DROP TRIGGER IF EXISTS communication_messages_immutable ON communication_messages;
CREATE TRIGGER communication_messages_immutable
BEFORE UPDATE OR DELETE ON communication_messages
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS communication_attachments_immutable ON communication_attachments;
CREATE TRIGGER communication_attachments_immutable
BEFORE UPDATE OR DELETE ON communication_attachments
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS document_versions_immutable ON document_versions;
CREATE TRIGGER document_versions_immutable
BEFORE UPDATE OR DELETE ON document_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();
