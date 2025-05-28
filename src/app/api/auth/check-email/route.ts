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

    // 서버 사이드에서 이메일 존재 확인 (RLS 우회 - 서비스 키 사용)
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

    const userExists = existingUsers && existingUsers.length > 0

    // 디버깅을 위한 로그 추가
    console.log('이메일 확인 결과:', {
      email,
      userExists,
      foundUsers: existingUsers?.length || 0,
      userData: existingUsers
    })

    return NextResponse.json({
      success: true,
      exists: userExists,
      message: userExists ? '사용자가 존재합니다.' : '등록되지 않은 이메일입니다.'
    })

  } catch (error) {
    console.error('이메일 확인 API 오류:', error)
    return NextResponse.json({
      success: false,
      message: '서버 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 