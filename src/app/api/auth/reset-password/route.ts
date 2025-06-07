import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, resetToken } = await request.json()

    // 입력 검증
    if (!email || !newPassword || !resetToken) {
      return NextResponse.json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      }, { status: 400 })
    }

    // 비밀번호 길이 검증
    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        message: '비밀번호는 최소 8자 이상이어야 합니다.'
      }, { status: 400 })
    }

    // resetToken 검증 (간단한 형태)
    try {
      const tokenData = Buffer.from(resetToken, 'base64').toString()
      const [tokenEmail, timestamp] = tokenData.split(':')
      
      if (tokenEmail !== email) {
        return NextResponse.json({
          success: false,
          message: '유효하지 않은 재설정 토큰입니다.'
        }, { status: 400 })
      }

      // 토큰 유효시간 검증 (10분)
      const tokenAge = Date.now() - parseInt(timestamp)
      if (tokenAge > 10 * 60 * 1000) {
        return NextResponse.json({
          success: false,
          message: '재설정 토큰이 만료되었습니다.'
        }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: '유효하지 않은 재설정 토큰입니다.'
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

    // 사용자 존재 확인
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 대신 supabase.auth.admin.updateUserById로 비밀번호 변경
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })

    if (updateError) {
      console.error('비밀번호 업데이트 오류:', updateError)
      return NextResponse.json({
        success: false,
        message: '비밀번호 업데이트에 실패했습니다.',
        error: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })

  } catch (error) {
    console.error('비밀번호 재설정 API 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 