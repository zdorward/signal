import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';

// Question IDs - fixed for consistency
const Q1_ID = randomUUID();
const Q2_ID = randomUUID();
const C1_ID = randomUUID();
const C2_ID = randomUUID();
const C3_ID = randomUUID();
const C4_ID = randomUUID();

const challenge = {
  id: randomUUID(),
  role_description: 'AI Builder',
  challenge_requirements: null,
  intro_text: `As an AI Builder, you'll own the full path from problem to shipped system to real-world adoption.`,
  challenge_text: `Design and prototype an AI system that meaningfully expands what a human can do.`,
  questions_json: [
    {
      id: Q1_ID,
      text: 'Why Wealthsimple?',
      order: 1,
      word_limit: 300,
      criteria: [
        { id: C1_ID, text: 'Shows genuine understanding of Wealthsimple\'s mission and values', order: 1 },
        { id: C2_ID, text: 'Connects personal motivation to the company\'s goals', order: 2 },
      ],
    },
    {
      id: Q2_ID,
      text: 'What is the one critical decision in your system that must remain human?',
      order: 2,
      word_limit: 400,
      criteria: [
        { id: C3_ID, text: 'Identifies a genuinely critical decision point', order: 1 },
        { id: C4_ID, text: 'Provides clear reasoning for why AI shouldn\'t make this decision', order: 2 },
      ],
    },
  ],
  deadline: null,
};

// Simplified candidate data for API seeding
const candidates = [
  { name: 'Candidate 1', scores: { q1c1: 5, q1c2: 5, q2c1: 5, q2c2: 5 }, url_passed: true, video_score: 9, video_summary: 'AI tax optimization tool' },
  { name: 'Candidate 2', scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 4 }, url_passed: true, video_score: 7, video_summary: 'Portfolio rebalancing automation' },
  { name: 'Candidate 3', scores: { q1c1: 5, q1c2: 4, q2c1: 5, q2c2: 4 }, url_passed: true, video_score: 8, video_summary: 'AI financial coaching app' },
  { name: 'Candidate 4', scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 4 }, url_passed: true, video_score: 6, video_summary: 'Fraud detection with human oversight' },
  { name: 'Candidate 5', scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 3 }, url_passed: true, video_score: 5, video_summary: 'AI retirement planning system' },
  { name: 'Candidate 6', scores: { q1c1: 4, q1c2: 4, q2c1: 4, q2c2: 4 }, url_passed: true, video_score: 6, video_summary: 'Investment research AI assistant' },
  { name: 'Candidate 7', scores: { q1c1: 4, q1c2: 3, q2c1: 4, q2c2: 3 }, url_passed: true, video_score: 4, video_summary: 'Budget categorization bot' },
  { name: 'Candidate 8', scores: { q1c1: 4, q1c2: 4, q2c1: 3, q2c2: 4 }, url_passed: true, video_score: 7, video_summary: 'Expense tracking system' },
  { name: 'Candidate 9', scores: { q1c1: 3, q1c2: 4, q2c1: 3, q2c2: 4 }, url_passed: true, video_score: 5, video_summary: 'Stock alert notifications' },
  { name: 'Candidate 10', scores: { q1c1: 4, q1c2: 3, q2c1: 4, q2c2: 3 }, url_passed: true, video_score: 3, video_summary: 'Savings gamification app' },
  { name: 'Candidate 11', scores: { q1c1: 3, q1c2: 4, q2c1: 4, q2c2: 3 }, url_passed: true, video_score: 6, video_summary: 'Crypto portfolio tracker' },
  { name: 'Candidate 12', scores: { q1c1: 4, q1c2: 4, q2c1: 3, q2c2: 4 }, url_passed: false, video_score: 7, video_summary: 'AI bill splitting app' },
  { name: 'Candidate 13', scores: { q1c1: 4, q1c2: 3, q2c1: 4, q2c2: 3 }, url_passed: true, video_score: 4, video_summary: 'Financial news summarizer' },
  { name: 'Candidate 14', scores: { q1c1: 3, q1c2: 4, q2c1: 3, q2c2: 4 }, url_passed: true, video_score: 5, video_summary: 'Subscription manager tool' },
  { name: 'Candidate 15', scores: { q1c1: 3, q1c2: 3, q2c1: 3, q2c2: 3 }, url_passed: true, video_score: 3, video_summary: 'Unrelated todo app' },
  { name: 'Candidate 16', scores: { q1c1: 2, q1c2: 2, q2c1: 2, q2c2: 2 }, url_passed: true, video_score: 2, video_summary: 'Personal portfolio website' },
  { name: 'Candidate 17', scores: { q1c1: 3, q1c2: 4, q2c1: 3, q2c2: 3 }, url_passed: false, video_score: 6, video_summary: 'Basic ML demo' },
  { name: 'Candidate 18', scores: { q1c1: 4, q1c2: 3, q2c1: 3, q2c2: 4 }, url_passed: true, video_score: 4, video_summary: 'Basic hello world repo' },
  { name: 'Candidate 19', scores: { q1c1: 3, q1c2: 3, q2c1: 4, q2c2: 3 }, url_passed: true, video_score: null, video_summary: null },
  { name: 'Candidate 20', scores: { q1c1: 3, q1c2: 4, q2c1: 4, q2c2: 3 }, url_passed: true, video_score: 8, video_summary: 'Solid AI assistant demo' },
];

