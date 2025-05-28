import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { PREDEFINED_CATEGORIES } from '@/utils/categoryClassifier';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // 현재 로그인한 사용자 ID (선택적)

    console.log('Integrations API 호출 - 사용자 ID:', userId);

    // Admin 클라이언트로 모든 대화 세션 조회
    const supabase = getSupabaseAdmin();
    
    // supabase가 null인 경우 에러 처리
    if (!supabase) {
      console.error('Supabase Admin 클라이언트를 초기화할 수 없습니다.');
      return NextResponse.json(
        { success: false, error: 'Supabase 연결에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('채팅 세션 조회 오류:', sessionsError);
      return NextResponse.json(
        { success: false, error: '데이터를 불러올 수 없습니다.' },
        { status: 500 }
      );
    }

    // 데이터 처리 및 카테고리 분류
    const processedSessions = (sessions || []).map(session => {
      // 메타데이터가 없으면 기본값 설정
      if (!session.metadata) {
        session.metadata = { mainCategory: "기타", tags: [] };
      }
      
      // 카테고리 처리 (기존 카테고리가 없거나 유효하지 않은 경우)
      if (!session.metadata.mainCategory || !PREDEFINED_CATEGORIES.includes(session.metadata.mainCategory)) {
        // 제목과 요약을 기반으로 간단한 카테고리 추측
        const content = `${session.title || ''} ${session.summary || ''}`.toLowerCase();
        
        let guessedCategory = "기타";
        
        // 간단한 키워드 매칭으로 카테고리 추측
        if (/코딩|개발|프로그래밍|코드|javascript|python|api|서버|앱/.test(content)) {
          guessedCategory = "개발";
        } else if (/학습|공부|교육|강의|수업|학교|과제/.test(content)) {
          guessedCategory = "학습";
        } else if (/비즈니스|업무|회의|프로젝트|업무|기획|보고서/.test(content)) {
          guessedCategory = "업무";
        } else if (/디자인|창작|그림|음악|콘텐츠|예술|작성/.test(content)) {
          guessedCategory = "창작";
        } else if (/게임|영화|취미|독서|음악|취미|여가/.test(content)) {
          guessedCategory = "취미";
        } else if (/가정|생활|요리|쇼핑|일상|집안/.test(content)) {
          guessedCategory = "생활";
        } else if (/운동|건강|다이어트|식단|질병|의료/.test(content)) {
          guessedCategory = "건강";
        } else if (/여행|관광|휴가|호텔|여행지|숙소/.test(content)) {
          guessedCategory = "여행";
        } else if (/금융|투자|주식|부동산|재테크|경제/.test(content)) {
          guessedCategory = "경제";
        } else if (/기술|ai|인공지능|블록체인|iot|가상현실/.test(content)) {
          guessedCategory = "기술";
        }
        
        session.metadata.mainCategory = guessedCategory;
      }
      
      // 메시지 수 추가
      if (session.messages && Array.isArray(session.messages)) {
        session.metadata.messageCount = session.messages.length;
      }
      
      return session;
    });

    // 사용자별 대화 수 계산
    let userChatCount = 0;
    if (userId) {
      userChatCount = processedSessions.filter(session => session.user_id === userId).length;
    }

    // 카테고리별 대화 수 계산 (모든 카테고리를 포함, 0개인 것도 포함)
    const categoryCounts = PREDEFINED_CATEGORIES.reduce<Record<string, number>>((acc, category) => {
      acc[category] = processedSessions.filter(session => 
        session.metadata?.mainCategory === category
      ).length;
      return acc;
    }, {});

    // "All" 카테고리 추가
    categoryCounts['All'] = processedSessions.length;
    
    // "내 대화" 카테고리 추가 (로그인한 사용자만)
    if (userId) {
      categoryCounts['내 대화'] = userChatCount;
    }

    console.log('처리 완료:', {
      totalSessions: processedSessions.length,
      userChatCount,
      categoryCounts
    });

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
    console.error('Integrations API 오류:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 