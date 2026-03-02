import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('company_settings')
    .select('*')
    .limit(1)
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

  // First, get the existing row (or create one if none exists)
  const { data: existing } = await supabaseAdmin
    .from('company_settings')
    .select('id')
    .limit(1)
    .single();

  if (existing?.id) {
    // Update existing row
    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .update({
        company_name: company_name || 'Company',
        mission: mission || null,
        benefits: benefits || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } else {
    // Insert new row
    const { data, error } = await supabaseAdmin
      .from('company_settings')
      .insert({
        company_name: company_name || 'Company',
        mission: mission || null,
        benefits: benefits || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  }
}
