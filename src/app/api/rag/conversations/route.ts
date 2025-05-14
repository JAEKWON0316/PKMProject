import { NextResponse } from 'next/server';
import { parseChatGPTLink } from '@/lib/utils/chatgpt';
import { summarizeConversation, summarizeLongConversation } from '@/lib/utils/openai';
import { insertChatSession, processAndInsertChunks, checkUrlExists } from '@/utils/supabaseHandler';
import { saveToObsidian, commitToGitHub } from '@/utils/automation';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * ChatGPT 공유 URL로부터 대화를 가져와 처리하는 API 라우트
 * (1) 대화 크롤링
 * (2) GPT 요약 생성
 * (3) Obsidian에 저장
 * (4) Supabase에 저장 (임베딩 포함)
 * (5) GitHub에 변경사항 커밋/푸시
 */
export async function POST(request: Request): Promise<Response> {
  try {
    console.log('=== RAG: 대화 처리 시작 ===');
    
    const body = await request.json().catch(e => {
      console.error('요청 본문 파싱 실패:', e);
      return null;
    });
    
    if (!body || !body.url) {
      console.error('URL 누락');
      return NextResponse.json(
        { success: false, error: 'ChatGPT 공유 URL이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const { url } = body;
    console.log(`처리할 URL: "${url}"`);

    // URL 유효성 검사
    if (!isValidChatGPTUrl(url)) {
      console.error('유효하지 않은 URL 형식 또는 도메인');
      return NextResponse.json(
        { success: false, error: '유효한 ChatGPT 공유 URL이 아닙니다.' },
        { status: 400 }
      );
    }

    // 1. ChatGPT 링크 파싱 (Playwright 기반) -> Puppeteer로 변경됨
    console.log('=== Puppeteer 기반 파싱 시작 ===');
    let result;
    try {
      result = await parseChatGPTLink(url);
      console.log(`파싱된 대화: "${result.conversation.title}" (메시지 ${result.conversation.messages.length}개)`);
    } catch (error) {
      console.error('대화 파싱 오류:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : '대화 내용을 추출할 수 없습니다.' 
        },
        { status: 422 }
      );
    }

    const { conversation, rawText } = result;

    // 메시지 유효성 검사
    if (!conversation.messages || conversation.messages.length === 0) {
      console.error('대화에서 메시지를 찾을 수 없음');
      return NextResponse.json(
        { success: false, error: '대화 내용을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 각 메시지 간략히 로깅
    conversation.messages.forEach((msg, idx) => {
      console.log(`메시지 #${idx+1} (${msg.role}): ${msg.content.substring(0, 30)}... (${msg.content.length}자)`);
    });

    try {
      // 2. 고유 ID 생성
      const id = conversation.id || `${Date.now()}-${uuidv4().substring(0, 8)}`;
      
      // 3. OpenAI API로 대화 내용 요약 생성
      console.log('대화 요약 생성 중...');
      let summaryResult;
      try {
        // 메시지가 20개 초과하면 긴 대화 요약 함수 사용
        summaryResult = conversation.messages.length > 20
          ? await summarizeLongConversation(conversation.title, conversation.messages)
          : await summarizeConversation(conversation.title, conversation.messages);
          
        console.log(`요약 생성 완료 (${summaryResult.summary.length}자), 키워드: ${summaryResult.keywords.length}개`);
        console.log(`키워드: ${summaryResult.keywords.join(', ')}`);
      } catch (summaryError) {
        console.error('요약 생성 오류:', summaryError);
        summaryResult = {
          summary: '요약을 생성하는 중 오류가 발생했습니다.',
          keywords: [],
          modelUsed: 'unknown'
        };
      }
      
      // 4. URL 중복 체크 (Supabase)
      console.log('URL 중복 체크 중...');
      const { exists: urlExists, session: existingSession } = await checkUrlExists(url);
      
      if (urlExists) {
        console.log(`URL 중복 감지: ${url}`);
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: '이미 저장된 대화입니다.',
          data: {
            id: existingSession?.id,
            title: existingSession?.title || conversation.title,
            url,
            createdAt: existingSession?.created_at
          }
        });
      }
      
      // Identify file system type
      const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

      // 5. Obsidian Vault에 마크다운으로 저장
      console.log('Obsidian에 저장 중...');
      const obsidianResult = await saveToObsidian(
        conversation,
        summaryResult,
        rawText,
        url
      );
      
      // Obsidian 저장 중 중복 감지된 경우
      if (obsidianResult.duplicate) {
        console.log(`Obsidian 저장 중 중복 감지: ${url}`);
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: obsidianResult.message || '이미 저장된 대화입니다.',
          data: {
            id: existingSession?.id || `duplicate-${Date.now()}`,
            title: conversation.title,
            url
          }
        });
      }
      
      console.log(`Obsidian 저장 완료: ${obsidianResult.fileName}`);
      
      // 6. 대화 데이터 Supabase에 저장 (임베딩 포함)
      console.log('Supabase에 대화 세션 저장 중...');
      const sessionData = await insertChatSession({
        title: conversation.title,
        url,
        summary: summaryResult.summary,
        messages: conversation.messages,
        metadata: {
          model: summaryResult.modelUsed || conversation.metadata?.model || 'gpt-4',
          keywords: summaryResult.keywords || [],
          createdAt: new Date().toISOString()
        },
        skipDuplicateCheck: true // 이미 위에서 중복 체크를 했으므로 건너뜀
      });
      
      console.log(`Supabase 세션 저장 완료: ${sessionData.id}`);
      
      // 7. 대화 청크 처리 및 임베딩 저장
      console.log('대화 청크 처리 및 임베딩 저장 중...');
      const chunksResult = await processAndInsertChunks(
        sessionData.id,
        conversation.messages
      );
      console.log(`청크 처리 완료: ${chunksResult.count}개의 청크 저장됨`);
      
      // 8. GitHub에 변경사항 커밋/푸시
      console.log('GitHub에 변경사항 커밋 중...');
      try {
        await commitToGitHub(`Add: ${conversation.title} (${new Date().toISOString()})`);
        console.log('GitHub 커밋 완료');
      } catch (gitError) {
        console.error('GitHub 커밋 오류:', gitError);
        // 실패해도 진행 (나중에 수동으로 처리 가능)
      }
      
      // 성공 응답
      return NextResponse.json({
        success: true,
        message: '대화 크롤링 및 저장이 완료되었습니다.',
        data: {
          id: sessionData.id,
          title: conversation.title,
          url,
          summary: summaryResult.summary,
          keywords: summaryResult.keywords.join(','),
          rawText: encodeURIComponent(rawText),
          messages: encodeURIComponent(JSON.stringify(conversation.messages)),
          metadata: encodeURIComponent(JSON.stringify({
            model: summaryResult.modelUsed || conversation.metadata?.model || 'gpt-4',
            savedAt: new Date().toISOString()
          }))
        }
      });
    } catch (processError) {
      console.error('데이터 처리 오류:', processError);
      return NextResponse.json(
        { 
          success: false, 
          error: processError instanceof Error 
            ? processError.message 
            : '데이터 처리 중 오류가 발생했습니다.' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('대화 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '대화 처리 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

/**
 * 관련 청크를 검색하여 질문에 답변하는 API
 */
export async function PUT(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    
    if (!body.query) {
      return NextResponse.json(
        { success: false, error: '질문이 필요합니다.' },
        { status: 400 }
      );
    }
    
    const { query, similarity = 0.7, limit = 5 } = body;
    
    // 구현 예정: 유사한 청크 검색 및 LangChain/OpenAI로 응답 생성
    
    return NextResponse.json({
      success: true,
      message: '검색 기능은 아직 구현 중입니다.'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * ChatGPT URL 유효성 검사
 */
function isValidChatGPTUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // 도메인 체크
    const validDomains = ['chat.openai.com', 'chatgpt.com'];
    if (!validDomains.some(domain => parsed.hostname.includes(domain))) {
      return false;
    }
    
    // 경로 체크
    return parsed.pathname.includes('/share/') || parsed.pathname.includes('/c/');
  } catch (error) {
    return false;
  }
} 