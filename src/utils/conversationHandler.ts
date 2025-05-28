import { parseChatGPTLink } from '@/lib/utils/chatgpt';
import { summarizeConversation, summarizeLongConversation } from '@/lib/utils/openai';
import { insertChatSession, processAndInsertChunks, checkUrlExists } from '@/utils/supabaseHandler';
import { saveToObsidian } from '@/utils/automation';
import { isVercelEnv } from '@/utils/fileSystemAccess';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/types';

// 환경 확인
const isVercel = process.env.VERCEL === '1' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

interface ConversationOptions {
  saveToSupabase: boolean;
  saveToObsidian: boolean;
  skipDuplicateCheck?: boolean;
}

interface SaveResult {
  success: boolean;
  id?: string;
  duplicate?: boolean;
  title?: string;
  summary?: string;
  keywords?: string[];
  obsidian?: any;
  error?: string;
  savedToObsidian?: boolean;
}

/**
 * ChatGPT 대화를 저장하는 통합 핸들러
 */
export async function saveConversation(
  url: string, 
  options: ConversationOptions = { 
    saveToSupabase: true, 
    saveToObsidian: true
  }
): Promise<SaveResult> {
  try {
    console.log(`대화 저장 시작: ${url}`);
    console.log('저장 옵션:', JSON.stringify(options));

    // URL 유효성 검사
    if (!isValidChatGPTUrl(url)) {
      throw new Error('유효한 ChatGPT 공유 URL이 아닙니다.');
    }

    // URL 중복 체크 (Supabase)
    let duplicate = false;
    let existingSession = null;

    if (options.saveToSupabase && !options.skipDuplicateCheck) {
      const { exists, session } = await checkUrlExists(url);
      duplicate = exists;
      existingSession = session;

      if (duplicate) {
        console.log(`URL 중복 감지: ${url}`);
        // 중복 URL이지만 ID와 함께 반환하여 성공 페이지로 리다이렉트할 수 있도록 함
        const savedToObsidian = existingSession?.metadata?.savedToObsidian === true;
        
        return {
          success: true,
          duplicate: true,
          id: existingSession?.id,
          title: existingSession?.title,
          savedToObsidian: savedToObsidian,
          error: '이미 저장된 대화입니다.'
        };
      }
    }

    // 크롤링 수행
    console.log('대화 크롤링 중...');
    const result = await parseChatGPTLink(url);
    const { conversation, rawText } = result;

    if (!conversation.messages || conversation.messages.length === 0) {
      throw new Error('대화 내용을 찾을 수 없습니다.');
    }

    // 요약 생성
    console.log('대화 요약 생성 중...');
    const summaryResult = conversation.messages.length > 20
      ? await summarizeLongConversation(conversation.title, conversation.messages)
      : await summarizeConversation(conversation.title, conversation.messages);

    let saveResults = {
      supabase: null as any,
      obsidian: null as any
    };

    // Supabase에 저장 (벡터 검색 DB)
    if (options.saveToSupabase) {
      console.log('Supabase에 저장 중...');
      saveResults.supabase = await insertChatSession({
        title: conversation.title,
        url,
        summary: summaryResult.summary,
        messages: conversation.messages,
        metadata: {
          model: summaryResult.modelUsed || conversation.metadata?.model || 'gpt-4',
          keywords: summaryResult.keywords || [],
          createdAt: new Date().toISOString()
        },
        skipDuplicateCheck: true
      });

      // 대화 청크 처리 및 임베딩 저장
      await processAndInsertChunks(
        saveResults.supabase.id,
        conversation.messages
      );
    }

    // Obsidian에 저장 (배포 환경에서는 비활성화)
    if (options.saveToObsidian && !isVercelEnv()) {
      console.log('Obsidian에 저장 중...');
      const isRerun = options.skipDuplicateCheck || false;
      saveResults.obsidian = await saveToObsidian(
        conversation,
        summaryResult,
        rawText,
        url,
        isRerun
      );
    } else if (options.saveToObsidian && isVercelEnv()) {
      console.log('배포 환경에서는 Obsidian 저장이 비활성화되었습니다.');
    }

    return {
      success: true,
      id: saveResults.supabase?.id,
      title: conversation.title,
      summary: summaryResult.summary,
      keywords: summaryResult.keywords,
      obsidian: saveResults.obsidian,
      duplicate: false
    };
  } catch (error) {
    console.error('대화 저장 중 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * ChatGPT 공유 URL 유효성 검사
 */
function isValidChatGPTUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === 'chat.openai.com' || 
      parsedUrl.hostname === 'chatgpt.com'
    ) && url.includes('/share/');
  } catch (e) {
    return false;
  }
} 