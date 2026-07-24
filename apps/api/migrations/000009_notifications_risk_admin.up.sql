CREATE TABLE notification_records (
    id text PRIMARY KEY,
    recipient_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    organization_id text REFERENCES organizations(id),
    title text NOT NULL,
    body text NOT NULL,
    related_entity_type text,
    related_entity_id text,
    deduplication_key text NOT NULL,
    read_at timestamptz,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (recipient_subject_id, deduplication_key)
);

CREATE INDEX notification_records_recipient_unread_idx
    ON notification_records (
        recipient_subject_id,
        created_at DESC,
        id DESC
    )
    WHERE read_at IS NULL AND tombstoned_at IS NULL;

CREATE INDEX notification_records_recipient_created_idx
    ON notification_records (
        recipient_subject_id,
        created_at DESC,
        id DESC
    )
    WHERE tombstoned_at IS NULL;

CREATE TABLE notification_delivery_jobs (
    id text PRIMARY KEY,
    notification_id text NOT NULL REFERENCES notification_records(id),
    recipient_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    channel text NOT NULL CHECK (channel IN ('IN_APP', 'EMAIL')),
    status text NOT NULL CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED')),
    idempotency_key text NOT NULL UNIQUE,
    outbox_message_id text REFERENCES outbox_messages(id),
    attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    last_error text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notification_delivery_jobs_claimable_idx
    ON notification_delivery_jobs (created_at, id)
    WHERE status IN ('PENDING', 'FAILED');

CREATE TABLE reminder_dispatches (
    id text PRIMARY KEY,
    reminder_rule_id text NOT NULL REFERENCES reminder_rules(id),
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    recipient_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    due_date date NOT NULL,
    due_state text NOT NULL,
    notification_id text NOT NULL REFERENCES notification_records(id),
    dispatched_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (
        reminder_rule_id,
        entity_type,
        entity_id,
        recipient_subject_id,
        due_date
    )
);

CREATE TABLE risk_projection_versions (
    id text PRIMARY KEY,
    projection_kind text NOT NULL,
    organization_id text REFERENCES organizations(id),
    version integer NOT NULL CHECK (version > 0),
    source text NOT NULL,
    snapshot jsonb NOT NULL,
    advisory_only boolean NOT NULL CHECK (advisory_only),
    calculated_at timestamptz NOT NULL,
    UNIQUE NULLS NOT DISTINCT (projection_kind, organization_id, version)
);

CREATE INDEX risk_projection_kind_org_calculated_idx
    ON risk_projection_versions (
        projection_kind,
        organization_id,
        calculated_at DESC,
        id DESC
    );

CREATE TABLE regulatory_reference_versions (
    id text PRIMARY KEY,
    reference_id text NOT NULL,
    version integer NOT NULL CHECK (version > 0),
    title text NOT NULL,
    status text NOT NULL CHECK (status IN ('ACTIVE', 'SUPERSEDED')),
    effective_date date NOT NULL,
    snapshot jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (reference_id, version)
);

CREATE INDEX regulatory_reference_versions_status_idx
    ON regulatory_reference_versions (status, effective_date DESC, reference_id, version DESC);

CREATE TABLE question_versions (
    id text PRIMARY KEY,
    question_id text NOT NULL,
    version integer NOT NULL CHECK (version > 0),
    prompt text NOT NULL,
    configured_reference text NOT NULL,
    expected_evidence text NOT NULL,
    created_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (question_id, version)
);

CREATE TABLE template_masters (
    id text PRIMARY KEY,
    title text NOT NULL,
    owner_role text NOT NULL,
    published_template_version_id text REFERENCES checklist_template_versions(id),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE template_draft_versions (
    id text PRIMARY KEY,
    template_id text NOT NULL REFERENCES template_masters(id),
    version integer NOT NULL CHECK (version > 0),
    status text NOT NULL CHECK (status = 'DRAFT'),
    owner_role text NOT NULL CHECK (owner_role = 'Admin Preview'),
    creator_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    change_reason text NOT NULL,
    question_version_ids text[] NOT NULL DEFAULT '{}',
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (template_id, version)
);

CREATE UNIQUE INDEX template_draft_versions_active_template_idx
    ON template_draft_versions (template_id)
    WHERE status = 'DRAFT';

CREATE TABLE template_version_questions (
    template_version_id text NOT NULL REFERENCES checklist_template_versions(id),
    question_version_id text NOT NULL REFERENCES question_versions(id),
    position integer NOT NULL CHECK (position >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (template_version_id, question_version_id),
    UNIQUE (template_version_id, position)
);

CREATE TABLE report_definition_versions (
    id text PRIMARY KEY,
    definition_id text NOT NULL,
    version integer NOT NULL CHECK (version > 0),
    title text NOT NULL,
    description text NOT NULL,
    definition jsonb NOT NULL,
    created_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (definition_id, version)
);

CREATE TABLE user_lifecycle_requests (
    id text PRIMARY KEY,
    subject_id text,
    requested_action text NOT NULL CHECK (
        requested_action IN ('PROVISION', 'UPDATE_ROLES', 'SUSPEND', 'REACTIVATE')
    ),
    requested_roles text[] NOT NULL DEFAULT '{}',
    requested_organization_id text REFERENCES organizations(id),
    status text NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
    idempotency_key text NOT NULL UNIQUE,
    requested_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    outbox_message_id text REFERENCES outbox_messages(id),
    failure_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_lifecycle_requests_status_created_idx
    ON user_lifecycle_requests (status, created_at, id);

DROP TRIGGER IF EXISTS risk_projection_versions_immutable ON risk_projection_versions;
CREATE TRIGGER risk_projection_versions_immutable
BEFORE UPDATE OR DELETE ON risk_projection_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS regulatory_reference_versions_immutable ON regulatory_reference_versions;
CREATE TRIGGER regulatory_reference_versions_immutable
BEFORE UPDATE OR DELETE ON regulatory_reference_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS question_versions_immutable ON question_versions;
CREATE TRIGGER question_versions_immutable
BEFORE UPDATE OR DELETE ON question_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS template_version_questions_immutable ON template_version_questions;
CREATE TRIGGER template_version_questions_immutable
BEFORE UPDATE OR DELETE ON template_version_questions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS report_definition_versions_immutable ON report_definition_versions;
CREATE TRIGGER report_definition_versions_immutable
BEFORE UPDATE OR DELETE ON report_definition_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();
