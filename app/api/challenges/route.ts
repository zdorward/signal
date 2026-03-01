import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Challenge, RubricItem } from '@/lib/types';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Challenge[]);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { role_description, challenge_text, rubric_json } = body as {
    role_description: string;
    challenge_text: string;
    rubric_json: RubricItem[];
  };

  if (!role_description || !challenge_text || !rubric_json) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('challenges')
    .insert({ role_description, challenge_text, rubric_json })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Challenge, { status: 201 });
}
