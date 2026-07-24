CREATE TABLE planning_intake_drafts (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES organizations(id),
    values jsonb NOT NULL,
    submitted_planning_item_id text REFERENCES surveillance_plan_items(id),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX planning_intake_drafts_org_updated_idx
    ON planning_intake_drafts (organization_id, updated_at DESC, id)
    WHERE tombstoned_at IS NULL;

CREATE TABLE inspection_package_drafts (
    id text PRIMARY KEY,
    source_inspection_id text NOT NULL REFERENCES inspections(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    status text NOT NULL CHECK (status = 'DRAFT'),
    package_version integer NOT NULL CHECK (package_version > 0),
    risk_focus jsonb NOT NULL DEFAULT '[]'::jsonb,
    question_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_by_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_inspection_id, package_version)
);

CREATE INDEX inspection_package_drafts_org_updated_idx
    ON inspection_package_drafts (organization_id, updated_at DESC, id)
    WHERE tombstoned_at IS NULL;

CREATE TABLE audit_assignments (
    id text PRIMARY KEY,
    inspection_id text NOT NULL UNIQUE REFERENCES inspections(id),
    organization_id text NOT NULL REFERENCES organizations(id),
    lead_subject_id text NOT NULL REFERENCES identity_references(subject_id),
    status text NOT NULL,
    scheduled_start_date date,
    scheduled_end_date date,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_assignments_org_status_idx
    ON audit_assignments (
        organization_id,
        status,
        scheduled_start_date,
        id
    )
    WHERE tombstoned_at IS NULL;

CREATE INDEX audit_assignments_lead_status_idx
    ON audit_assignments (lead_subject_id, status, scheduled_start_date, id)
    WHERE tombstoned_at IS NULL;

CREATE TABLE audit_team_members (
    assignment_id text NOT NULL REFERENCES audit_assignments(id),
    subject_id text NOT NULL REFERENCES identity_references(subject_id),
    member_role text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    removed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (assignment_id, subject_id)
);

CREATE INDEX audit_team_members_subject_idx
    ON audit_team_members (subject_id, assignment_id)
    WHERE removed_at IS NULL;

CREATE TABLE audit_question_assignments (
    assignment_id text NOT NULL,
    question_id text NOT NULL,
    subject_id text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (assignment_id, question_id, subject_id),
    FOREIGN KEY (assignment_id, subject_id)
        REFERENCES audit_team_members(assignment_id, subject_id)
);

CREATE INDEX audit_question_assignments_subject_idx
    ON audit_question_assignments (subject_id, assignment_id, question_id);

ALTER TABLE authorized_sync_changes
    ADD COLUMN operation_id text,
    ADD COLUMN correlation_id text;

CREATE INDEX authorized_sync_changes_operation_idx
    ON authorized_sync_changes (operation_id, sequence_id)
    WHERE operation_id IS NOT NULL;

ALTER TABLE outbox_messages
    ADD COLUMN operation_id text,
    ADD COLUMN correlation_id text;

CREATE INDEX outbox_messages_operation_idx
    ON outbox_messages (operation_id, created_at, id)
    WHERE operation_id IS NOT NULL;

CREATE TABLE command_transaction_links (
    operation_id text NOT NULL,
    idempotency_scope text NOT NULL,
    audit_event_id text NOT NULL UNIQUE REFERENCES audit_events(event_id),
    change_sequence_id bigint NOT NULL UNIQUE REFERENCES authorized_sync_changes(sequence_id),
    outbox_message_id text NOT NULL UNIQUE REFERENCES outbox_messages(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (idempotency_scope, operation_id),
    FOREIGN KEY (idempotency_scope, operation_id)
        REFERENCES idempotency_responses(scope, operation_id)
);

DROP INDEX IF EXISTS audit_events_successful_operation_idx;
CREATE UNIQUE INDEX audit_events_scoped_successful_operation_idx
    ON audit_events (actor_subject_id, operation_id, action)
    WHERE operation_id IS NOT NULL;

DROP TRIGGER IF EXISTS report_decisions_immutable ON report_decisions;
CREATE TRIGGER report_decisions_immutable
BEFORE UPDATE OR DELETE ON report_decisions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();
