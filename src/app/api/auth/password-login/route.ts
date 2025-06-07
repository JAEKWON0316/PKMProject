import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // SSR 세션/쿠키 연동을 위해 공식 헬퍼 사용
    const supabase = createRouteHandlerClient({ cookies })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      return NextResponse.json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' }, { status: 401 })
    }

    // 세션 쿠키가 자동으로 세팅됨
    return NextResponse.json({ success: true, message: '로그인 성공!', user: data.user, email: data.user.email })
  } catch (error) {
    console.error('비밀번호 로그인 API 오류:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 