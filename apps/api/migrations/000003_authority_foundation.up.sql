ALTER TABLE session_references
    ADD COLUMN IF NOT EXISTS session_token_hash text,
    ADD COLUMN IF NOT EXISTS csrf_token_hash text,
    ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
    ADD COLUMN IF NOT EXISTS absolute_expires_at timestamptz,
    ADD COLUMN IF NOT EXISTS roles text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS provider_tokens_ciphertext bytea;

CREATE UNIQUE INDEX IF NOT EXISTS session_references_token_hash_idx
    ON session_references (session_token_hash)
    WHERE session_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS oidc_login_states (
    state_hash text PRIMARY KEY,
    nonce text NOT NULL,
    pkce_verifier text NOT NULL,
    return_to text NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS inspection_question_assignments (
    inspection_id text NOT NULL REFERENCES inspections(id),
    question_id text NOT NULL,
    subject_id text NOT NULL REFERENCES identity_references(subject_id),
    assignment_revision bigint NOT NULL CHECK (assignment_revision > 0),
    PRIMARY KEY (inspection_id, question_id, subject_id)
);

CREATE TABLE IF NOT EXISTS inspection_checklists (
    inspection_id text PRIMARY KEY REFERENCES inspections(id),
    status text NOT NULL,
    revision bigint NOT NULL CHECK (revision > 0),
    submitted_at timestamptz,
    reopened_at timestamptz,
    reopen_reason text
);

ALTER TABLE potential_findings
    ADD COLUMN IF NOT EXISTS question_id text,
    ADD COLUMN IF NOT EXISTS title text,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS created_by_subject_id text REFERENCES identity_references(subject_id);

UPDATE potential_findings potential
SET question_id = response.question_id,
    title = potential.finding_basis,
    description = potential.finding_basis,
    created_by_subject_id = response.assigned_inspector_subject_id
FROM checklist_responses response
WHERE response.id = potential.checklist_response_id
  AND (potential.question_id IS NULL OR potential.title IS NULL OR potential.description IS NULL OR potential.created_by_subject_id IS NULL);

ALTER TABLE potential_findings
    ALTER COLUMN question_id SET NOT NULL,
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN created_by_subject_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS potential_findings_checklist_response_idx
    ON potential_findings (checklist_response_id);

ALTER TABLE cap_revisions
    ADD COLUMN IF NOT EXISTS responsible_person text,
    ADD COLUMN IF NOT EXISTS comment_to_caa text;

ALTER TABLE inspection_packages ADD COLUMN IF NOT EXISTS package_digest text;
UPDATE inspection_packages
SET package_digest = 'sha256:legacy:' || id
WHERE package_digest IS NULL;
ALTER TABLE inspection_packages ALTER COLUMN package_digest SET NOT NULL;

ALTER TABLE evidence_versions
    ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0);

ALTER TABLE review_decisions
    ADD COLUMN IF NOT EXISTS comment_to_auditee text,
    ADD COLUMN IF NOT EXISTS internal_caa_note text;

ALTER TABLE offline_grants
    ADD COLUMN IF NOT EXISTS session_id text REFERENCES session_references(id),
    ADD COLUMN IF NOT EXISTS package_version integer,
    ADD COLUMN IF NOT EXISTS package_digest text,
    ADD COLUMN IF NOT EXISTS allowed_command_types text[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS assignment_scope jsonb NOT NULL DEFAULT '{"questionIds":[]}'::jsonb,
    ADD COLUMN IF NOT EXISTS protocol_version integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS grant_token_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS offline_grants_token_hash_idx
    ON offline_grants (grant_token_hash)
    WHERE grant_token_hash IS NOT NULL;

ALTER TABLE audit_events
    ADD COLUMN IF NOT EXISTS entity_version bigint,
    ADD COLUMN IF NOT EXISTS before_status text,
    ADD COLUMN IF NOT EXISTS after_status text,
    ADD COLUMN IF NOT EXISTS reason text,
    ADD COLUMN IF NOT EXISTS operation_id text,
    ADD COLUMN IF NOT EXISTS correlation_id text,
    ADD COLUMN IF NOT EXISTS closure_basis text;

CREATE UNIQUE INDEX IF NOT EXISTS audit_events_successful_operation_idx
    ON audit_events (operation_id, action)
    WHERE operation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS report_approval_states (
    report_version_id text PRIMARY KEY REFERENCES report_versions(id),
    status text NOT NULL,
    revision bigint NOT NULL CHECK (revision > 0),
    issued_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE SEQUENCE IF NOT EXISTS finding_public_number_sequence START WITH 1;

CREATE OR REPLACE FUNCTION reject_immutable_row_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION '% rows are immutable', TG_TABLE_NAME USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS checklist_template_versions_immutable ON checklist_template_versions;
CREATE TRIGGER checklist_template_versions_immutable
BEFORE UPDATE OR DELETE ON checklist_template_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS cap_revisions_immutable ON cap_revisions;
CREATE TRIGGER cap_revisions_immutable
BEFORE UPDATE OR DELETE ON cap_revisions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS evidence_versions_immutable ON evidence_versions;
CREATE TRIGGER evidence_versions_immutable
BEFORE UPDATE OR DELETE ON evidence_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS review_decisions_immutable ON review_decisions;
CREATE TRIGGER review_decisions_immutable
BEFORE UPDATE OR DELETE ON review_decisions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS audit_events_append_only ON audit_events;
CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

DROP TRIGGER IF EXISTS report_versions_immutable ON report_versions;
CREATE TRIGGER report_versions_immutable
BEFORE UPDATE OR DELETE ON report_versions
FOR EACH ROW EXECUTE FUNCTION reject_immutable_row_change();

CREATE OR REPLACE FUNCTION preserve_inspection_package_snapshot() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.inspection_id IS DISTINCT FROM OLD.inspection_id
       OR NEW.checklist_template_version_id IS DISTINCT FROM OLD.checklist_template_version_id
       OR NEW.package_version IS DISTINCT FROM OLD.package_version
       OR NEW.snapshot IS DISTINCT FROM OLD.snapshot
       OR NEW.package_digest IS DISTINCT FROM OLD.package_digest THEN
        RAISE EXCEPTION 'inspection package snapshots are immutable' USING ERRCODE = '55000';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inspection_package_snapshot_immutable ON inspection_packages;
CREATE TRIGGER inspection_package_snapshot_immutable
BEFORE UPDATE ON inspection_packages
FOR EACH ROW EXECUTE FUNCTION preserve_inspection_package_snapshot();
