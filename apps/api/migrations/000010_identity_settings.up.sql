ALTER TABLE identity_references
    ADD COLUMN revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    ADD COLUMN tombstoned_at timestamptz;

ALTER TABLE organizations
    ADD COLUMN tombstoned_at timestamptz;

ALTER TABLE inspections
    ADD COLUMN tombstoned_at timestamptz;

ALTER TABLE surveillance_plan_items
    ADD COLUMN tombstoned_at timestamptz;

ALTER TABLE findings
    ADD COLUMN tombstoned_at timestamptz;

CREATE TABLE user_profiles (
    subject_id text PRIMARY KEY REFERENCES identity_references(subject_id),
    display_name text NOT NULL,
    organization_id text REFERENCES organizations(id),
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    tombstoned_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX user_profiles_org_display_name_idx
    ON user_profiles (organization_id, display_name, subject_id)
    WHERE tombstoned_at IS NULL;

CREATE TABLE user_settings (
    subject_id text PRIMARY KEY REFERENCES identity_references(subject_id),
    notification_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
    locale text NOT NULL DEFAULT 'en',
    timezone text NOT NULL DEFAULT 'UTC',
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_references_subject_active_idx
    ON session_references (subject_id, expires_at DESC, id)
    WHERE revoked_at IS NULL;

INSERT INTO user_profiles (
    subject_id, display_name, organization_id, revision, created_at, updated_at
)
SELECT identity.subject_id,
       identity.display_name,
       latest_session.organization_id,
       1,
       identity.created_at,
       identity.created_at
FROM identity_references identity
LEFT JOIN LATERAL (
    SELECT session.organization_id
    FROM session_references session
    WHERE session.subject_id = identity.subject_id
      AND session.organization_id IS NOT NULL
    ORDER BY session.created_at DESC, session.id DESC
    LIMIT 1
) latest_session ON true
WHERE identity.tombstoned_at IS NULL
ON CONFLICT (subject_id) DO NOTHING;

INSERT INTO user_settings (
    subject_id, notification_preferences, locale, timezone, revision, updated_at
)
SELECT identity.subject_id, '{}'::jsonb, 'en', 'UTC', 1, identity.created_at
FROM identity_references identity
WHERE identity.tombstoned_at IS NULL
ON CONFLICT (subject_id) DO NOTHING;
