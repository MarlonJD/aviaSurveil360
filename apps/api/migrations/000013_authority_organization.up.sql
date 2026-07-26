INSERT INTO organizations (
    id,
    legal_name,
    organization_type,
    status
) VALUES (
    'CAA',
    'Civil Aviation Authority',
    'AUTHORITY',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM organizations
        WHERE id = 'CAA'
          AND legal_name = 'Civil Aviation Authority'
          AND organization_type = 'AUTHORITY'
          AND status = 'ACTIVE'
          AND tombstoned_at IS NULL
    ) THEN
        RAISE EXCEPTION 'retained CAA authority organization conflicts with the required platform authority';
    END IF;
END
$$;
