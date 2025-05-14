import { NextResponse } from 'next/server'
import { saveConversation } from '@/utils/conversationHandler'

export async function POST(request: Request): Promise<Response> {
  try {
    console.log('=== Processing conversation request ===');
    
    const body = await request.json().catch(e => {
      console.error('Failed to parse request body:', e);
      return null;
    });
    
    if (!body || !body.url) {
      console.error('Missing URL in request body');
      return NextResponse.json(
        { success: false, error: 'ChatGPT 공유 URL이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const { url, options = { 
      saveToSupabase: true, 
      saveToObsidian: true, 
      saveAsJson: true 
    } } = body;
    
    console.log(`Processing URL: "${url}"`);
    console.log(`Save options:`, options);

    // 통합 저장 핸들러 호출
    const result = await saveConversation(url, options);
    
    if (!result.success) {
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
  } catch (error) {
    console.error('Error processing conversation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '대화 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}