ALTER TABLE document_versions
    ADD COLUMN renderer_hash text,
    ADD COLUMN template_hash text,
    ADD COLUMN source_hash text;

ALTER TABLE document_versions
    ADD CONSTRAINT document_versions_render_provenance_complete_check
    CHECK (
        (
            renderer_hash IS NULL
            AND template_hash IS NULL
            AND source_hash IS NULL
        )
        OR
        (
            renderer_hash ~ '^sha256:[0-9a-f]{64}$'
            AND template_hash ~ '^sha256:[0-9a-f]{64}$'
            AND source_hash ~ '^sha256:[0-9a-f]{64}$'
        )
    );
