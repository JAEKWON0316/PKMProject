import OpenAI from 'openai';
import { ChatMessage } from '@/types';

// OpenAI API 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 사용할 모델 정의
const MODEL = 'gpt-4.1-nano';

// 요약 결과 타입 정의
export interface SummaryResult {
  summary: string;
  keywords: string[];
  modelUsed: string;
}

/**
 * 대화 내용을 요약하고 키워드를 추출하는 함수
 * @param title 대화 제목
 * @param messages 대화 메시지 배열
 * @returns 요약된 내용과 키워드, 사용된 모델 정보
 */
export async function summarizeConversation(
  title: string,
  messages: ChatMessage[]
): Promise<SummaryResult> {
  try {
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? '👤 사용자' : '🤖 AI'}: ${msg.content}`)
      .join('\n\n');

    // API 요청 - 요약 및 키워드 추출
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '당신은 대화 내용을 요약하고 주요 키워드를 추출하는 assistant입니다. 요약은 3-5문장으로, 키워드는 최대 5개까지 추출해주세요. JSON 형식으로 응답해주세요.'
        },
        {
          role: 'user',
          content: `제목: "${title}"\n\n다음 대화 내용을 요약하고, 관련 키워드를 추출해주세요. JSON 형식으로 응답해야 합니다. 다음 형식으로 응답하세요: {"summary": "요약 내용...", "keywords": ["키워드1", "키워드2", ...]}:\n\n${conversationText}`
        }
      ],
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });

    // 응답 처리
    try {
      const content = response.choices[0]?.message?.content || '';
      console.log('API 응답 내용:', content);
      
      const parsedContent = JSON.parse(content);
      return {
        summary: parsedContent.summary || '요약을 생성할 수 없습니다.',
        keywords: Array.isArray(parsedContent.keywords) ? parsedContent.keywords : [],
        modelUsed: MODEL
      };
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      console.log('파싱 실패한 내용:', response.choices[0]?.message?.content);
      return {
        summary: '요약을 생성할 수 없습니다.',
        keywords: [],
        modelUsed: MODEL
      };
    }
  } catch (error: any) {
    console.error('대화 요약 중 오류 발생:', error);
    return {
      summary: '요약을 생성할 수 없습니다.',
      keywords: [],
      modelUsed: MODEL
    };
  }
}

/**
 * 긴 대화를 요약하는 함수 (토큰 제한에 걸리는 경우 사용)
 * @param title 대화 제목
 * @param messages 대화 메시지 배열
 * @returns 요약된 내용과 키워드, 사용된 모델 정보
 */
export async function summarizeLongConversation(
  title: string,
  messages: ChatMessage[]
): Promise<SummaryResult> {
  try {
    // 대화를 여러 파트로 나누기 (10개 메시지씩)
    const messageParts: ChatMessage[][] = [];
    const partSize = 10;
    
    for (let i = 0; i < messages.length; i += partSize) {
      messageParts.push(messages.slice(i, i + partSize));
    }
    
    // 각 파트별로 요약 생성
    const partSummaries: string[] = [];
    let allKeywords: string[] = [];
    
    for (let i = 0; i < messageParts.length; i++) {
      try {
        const result = await summarizeConversation(
          `${title} (파트 ${i+1}/${messageParts.length})`,
          messageParts[i]
        );
        partSummaries.push(`파트 ${i+1}: ${result.summary}`);
        
        // 키워드 수집
        if (Array.isArray(result.keywords)) {
          allKeywords = [...allKeywords, ...result.keywords];
        }
      } catch (error) {
        console.error(`파트 ${i+1} 요약 중 오류:`, error);
        partSummaries.push(`파트 ${i+1}: 요약 실패`);
      }
    }
    
    // 부분 요약들을 조합하여 최종 요약 생성
    const finalResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '여러 대화 요약을 하나의 통합된 요약으로 만들고, 가장 중요한 키워드를 5개 이내로 추출해주세요. JSON 형식으로 응답해주세요.'
        },
        {
          role: 'user',
          content: `다음은 긴 대화를 나눈 부분별 요약입니다. 이들을 결합하여 전체 대화의 핵심을 담은 통합 요약을 5문장 이내로 작성하고, 가장 중요한 키워드 5개를 추출해주세요. JSON 형식으로 응답해야 합니다. {"summary": "요약 내용...", "keywords": ["키워드1", "키워드2", ...]} 형식으로 응답하세요:\n\n${partSummaries.join('\n\n')}`
        }
      ],
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: "json_object" }
    });
    
    try {
      const content = finalResponse.choices[0]?.message?.content || '';
      console.log('최종 API 응답 내용:', content);
      
      const parsedContent = JSON.parse(content);
      return {
        summary: parsedContent.summary || '요약을 생성할 수 없습니다.',
        keywords: Array.isArray(parsedContent.keywords) ? parsedContent.keywords : allKeywords,
        modelUsed: MODEL
      };
    } catch (parseError) {
      console.error('최종 요약 JSON 파싱 오류:', parseError);
      console.log('파싱 실패한 내용:', finalResponse.choices[0]?.message?.content);
      
      // 키워드 중복 제거 및 최대 5개로 제한
      const uniqueKeywords = Array.from(new Set(allKeywords)).slice(0, 5);
      
      return {
        summary: '요약을 생성할 수 없습니다.',
        keywords: uniqueKeywords,
        modelUsed: MODEL
      };
    }
  } catch (error: any) {
    console.error('긴 대화 요약 중 오류 발생:', error);
    return {
      summary: '요약을 생성할 수 없습니다.',
      keywords: [],
      modelUsed: MODEL
    };
  }
} 