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
  console.log('[submissions] POST started');
  const body = await request.json();
  const { challenge_id, candidate_name, candidate_email, demo_url, answers_json, video_path } = body;
  console.log('[submissions] Received submission for:', candidate_name);

  if (!challenge_id || !candidate_name || !demo_url || !answers_json) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  console.log('[submissions] Inserting to Supabase...');
  const insertStart = Date.now();
  const { data, error } = await supabaseAdmin
    .from('submissions')
    .insert({
      challenge_id,
      candidate_name,
      candidate_email: candidate_email || null,
      demo_url,
      answers_json,
      video_path: video_path || null,
    })
    .select()
    .single();
  console.log(`[submissions] Supabase insert completed in ${Date.now() - insertStart}ms`);

  if (error) {
    console.error('Submission insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget: trigger evaluation
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000';
  console.log(`[submissions] Triggering evaluation at ${baseUrl}/api/evaluate`);
  fetch(`${baseUrl}/api/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submission_id: data.id }),
  }).catch((err) => console.error('[submissions] Evaluation trigger error:', err));

  console.log('[submissions] Returning response');
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE() {
  // Delete all submissions (evaluations will cascade due to ON DELETE CASCADE)
  const { error } = await supabaseAdmin
    .from('submissions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
