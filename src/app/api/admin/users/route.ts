import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: 'Supabase 연결 실패' }, { status: 500 });
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, created_at, updated_at, role')
    .order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
} 