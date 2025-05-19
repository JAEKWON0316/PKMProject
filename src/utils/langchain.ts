import { OpenAI } from 'openai';
import { searchSimilarChunks, getChatSessionById } from './supabaseHandler';
import { ChatChunk, ChatSession, RagResponse, RagSource } from '@/types';

// OpenAI API 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 질문에 대한 RAG 기반 응답을 생성합니다.
 * @param query 사용자 질문
 * @param similarity 유사도 임계값 (0.0 ~ 1.0)
 * @param limit 검색할 최대 청크 수
 * @returns 응답 객체
 */
export async function generateRagResponse(
  query: string,
  similarity: number = 0.3,
  limit: number = 10
): Promise<RagResponse> {
  try {
    console.log(`RAG 검색 시작 - 쿼리: "${query}", 유사도 임계값: ${similarity}, 제한: ${limit}`);
    
    // 일반 대화 패턴 확인
    const conversationalPatterns = [
      /안녕/i,
      /반가워/i,
      /넌\s*누구/i,
      /네\s*이름/i,
      /뭐\s*하/i,
      /기분\s*어때/i,
      /잘\s*지냈/i,
      /뭐\s*해/i,
      /자기소개/i,
      /소개\s*해/i,
      /반갑/i
    ];
    
    const isConversational = conversationalPatterns.some(pattern => pattern.test(query));
    
    if (isConversational) {
      console.log('일반 대화형 질문으로 판단됨, 컨텍스트 검색 없이 응답');
      
      // 일반 대화형 질문에 대한 응답 생성
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          { 
            role: "system", 
            content: "당신은 친절하고 도움이 되는 AI 지식 도우미입니다. 사용자가 일반적인 인사나 대화를 할 때는 간단히 응답하고, 질문이 있으면 저장된 대화 내용을 검색해 답변할 수 있다고 안내해주세요."
          },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 300
      });
      
      const answer = completion.choices[0].message.content?.trim() || "답변을 생성할 수 없습니다.";
      
      return {
        answer,
        sources: [],
        hasSourceContext: false
      };
    }
    
    // 1. 유사한 청크 검색
    const similarChunks = await searchSimilarChunks(query, similarity, limit);
    
    console.log(`검색된 청크 수: ${similarChunks?.length || 0}`);
    
    if (!similarChunks || similarChunks.length === 0) {
      console.log('관련 청크를 찾을 수 없음');
      
      // 메타 질문인지 확인 (supabaseHandler.ts에서도 체크하지만 여기서도 체크)
      const metaQuestionPatterns = [
        /이\s*대화의?\s*(핵심|요약|내용|주제)/i,
        /대화를?\s*(요약|정리)/i,
        /요약해\s*줘/i,
        /핵심\s*(내용|포인트)/i,
        /주요\s*(내용|포인트)/i
      ];
      
      const isMetaQuestion = metaQuestionPatterns.some(pattern => pattern.test(query));
      
      if (isMetaQuestion) {
        // 메타 질문에 대한 응답
        return {
          answer: "현재 저장된 대화의 요약 정보를 찾을 수 없습니다. 먼저 대화를 저장해주세요.",
          sources: [],
          hasSourceContext: false
        };
      }
      
      // 일반 질문에 대한 응답
      return {
        answer: "관련 정보를 찾을 수 없습니다. 다른 질문을 시도하거나, 더 구체적인 질문을 해보세요. 현재 데이터베이스에 저장된 정보가 제한적일 수 있습니다.",
        sources: [],
        hasSourceContext: false
      };
    }
    
    // 청크 유사도 로깅
    similarChunks.forEach((chunk, i) => {
      console.log(`청크 ${i+1}: 유사도 ${chunk.similarity?.toFixed(4) || 'N/A'}, 세션 ID: ${chunk.chat_session_id}`);
    });
    
    // 2. 세션 정보 조회 - 타입 명시적 캐스팅 추가
    const sessionIds: string[] = Array.from(
      new Set(similarChunks.map((chunk: ChatChunk) => chunk.chat_session_id))
    );
    
    const sessionPromises = sessionIds.map(id => getChatSessionById(id));
    const sessions = await Promise.all(sessionPromises);
    
    // 3. 컨텍스트 생성
    const context = similarChunks.map((chunk: ChatChunk, i: number) => {
      const session = sessions.find((s: ChatSession) => s.id === chunk.chat_session_id);
      return `[출처 ${i+1}: ${session?.title || '알 수 없음'}]\n${chunk.content}\n`;
    }).join('\n');
    
    // 4. 출처 정보 생성
    const sources: RagSource[] = similarChunks.map((chunk: ChatChunk) => {
      const session = sessions.find((s: ChatSession) => s.id === chunk.chat_session_id);
      return {
        id: session?.id,
        title: session?.title,
        url: session?.url,
        similarity: chunk.similarity
      };
    });
    
    // 5. 프롬프트 생성
    const prompt = `
당신은 사용자의 질문에 대한 답변을 생성하는 지식 도우미입니다.
아래 제공된 컨텍스트를 참고하여 질문에 대한 정확하고 상세한 답변을 제공해주세요.
답변은 컨텍스트에 제공된 내용만을 토대로 해야 합니다.
알 수 없거나 컨텍스트에 없는 정보에 대해서는 "이 정보는 제공된 컨텍스트에 없습니다."라고 답해주세요.

컨텍스트:
${context}

질문: ${query}

답변:`;
    
    // 6. OpenAI API로 응답 생성
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: "당신은 정확하고 도움이 되는 질의응답 지식 도우미입니다." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1000
    });
    
    const answer = completion.choices[0].message.content?.trim() || "응답을 생성할 수 없습니다.";
    
    // 요약 생성
    const summaryCompletion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        { role: "system", content: "당신은 텍스트를 한 문장으로 요약하는 전문가입니다." },
        { role: "user", content: `다음 텍스트를 한 문장으로 간결하게 요약해주세요: "${answer}"` }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    const summary = summaryCompletion.choices[0].message.content?.trim() || "요약을 생성할 수 없습니다.";
    
    return {
      answer,
      summary,
      sources: sources.slice(0, 3), // 상위 3개 출처만 반환
      hasSourceContext: true
    };
  } catch (error) {
    console.error('RAG 응답 생성 오류:', error);
    throw error;
  }
} 