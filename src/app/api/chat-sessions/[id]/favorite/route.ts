import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase'

// 동적 라우트임을 명시
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id
    
    // 요청 본문에서 favorite 상태 가져오기
    const body = await request.json().catch(() => null)
    
    if (!body || typeof body.favorite !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'favorite 필드가 필요합니다 (boolean).' },
        { status: 400 }
      )
    }
    
    const { favorite } = body
    
    // JWT 토큰으로 사용자 인증 확인
    let currentUserId: string | null = null
    
    try {
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { success: false, error: '인증이 필요합니다.' },
          { status: 401 }
        )
      }
      
      const token = authHeader.substring(7) // 'Bearer ' 제거
      
      // 토큰으로 Supabase 클라이언트 생성
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // 토큰으로 사용자 정보 가져오기
      const { data: { user }, error } = await supabase.auth.getUser(token)
      
      if (error || !user) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 인증 토큰입니다.' },
          { status: 401 }
        )
      }
      
      currentUserId = user.id
      console.log(`인증된 사용자 ID: ${currentUserId}`)
      
    } catch (authError) {
      console.error('인증 오류:', authError)
      return NextResponse.json(
        { success: false, error: '인증 처리 중 오류가 발생했습니다.' },
        { status: 401 }
      )
    }
    
    // Admin 클라이언트로 세션 조회 및 권한 확인
    const supabaseAdmin = getSupabaseAdmin()
    
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase 연결에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    // 세션 존재 및 소유권 확인
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, user_id, metadata')
      .eq('id', sessionId)
      .single()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: '대화 세션을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    
    // 세션 소유자 확인
    if (session.user_id !== currentUserId) {
      return NextResponse.json(
        { success: false, error: '이 대화를 수정할 권한이 없습니다.' },
        { status: 403 }
      )
    }
    
    // 기존 메타데이터 보존하며 favorite 필드 업데이트
    const updatedMetadata = {
      ...session.metadata,
      favorite
    }
    
    // 메타데이터 업데이트
    const { error: updateError } = await supabaseAdmin
      .from('chat_sessions')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', currentUserId) // 추가 보안 확인
    
    if (updateError) {
      console.error('즐겨찾기 업데이트 오류:', updateError)
      return NextResponse.json(
        { success: false, error: '즐겨찾기 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      )
    }
    
    console.log(`세션 ${sessionId}의 즐겨찾기 상태를 ${favorite}로 업데이트 완료`)
    
    return NextResponse.json({
      success: true,
      data: { 
        favorite,
        sessionId,
        message: favorite ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.'
      }
    })
    
  } catch (error) {
    console.error('즐겨찾기 토글 API 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 