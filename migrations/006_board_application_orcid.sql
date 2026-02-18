ALTER TABLE board_applications ADD COLUMN orcid TEXT;

CREATE INDEX IF NOT EXISTS idx_board_applications_orcid ON board_applications(orcid);
