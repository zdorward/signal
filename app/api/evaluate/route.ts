import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Challenge, Submission, RubricItem } from '@/lib/types';

export const maxDuration = 60;

export async function POST(request: Request) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  // Fetch submission with challenge
  const { data: submission, error: subError } = await supabaseAdmin
    .from('submissions')
    .select('*, challenge:challenges(*)')
    .eq('id', submission_id)
    .single();

  if (subError || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const challenge = Array.isArray(submission.challenge)
    ? submission.challenge[0]
    : submission.challenge;

  if (!challenge) {
    return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
  }

  const typedSubmission = submission as unknown as Submission;
  const typedChallenge = challenge as Challenge;
  const rubric = typedChallenge.rubric_json as RubricItem[];

  const systemPrompt = `You are an expert technical evaluator. Evaluate the candidate's submission against the provided rubric.

For each criterion, provide:
- score: 0-100
- reasoning: Brief explanation

Also provide:
- summary_bullets: 3-5 key takeaways
- worth_human_attention: true if promising candidate, false if clear reject
- flag_reason: If flagged, explain why (null otherwise)
- rejection_draft: A polite, constructive rejection email (always include)

Respond with valid JSON matching this schema:
{
  "rubric_scores_json": [{"criterion": "...", "score": 85, "reasoning": "..."}],
  "summary_bullets": ["Point 1", "Point 2"],
  "worth_human_attention": true,
  "flag_reason": null,
  "rejection_draft": "Dear candidate..."
}`;

  const userPrompt = `## Challenge
${typedChallenge.challenge_text}

## Rubric
${rubric.map((r) => `- ${r.criterion} (${r.weight}%): ${r.description}`).join('\n')}

## Candidate Submission
Name: ${typedSubmission.candidate_name}
Demo URL: ${typedSubmission.demo_url}
${typedSubmission.video_path ? `Video: ${typedSubmission.video_path}` : ''}

Written Explanation:
${typedSubmission.written_explanation}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 });
  }

  let evaluation;
  try {
    evaluation = JSON.parse(content.text);
  } catch {
    return NextResponse.json({ error: 'Failed to parse evaluation' }, { status: 500 });
  }

  const { data: evalData, error: evalError } = await supabaseAdmin
    .from('evaluations')
    .insert({
      submission_id,
      rubric_scores_json: evaluation.rubric_scores_json,
      summary_bullets: evaluation.summary_bullets,
      worth_human_attention: evaluation.worth_human_attention,
      flag_reason: evaluation.flag_reason,
      rejection_draft: evaluation.rejection_draft,
    })
    .select()
    .single();

  if (evalError) {
    return NextResponse.json({ error: evalError.message }, { status: 500 });
  }

  return NextResponse.json(evalData, { status: 201 });
}
