import { NextResponse } from 'next/server';
import { generateRagResponse } from '@/utils/langchain';

/**
 * RAG 기반 질의응답 API
 * 사용자 질문을 받아 관련 컨텍스트를 검색하고 응답을 생성합니다.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(e => {
      console.error('요청 본문 파싱 실패:', e);
      return null;
    });
    
    if (!body || !body.query) {
      return NextResponse.json(
        { success: false, error: '질문이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const { query, similarity = 0.7, limit = 5 } = body;
    
    // RAG 응답 생성
    try {
      const response = await generateRagResponse(query, similarity, limit);
      
      return NextResponse.json({
        success: true,
        data: response
      });
    } catch (ragError) {
      console.error('RAG 응답 생성 오류:', ragError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: ragError instanceof Error ? ragError.message : '응답을 생성할 수 없습니다.' 
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error('질의 처리 오류:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 