export async function POST() {
  try {
    console.log('[seed] Starting database seed...');

    // Clear existing submissions and evaluations
    console.log('[seed] Clearing existing data...');
    await supabaseAdmin.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Delete existing AI Builder seed challenges
    await supabaseAdmin.from('challenges').delete().eq('role_description', 'AI Builder');

    // Create challenge
    console.log('[seed] Creating challenge...');
    const { error: challengeError } = await supabaseAdmin.from('challenges').insert(challenge);
    if (challengeError) {
      console.error('[seed] Challenge error:', challengeError);
      return NextResponse.json({ error: challengeError.message }, { status: 500 });
    }

    // Create submissions and evaluations
    console.log('[seed] Creating submissions...');
    for (const candidate of candidates) {
      const submissionId = randomUUID();

      const { error: subError } = await supabaseAdmin.from('submissions').insert({
        id: submissionId,
        challenge_id: challenge.id,
        candidate_name: candidate.name,
        candidate_email: `${candidate.name.toLowerCase().replace(' ', '.')}@example.com`,
        demo_url: `https://github.com/example/${candidate.name.toLowerCase().replace(' ', '-')}`,
        answers_json: [
          { question_id: Q1_ID, text: 'Sample answer for question 1.' },
          { question_id: Q2_ID, text: 'Sample answer for question 2.' },
        ],
        video_path: candidate.video_score != null ? `https://example.com/videos/${submissionId}.mp4` : null,
      });

      if (subError) {
        console.error(`[seed] Submission error for ${candidate.name}:`, subError);
        continue;
      }

      const criterionScores = [
        { criterion_id: C1_ID, question_id: Q1_ID, score: candidate.scores.q1c1, reasoning: 'Evaluation reasoning' },
        { criterion_id: C2_ID, question_id: Q1_ID, score: candidate.scores.q1c2, reasoning: 'Evaluation reasoning' },
        { criterion_id: C3_ID, question_id: Q2_ID, score: candidate.scores.q2c1, reasoning: 'Evaluation reasoning' },
        { criterion_id: C4_ID, question_id: Q2_ID, score: candidate.scores.q2c2, reasoning: 'Evaluation reasoning' },
      ];

      const avgScore = (candidate.scores.q1c1 + candidate.scores.q1c2 + candidate.scores.q2c1 + candidate.scores.q2c2) / 4;

      await supabaseAdmin.from('evaluations').insert({
        id: randomUUID(),
        submission_id: submissionId,
        criterion_scores_json: criterionScores,
        url_passed: candidate.url_passed,
        url_notes: candidate.url_passed ? 'URL resolves and is relevant' : 'URL does not resolve or is not relevant',
        video_score: candidate.video_score,
        video_notes: candidate.video_summary ? `${candidate.video_summary}\n\nWorks: ${candidate.video_score}/10` : null,
        summary_bullets: [`Average score: ${avgScore.toFixed(1)}/5`],
        worth_human_attention: avgScore >= 4 && candidate.url_passed,
        flag_reason: null,
        rejection_draft: (!candidate.url_passed || (candidate.video_score !== null && candidate.video_score < 5) || avgScore < 3)
          ? `Dear ${candidate.name},\n\nThank you for your interest in the AI Builder role. After careful review, we've decided to move forward with other candidates whose experience more closely aligns with what we're looking for.\n\nWe appreciate the time you invested in your application and wish you the best in your job search.\n\nBest,\nThe Hiring Team`
          : null,
        interview_draft: (avgScore >= 3 && candidate.url_passed && (candidate.video_score ?? 0) >= 8) ? `Dear ${candidate.name},\n\nWe were impressed by your submission and would love to chat.\n\nBest,\nThe Team` : null,
      });
    }

    console.log('[seed] Seed completed successfully');
    return NextResponse.json({ success: true, count: candidates.length }, { status: 200 });

  } catch (error) {
    console.error('[seed] Error:', error);
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}
