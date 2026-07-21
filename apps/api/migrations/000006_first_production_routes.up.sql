CREATE TABLE IF NOT EXISTS surveillance_plan_items (
    id text PRIMARY KEY,
    title text NOT NULL,
    plan_year integer NOT NULL CHECK (plan_year >= 2000),
    organization_id text NOT NULL REFERENCES organizations(id),
    inspection_type text NOT NULL,
    scheduled_date date NOT NULL,
    estimated_budget numeric(14, 2) NOT NULL CHECK (estimated_budget >= 0),
    status text NOT NULL,
    current_owner_role text NOT NULL,
    next_action text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS surveillance_plan_items_schedule_idx
    ON surveillance_plan_items (plan_year, scheduled_date, id);

CREATE TABLE IF NOT EXISTS reminder_rules (
    id text PRIMARY KEY,
    label text NOT NULL,
    offset_days integer NOT NULL,
    channel text NOT NULL,
    status text NOT NULL,
    revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reminder_rules_order_idx
    ON reminder_rules (offset_days DESC, id);
