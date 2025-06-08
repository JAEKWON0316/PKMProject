import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const token = cookies().get('sb-access-token')?.value;
  if (!token) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  try {
    await requireAdmin(token);
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase 연결 실패' }, { status: 500 });
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, users: data });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e instanceof Error ? e.message : '권한 없음') }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  const token = cookies().get('sb-access-token')?.value;
  if (!token) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  try {
    await requireAdmin(token);
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase 연결 실패' }, { status: 500 });
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'id 필요' }, { status: 400 });
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e instanceof Error ? e.message : '권한 없음') }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  const token = cookies().get('sb-access-token')?.value;
  if (!token) return NextResponse.json({ success: false, error: '인증 필요' }, { status: 401 });
  try {
    await requireAdmin(token);
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase 연결 실패' }, { status: 500 });
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'id 필요' }, { status: 400 });
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e instanceof Error ? e.message : '권한 없음') }, { status: 403 });
  }
} 