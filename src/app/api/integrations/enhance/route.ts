import { NextRequest, NextResponse } from 'next/server';
import { enhanceSessionCategories } from '@/utils/supabaseHandler';

// 동적 라우트임을 명시
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionIds } = body;

    if (!sessionIds || !Array.isArray(sessionIds)) {
      return NextResponse.json(
        { success: false, error: '세션 ID 배열이 필요합니다.' },
        { status: 400 }
      );
    }

    // 백그라운드에서 카테고리 개선 실행
    const result = await enhanceSessionCategories(sessionIds);

    return NextResponse.json({
      success: true,
      data: {
        enhanced: result.enhanced,
        errors: result.errors,
        total: sessionIds.length,
        message: `${result.enhanced}개 세션 개선 완료 (${result.errors}개 오류)`
      }
    });

  } catch (error) {
    console.error('카테고리 개선 API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 