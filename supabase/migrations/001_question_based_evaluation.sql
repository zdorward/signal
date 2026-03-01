-- Migration: Convert from rubric-based to question-based evaluation
-- This is a breaking change - existing data will need manual cleanup

-- Step 1: Add new columns to challenges
ALTER TABLE challenges
ADD COLUMN challenge_requirements TEXT,
ADD COLUMN intro_text TEXT,
ADD COLUMN questions_json JSONB;

-- Step 2: Add new columns to submissions
ALTER TABLE submissions
ADD COLUMN answers_json JSONB;

-- Step 3: Add new columns to evaluations
ALTER TABLE evaluations
ADD COLUMN criterion_scores_json JSONB,
ADD COLUMN url_passed BOOLEAN,
ADD COLUMN url_notes TEXT;

-- Note: After verifying the migration works, run these to clean up:
-- ALTER TABLE challenges DROP COLUMN challenge_text, DROP COLUMN rubric_json;
-- ALTER TABLE submissions DROP COLUMN written_explanation;
-- ALTER TABLE evaluations DROP COLUMN rubric_scores_json;
