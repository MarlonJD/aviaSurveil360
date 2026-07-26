ALTER TABLE outbox_messages
    ADD COLUMN traceparent text
    CHECK (
        traceparent IS NULL
        OR traceparent ~ '^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$'
    );

CREATE OR REPLACE FUNCTION populate_outbox_trace_context()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.traceparent IS NULL THEN
        NEW.traceparent := NULLIF(
            current_setting('avia.traceparent', true),
            ''
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER outbox_trace_context
BEFORE INSERT ON outbox_messages
FOR EACH ROW EXECUTE FUNCTION populate_outbox_trace_context();
