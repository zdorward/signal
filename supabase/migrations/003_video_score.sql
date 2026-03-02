-- Migration: Add video score to evaluations

ALTER TABLE evaluations
ADD COLUMN IF NOT EXISTS video_score INTEGER,
ADD COLUMN IF NOT EXISTS video_notes TEXT;
