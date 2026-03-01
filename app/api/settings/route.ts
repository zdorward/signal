import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('company_settings')
    .select('*')
    .single();

  if (error) {
    // If no settings exist, return defaults
    if (error.code === 'PGRST116') {
      return NextResponse.json({
        company_name: 'Company',
        mission: null,
        benefits: null,
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { company_name, mission, benefits } = body;

  // Upsert settings
  const { data, error } = await supabaseAdmin
    .from('company_settings')
    .upsert({
      id: body.id || undefined,
      company_name: company_name || 'Company',
      mission: mission || null,
      benefits: benefits || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
