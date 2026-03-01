// Question criterion for evaluation
export interface Criterion {
  id: string;
  text: string;
  order: number;
}

// Question with its evaluation criteria
export interface Question {
  id: string;
  text: string;
  order: number;
  word_limit: number;
  criteria: Criterion[];
}

// Challenge with project description and supplementary questions
export interface Challenge {
  id: string;
  role_description: string;
  challenge_requirements: string | null;
  intro_text: string;
  challenge_text: string;
  questions_json: Question[];
  deadline: string | null;
  created_at: string;
}

// Candidate answer to a question
export interface Answer {
  question_id: string;
  text: string;
}

// Submission with answers instead of written_explanation
export interface Submission {
  id: string;
  challenge_id: string;
  candidate_name: string;
  candidate_email: string | null;
  demo_url: string;
  answers_json: Answer[];
  video_path: string | null;
  created_at: string;
}

// Score for a single criterion
export interface CriterionScore {
  criterion_id: string;
  question_id: string;
  score: number; // 1-5
  reasoning: string;
}

// Evaluation with criterion scores instead of rubric scores
export interface Evaluation {
  id: string;
  submission_id: string;
  criterion_scores_json: CriterionScore[];
  url_passed: boolean;
  url_notes: string;
  summary_bullets: string[];
  worth_human_attention: boolean;
  flag_reason: string | null;
  rejection_draft: string | null;
  created_at: string;
}

export interface SubmissionWithEvaluation extends Submission {
  evaluation: Evaluation | null;
  challenge: Challenge | null;
}

// Company settings
export interface CompanySettings {
  id: string;
  company_name: string;
  mission: string | null;
  benefits: string | null;
  updated_at: string;
}
