-- Signal App Database Schema
-- Run this in your Supabase SQL Editor

-- challenges: Job challenges created by employers
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_description TEXT NOT NULL,
  challenge_text TEXT NOT NULL,
  rubric_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- submissions: Candidate responses to challenges
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  demo_url TEXT NOT NULL,
  written_explanation TEXT NOT NULL,
  video_path TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- evaluations: AI evaluation results
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  rubric_scores_json JSONB NOT NULL,
  summary_bullets TEXT[] NOT NULL,
  worth_human_attention BOOLEAN NOT NULL,
  flag_reason TEXT,
  rejection_draft TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_submissions_challenge_id ON submissions(challenge_id);
CREATE INDEX idx_evaluations_submission_id ON evaluations(submission_id);
