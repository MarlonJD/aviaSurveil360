ALTER TABLE report_versions
    DROP CONSTRAINT IF EXISTS report_versions_version_check;

ALTER TABLE report_versions
    ADD CONSTRAINT report_versions_version_check CHECK (version >= 0);
