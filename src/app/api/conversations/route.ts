import { NextResponse } from 'next/server'
import { saveConversation } from '@/utils/conversationHandler'

export async function POST(request: Request): Promise<Response> {
  try {
    console.log('=== Processing conversation request ===');
    
    // 요청 본문 파싱 부분 개선
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed:', body);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다.' },
        { status: 400 }
      );
    }
    
    if (!body || !body.url) {
      console.error('Missing URL in request body');
      return NextResponse.json(
        { success: false, error: 'ChatGPT 공유 URL이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 클라이언트에서 전달된 옵션을 명시적으로 사용
    const url = body.url;
    const options = {
      saveToSupabase: body.options?.saveToSupabase !== undefined ? body.options.saveToSupabase : true,
      saveToObsidian: body.options?.saveToObsidian !== undefined ? body.options.saveToObsidian : false,
      saveAsJson: body.options?.saveAsJson !== undefined ? body.options.saveAsJson : false,
      skipDuplicateCheck: body.options?.skipDuplicateCheck || false
    };
    
    console.log(`Processing URL: "${url}"`);
    console.log(`Save options (explicit):`, options);

    // 통합 저장 핸들러 호출
    try {
      const result = await saveConversation(url, options);
      
      if (!result.success) {
        console.error('Conversation handler returned error:', result.error);
        return NextResponse.json(
          { success: false, error: result.error || '대화 처리 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }
      
      // 중복 URL 처리
      if (result.duplicate) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: '이미 저장된 대화입니다.',
          data: {
            id: result.id,
            title: result.title,
            url
          }
        });
      }
      
      // 성공 응답
      return NextResponse.json({
        success: true,
        data: {
          conversation: {
            id: result.id,
            title: result.title
          },
          summary: result.summary,
          keywords: result.keywords,
          obsidian: result.obsidian,
          jsonBackup: result.jsonBackup
        }
      });
    } catch (handlerError) {
      console.error('Error in saveConversation handler:', handlerError);
      return NextResponse.json(
        { 
          success: false, 
          error: handlerError instanceof Error ? handlerError.message : '대화 처리 중 오류가 발생했습니다.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // 전체 프로세스에 대한 최종 에러 핸들링
    console.error('Critical error processing conversation:', error);
    
    // 스택 트레이스 포함 (개발 환경에서만)
    const errorDetails = {
      success: false, 
      error: error instanceof Error ? error.message : '대화 처리 중 오류가 발생했습니다.',
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
      // @ts-ignore - 타입 에러 무시
      errorDetails.stack = error instanceof Error ? error.stack : undefined;
    }
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}