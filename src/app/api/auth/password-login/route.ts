import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

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

    // 4. 비밀번호가 맞으면 OTP 없이 인증된 상태로 사용자 정보 반환
    try {
      // auth 테이블에서 사용자 정보 가져오기
      const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
      
      if (userError) {
        console.error('사용자 정보 조회 오류:', userError)
        // auth에서 못 찾으면 profiles 데이터로 임시 사용자 객체 생성
        const tempUser = {
          id: profile.id,
          email: profile.email,
          user_metadata: {
            full_name: profile.full_name
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        return NextResponse.json({
          success: true,
          message: '비밀번호 인증 완료!',
          loginMethod: 'password_verified',
          requiresManualAuth: true, // 수동 인증 필요 플래그
          user: tempUser,
          email: profile.email
        })
      }

      return NextResponse.json({
        success: true,
        message: '비밀번호 인증 완료!',
        loginMethod: 'password_verified',
        requiresManualAuth: true, // 수동 인증 필요 플래그
        user: authUser.user,
        email: profile.email
      })

    } catch (authError) {
      console.error('인증 처리 실패:', authError)
      return NextResponse.json(
        { success: false, message: '로그인 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('비밀번호 로그인 API 오류:', error)
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 