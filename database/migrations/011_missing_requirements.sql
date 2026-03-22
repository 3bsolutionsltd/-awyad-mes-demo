-- Migration: 011 - Missing Requirements
-- Implements: Data Lock, Unique Beneficiary ID, Geo-tagging, Evidence Uploads
-- Date: 2026-03-19

-- ============================================================
-- 1. DATA LOCK  (activities)
-- ============================================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS locked_by  UUID REFERENCES users(id);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS locked_at  TIMESTAMP;

-- ============================================================
-- 2. UNIQUE BENEFICIARY ID  (activities)
-- ============================================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS beneficiary_id VARCHAR(100);

-- ============================================================
-- 3. GEO-TAGGING  (activities)
-- ============================================================
ALTER TABLE activities ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10,8);
ALTER TABLE activities ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- ============================================================
-- 4. EVIDENCE / FILE UPLOADS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_evidence (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id      UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    file_name        VARCHAR(255) NOT NULL,
    original_name    VARCHAR(255) NOT NULL,
    file_path        TEXT NOT NULL,
    file_size        INTEGER NOT NULL,
    mime_type        VARCHAR(100),
    description      TEXT,
    uploaded_by      UUID REFERENCES users(id),
    uploaded_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_evidence_activity ON activity_evidence(activity_id);

-- ============================================================
-- 5. KOBO INTEGRATION  (incoming webhook payloads)
-- ============================================================
CREATE TABLE IF NOT EXISTS kobo_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id         VARCHAR(200) NOT NULL,
    submission_uuid VARCHAR(200) UNIQUE,
    payload         JSONB NOT NULL,
    mapped_to       UUID REFERENCES activities(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','mapped','rejected')),
    received_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at    TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kobo_form ON kobo_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_kobo_status ON kobo_submissions(status);
