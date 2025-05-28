import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // 입력 검증
    if (!email) {
      return NextResponse.json({
        success: false,
        message: '이메일을 입력해주세요.'
      }, { status: 400 })
    }

    // Supabase Admin 클라이언트 가져오기
    const supabase = getSupabaseAdmin()
    
    if (!supabase) {
      return NextResponse.json({
        success: false,
        message: 'Supabase 연결에 실패했습니다.'
      }, { status: 500 })
    }

    // 먼저 이메일 존재 확인
    const { data: existingUsers, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .limit(1)

    if (userError) {
      console.error('사용자 조회 오류:', userError)
      return NextResponse.json({
        success: false,
        message: '사용자 조회 중 오류가 발생했습니다.',
        error: userError.message
      }, { status: 500 })
    }

    if (!existingUsers || existingUsers.length === 0) {
      return NextResponse.json({
        success: false,
        message: '등록되지 않은 이메일입니다.'
      }, { status: 404 })
    }

    // Supabase Auth를 통해 비밀번호 재설정 OTP 발송 (올바른 방식)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // 리다이렉트 없이 OTP만 발송
      captchaToken: undefined
    })

    if (resetError) {
      console.error('비밀번호 재설정 OTP 발송 오류:', resetError)
      return NextResponse.json({
        success: false,
        message: '재설정 코드 발송에 실패했습니다.',
        error: resetError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '6자리 재설정 코드를 이메일로 발송했습니다.'
    })

  } catch (error) {
    console.error('비밀번호 재설정 OTP 발송 API 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 