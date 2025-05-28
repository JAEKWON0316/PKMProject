import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// 서버용 Supabase 클라이언트 (service role key 사용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!, // 환경변수 이름 수정
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
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

    // 1. DB에서 사용자 프로필과 비밀번호 해시 가져오기
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, password_hash, full_name')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 2. 비밀번호 해시가 없으면 OTP로만 가입한 사용자
    if (!profile.password_hash) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'OTP로만 가입한 계정입니다. OTP 로그인을 이용해주세요.',
          error: 'password_not_set'
        },
        { status: 400 }
      )
    }

    // 3. 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, profile.password_hash)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 4. 서버에서 사용자 세션 생성
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    })

    if (sessionError) {
      console.error('세션 생성 오류:', sessionError)
      return NextResponse.json(
        { success: false, message: '로그인 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '로그인 성공!',
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name
      },
      authUrl: sessionData.properties?.action_link // 클라이언트에서 이 URL로 리다이렉트
    })

  } catch (error) {
    console.error('비밀번호 로그인 API 오류:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 