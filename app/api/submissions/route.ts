import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get('challenge_id');

  let query = supabaseAdmin
    .from('submissions')
    .select('*, evaluation:evaluations(*), challenge:challenges(*)')
    .order('created_at', { ascending: false });

  if (challengeId) {
    query = query.eq('challenge_id', challengeId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten evaluation array to single object
  const formatted = data.map((s) => ({
    ...s,
    evaluation: Array.isArray(s.evaluation) ? s.evaluation[0] || null : s.evaluation,
    challenge: Array.isArray(s.challenge) ? s.challenge[0] || null : s.challenge,
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { challenge_id, candidate_name, demo_url, answers_json, video_path } = body;

  if (!challenge_id || !candidate_name || !demo_url || !answers_json) {
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
      answers_json,
      video_path: video_path || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget: trigger evaluation
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: data.id }),
  }).catch(console.error);

  return NextResponse.json(data, { status: 201 });
}
