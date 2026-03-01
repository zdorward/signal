import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Evaluation, Submission, Challenge } from '@/lib/types';

export async function POST(request: Request) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  // Fetch submission with evaluation and challenge
  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      *,
      evaluation:evaluations(*),
      challenge:challenges(*)
    `)
    .eq('id', submission_id)
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const evaluation = Array.isArray(submission.evaluation)
    ? submission.evaluation[0]
    : submission.evaluation;
  const challenge = Array.isArray(submission.challenge)
    ? submission.challenge[0]
    : submission.challenge;

  const typedSubmission = submission as unknown as Submission;
  const typedEvaluation = evaluation as Evaluation | null;
  const typedChallenge = challenge as Challenge | null;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You write polite, constructive rejection emails for job candidates. Be kind but honest. Keep it brief (3-4 paragraphs). Don't be generic - reference specific aspects of their submission.`,
    messages: [
      {
        role: 'user',
        content: `Write a rejection email for this candidate:

Name: ${typedSubmission.candidate_name}
Role: ${typedChallenge?.role_description || 'Unknown role'}
${typedEvaluation ? `Evaluation summary: ${typedEvaluation.summary_bullets.join(', ')}` : ''}
${typedEvaluation?.flag_reason ? `Main concern: ${typedEvaluation.flag_reason}` : ''}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 });
  }

  return NextResponse.json({ rejection_draft: content.text });
}
