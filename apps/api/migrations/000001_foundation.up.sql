CREATE TABLE IF NOT EXISTS identity_references (
    subject_id text PRIMARY KEY,
    issuer text NOT NULL,
    display_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
    id text PRIMARY KEY,
    legal_name text NOT NULL,
    organization_type text NOT NULL,
    status text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_references (
    id text PRIMARY KEY,
    subject_id text NOT NULL REFERENCES identity_references(subject_id),
    organization_id text REFERENCES organizations(id),
    provider_session_id text,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspections (
    id text PRIMARY KEY,
    organization_id text NOT NULL REFERENCES organizations(id),
    assigned_inspector_subject_id text REFERENCES identity_references(subject_id),
    title text NOT NULL,
    inspection_type text NOT NULL,
    status text NOT NULL,
    due_date date,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inspections_organization_idx ON inspections (organization_id, status);
CREATE INDEX IF NOT EXISTS inspections_assignee_idx ON inspections (assigned_inspector_subject_id, status);

CREATE TABLE IF NOT EXISTS checklist_template_versions (
    id text PRIMARY KEY,
    template_id text NOT NULL,
    version integer NOT NULL CHECK (version > 0),
    title text NOT NULL,
    snapshot jsonb NOT NULL,
    published_at timestamptz NOT NULL,
    UNIQUE (template_id, version)
);

CREATE TABLE IF NOT EXISTS inspection_packages (
    id text PRIMARY KEY,
    inspection_id text NOT NULL REFERENCES inspections(id),
    checklist_template_version_id text NOT NULL REFERENCES checklist_template_versions(id),
    package_version integer NOT NULL CHECK (package_version > 0),
    snapshot jsonb NOT NULL,
    expires_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (inspection_id, package_version)
);
