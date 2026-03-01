import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { SubmissionWithEvaluation } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get('challenge_id');

  let query = supabaseAdmin
    .from('submissions')
    .select(`
      *,
      evaluation:evaluations(*),
      challenge:challenges(*)
    `)
    .order('created_at', { ascending: false });

  if (challengeId) {
    query = query.eq('challenge_id', challengeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const formatted = (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    evaluation: Array.isArray(row.evaluation) ? row.evaluation[0] || null : row.evaluation,
    challenge: Array.isArray(row.challenge) ? row.challenge[0] || null : row.challenge,
  })) as SubmissionWithEvaluation[];

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { challenge_id, candidate_name, demo_url, written_explanation, video_path } = body;

  if (!challenge_id || !candidate_name || !demo_url || !written_explanation) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('submissions')
    .insert({
      challenge_id,
      candidate_name,
      demo_url,
      written_explanation,
      video_path: video_path || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget evaluation - don't await
  const baseUrl = request.headers.get('origin') || 'http://localhost:3000';
  fetch(`${baseUrl}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: data.id }),
  }).catch(console.error);

  return NextResponse.json(data, { status: 201 });
}
