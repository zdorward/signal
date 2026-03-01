export interface RubricItem {
  criterion: string;
  weight: number;
  description: string;
}

export interface RubricScore {
  criterion: string;
  score: number;
  reasoning: string;
}

export interface Challenge {
  id: string;
  role_description: string;
  challenge_text: string;
  rubric_json: RubricItem[];
  created_at: string;
}

export interface Submission {
  id: string;
  challenge_id: string;
  candidate_name: string;
  demo_url: string;
  written_explanation: string;
  video_path: string | null;
  created_at: string;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  rubric_scores_json: RubricScore[];
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
