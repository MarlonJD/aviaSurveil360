ALTER TABLE identity_references
    ADD COLUMN email text;

CREATE UNIQUE INDEX identity_references_active_email_idx
    ON identity_references (lower(email))
    WHERE email IS NOT NULL AND tombstoned_at IS NULL;

ALTER TABLE notification_delivery_jobs
    DROP CONSTRAINT notification_delivery_jobs_status_check;

ALTER TABLE notification_delivery_jobs
    ADD COLUMN provider_message_id text,
    ADD COLUMN accepted_at timestamptz,
    ADD COLUMN next_attempt_at timestamptz,
    ADD COLUMN terminal_at timestamptz,
    ADD CONSTRAINT notification_delivery_jobs_status_check
        CHECK (status IN ('PENDING', 'DELIVERED', 'FAILED', 'DEAD_LETTER'));

UPDATE notification_delivery_jobs
SET next_attempt_at = updated_at
WHERE status = 'FAILED' AND next_attempt_at IS NULL;

ALTER TABLE notification_delivery_jobs
    ADD CONSTRAINT notification_delivery_jobs_state_check CHECK (
        (
            status = 'PENDING'
            AND accepted_at IS NULL
            AND terminal_at IS NULL
        )
        OR (
            status = 'FAILED'
            AND accepted_at IS NULL
            AND next_attempt_at IS NOT NULL
            AND terminal_at IS NULL
        )
        OR (
            status = 'DELIVERED'
            AND provider_message_id IS NOT NULL
            AND accepted_at IS NOT NULL
            AND next_attempt_at IS NULL
            AND terminal_at IS NULL
        )
        OR (
            status = 'DEAD_LETTER'
            AND accepted_at IS NULL
            AND next_attempt_at IS NULL
            AND terminal_at IS NOT NULL
        )
    );

DROP INDEX notification_delivery_jobs_claimable_idx;

CREATE INDEX notification_delivery_jobs_claimable_idx
    ON notification_delivery_jobs (
        COALESCE(next_attempt_at, created_at),
        created_at,
        id
    )
    WHERE status IN ('PENDING', 'FAILED');
