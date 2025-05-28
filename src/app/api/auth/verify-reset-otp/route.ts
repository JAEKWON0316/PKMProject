import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json()

    // 입력 검증
    if (!email || !token) {
      return NextResponse.json({
        success: false,
        message: '이메일과 인증 코드를 입력해주세요.'
      }, { status: 400 })
    }

    // Supabase 클라이언트 가져오기
    const supabase = getSupabaseClient()

    // OTP 코드 검증 (recovery 타입)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery'
    })

    if (error) {
      let message = '코드 인증에 실패했습니다.'
      
      if (error.message.includes('Invalid token') || error.message.includes('Token has expired')) {
        message = '코드가 올바르지 않거나 만료되었습니다. 다시 시도해주세요.'
      }

      return NextResponse.json({
        success: false,
        message,
        error: error.message
      }, { status: 400 })
    }

    // 검증 성공 시 임시 토큰 생성 (세션 대신 사용)
    const resetToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      message: '코드 인증이 완료되었습니다. 새 비밀번호를 설정해주세요.',
      resetToken: resetToken,
      user: data.user
    })

  } catch (error) {
    console.error('비밀번호 재설정 OTP 검증 API 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 