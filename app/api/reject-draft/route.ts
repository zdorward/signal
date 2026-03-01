import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic } from '@/lib/anthropic';
import type { Evaluation } from '@/lib/types';

export async function POST(request: Request) {
  const { submission_id } = await request.json();

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  const { data: submission, error } = await supabaseAdmin
    .from('submissions')
    .select('*, evaluation:evaluations(*), challenge:challenges(*)')
    .eq('id', submission_id)
    .single();

  if (error || !submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const evaluation = Array.isArray(submission.evaluation)
    ? submission.evaluation[0]
    : submission.evaluation;

  if (!evaluation) {
    return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
  }

  const typedEvaluation = evaluation as Evaluation;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You write polite, professional rejection emails. Be brief, kind, and constructive.`,
    messages: [
      {
        role: 'user',
        content: `Write a rejection email for ${submission.candidate_name}.

Summary of their submission:
${typedEvaluation.summary_bullets.join('\n')}

${typedEvaluation.flag_reason ? `Additional context: ${typedEvaluation.flag_reason}` : ''}

Keep it under 150 words. Be encouraging but honest.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    return NextResponse.json({ error: 'Unexpected response' }, { status: 500 });
  }

  // Update the evaluation with new rejection draft
  await supabaseAdmin
    .from('evaluations')
    .update({ rejection_draft: content.text })
    .eq('id', typedEvaluation.id);

  return NextResponse.json({ rejection_draft: content.text });
}
