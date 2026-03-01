-- Migration: Add company settings and job deadline

-- Company settings (single row)
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Company',
  mission TEXT,
  benefits TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO company_settings (company_name) VALUES ('Company')
ON CONFLICT DO NOTHING;

-- Add deadline to challenges
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- Add email to submissions
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS candidate_email TEXT;
