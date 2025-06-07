import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버용 Supabase 클라이언트 (service role key 사용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 클라이언트용 Supabase 클라이언트
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }
    return NextResponse.json({ success: true, message: '로그인 성공!', user: data.user, email: data.user.email });

  } catch (error) {
    console.error('비밀번호 로그인 API 오류:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 