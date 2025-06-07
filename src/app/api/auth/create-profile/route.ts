import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { id, email, full_name, role } = await req.json();
    if (!id || !email) {
      return NextResponse.json({ success: false, error: 'id, email은 필수입니다.' }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase 연결 실패' }, { status: 500 });
    }
    // upsert: id가 이미 있으면 무시, 없으면 생성
    const { error } = await supabase
      .from('profiles')
      .upsert([
        {
          id,
          email,
          full_name: full_name || null,
          role: role || 'user',
        },
      ], { onConflict: 'id' });
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || '서버 오류' }, { status: 500 });
  }
} 