import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PREDEFINED_CATEGORIES } from '@/utils/categoryClassifier';

// 동적 라우트임을 명시
export const dynamic = 'force-dynamic';

// 간단한 메모리 캐시 (프로덕션에서는 Redis 등 사용 권장)
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 2 * 60 * 1000; // 2분 캐시

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    // 캐시 확인 (강제 새로고침이 아닌 경우)
    if (!forceRefresh && cachedData && Date.now() - cacheTimestamp < CACHE_TTL) {
      // 사용자별 데이터는 동적으로 계산
      if (userId && cachedData.sessions) {
        const userChatCount = cachedData.sessions.filter((session: any) => session.user_id === userId).length;
        const dynamicCategoryCounts = {
          ...cachedData.categoryCounts,
          '내 대화': userChatCount
        };
        
        return NextResponse.json({
          success: true,
          data: {
            ...cachedData,
            userChatCount,
            categoryCounts: dynamicCategoryCounts,
            isAuthenticated: !!userId
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        data: {
          ...cachedData,
          userChatCount: 0,
          isAuthenticated: !!userId
        }
      });
    }

    const supabase = getSupabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase 연결에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    // 데이터베이스에서 새로운 데이터 조회...
    const startTime = Date.now();
    
    // 경량화: 메시지 필드를 제외하고 필요한 필드만 선택
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('id, title, url, summary, metadata, created_at, user_id')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      return NextResponse.json(
        { success: false, error: '데이터를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    const sessionsData = sessions || [];
    
    // 기본 카테고리 처리 (기존 메타데이터 활용, 복잡한 정규식 연산 최소화)
    const processedSessions = sessionsData.map(session => {
      // 메타데이터가 없으면 기본값 설정
      if (!session.metadata) {
        session.metadata = { mainCategory: "기타", tags: [] };
      }
      
      // 기존 카테고리가 없거나 유효하지 않은 경우에만 간단한 분류
      if (!session.metadata.mainCategory || !PREDEFINED_CATEGORIES.includes(session.metadata.mainCategory)) {
        session.metadata.mainCategory = "기타"; // 기본값으로 설정하고 백그라운드에서 개선
      }
      
      return session;
    });

    // 사용자별 대화 수 계산
    let userChatCount = 0;
    if (userId) {
      userChatCount = processedSessions.filter(session => session.user_id === userId).length;
    }

    // 효율적인 카테고리 카운트 계산
    const categoryCounts: Record<string, number> = {
      'All': processedSessions.length
    };
    
    if (userId) {
      categoryCounts['내 대화'] = userChatCount;
    }

    // Map을 사용한 효율적인 카테고리 집계
    const categoryMap = new Map<string, number>();
    processedSessions.forEach(session => {
      const category = session.metadata?.mainCategory || '기타';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // 카테고리 카운트 통합
    categoryMap.forEach((count, category) => {
      categoryCounts[category] = count;
    });

    // 빈 카테고리들도 0으로 설정 (UI 일관성을 위해)
    PREDEFINED_CATEGORIES.forEach(category => {
      if (!(category in categoryCounts)) {
        categoryCounts[category] = 0;
      }
    });

    const endTime = Date.now();
    // 데이터 처리 완료: ${endTime - startTime}ms, 세션 수: ${processedSessions.length}

    // 캐시 업데이트 (사용자별 정보 제외)
    cachedData = {
      sessions: processedSessions,
      categoryCounts
    };
    cacheTimestamp = Date.now();

    return NextResponse.json({
      success: true,
      data: {
        sessions: processedSessions,
        userChatCount,
        categoryCounts,
        isAuthenticated: !!userId
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 