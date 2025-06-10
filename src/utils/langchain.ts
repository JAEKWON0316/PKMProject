import { OpenAI } from 'openai';
import { searchSimilarChunks, getChatSessionById } from './supabaseHandler';
import { ChatChunk, ChatSession, RagResponse, RagSource } from '@/types';

// OpenAI API 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FAQ_SESSION_ID = '1129f3aa-2e75-43a2-9cf0-6d08526cbcfb';

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
): Promise<{
  ragAnswer: RagResponse;
  fallbackAnswer?: { answer: string };
}> {
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
      /반갑/i,
      /우와/i,
      /멋지/i,
      /고마워/i,
      /대단해/i,
      /똑똑/i,
      /칭찬/i,
      /재밌/i,
      /웃겨/i,
      /귀엽/i,
      /고생/i,
      /수고/i,
      /감사/i,
      /헐/i,
      /와우/i,
      /굿/i,
      /최고/i,
      /잘했어/i,
      /잘한다/i,
      /잘하네/i,
      /잘하네요/i,
      /잘하십니다/i
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
        ragAnswer: {
          answer,
          sources: [],
          hasSourceContext: false
        },
        fallbackAnswer: undefined
      };
    }
    
    // 1. 유사한 청크 검색
    const similarChunks = await searchSimilarChunks(query, similarity, limit);
    
    console.log(`검색된 청크 수: ${similarChunks?.length || 0}`);
    
    // 유사도 기준 계산 (상위 청크의 유사도 평균)
    let avgSimilarity = 0;
    if (similarChunks && similarChunks.length > 0) {
      avgSimilarity = similarChunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / similarChunks.length;
    }
    
    // 컨텍스트가 없거나 유사도가 낮으면 fallbackAnswer도 생성
    let fallbackAnswer: { answer: string } | undefined = undefined;
    if (!similarChunks || similarChunks.length === 0 || avgSimilarity < 0.4) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-nano",
        messages: [
          { role: "system", content: "당신은 친절하고 유능한 AI 어시스턴트입니다. 사용자의 질문에 대해 최대한 정확하고 유익하게 답변하세요." },
          { role: "user", content: query }
        ],
        temperature: 0.7,
        max_tokens: 600
      });
      const answer = completion.choices[0].message.content?.trim() || "죄송합니다. 답변을 생성하지 못했습니다.";
      fallbackAnswer = { answer };
    }
    
    // 기존 RAG 답변 생성 로직 (컨텍스트가 있으면)
    if (!similarChunks || similarChunks.length === 0) {
      return {
        ragAnswer: {
          answer: "관련 정보를 찾을 수 없습니다. 내 데이터에 답이 없거나, 더 구체적인 질문을 해보세요.",
          sources: [],
          hasSourceContext: false
        },
        fallbackAnswer
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
    let sources: RagSource[] = similarChunks.map((chunk: ChatChunk) => {
      const session = sessions.find((s: ChatSession) => s.id === chunk.chat_session_id);
      return {
        id: session?.id,
        title: session?.title,
        url: session?.url,
        similarity: chunk.similarity
      };
    });
    // FAQ 세션 소스 제외
    sources = sources.filter(source => source.id !== FAQ_SESSION_ID);
    
    // 5. 프롬프트 생성
    const prompt = `\n아래 컨텍스트를 참고하여 질문에 답변하세요.\n- 컨텍스트에 명확한 답이 있으면 그 내용을 바탕으로 답변하세요.\n- 컨텍스트에 직접적인 답이 없더라도, 유사하거나 관련된 내용을 바탕으로 최대한 추론하여 답변하세요.\n- 정말로 컨텍스트에 아무런 단서도 없을 때만 \"이 정보는 제공된 컨텍스트에 없습니다.\"라고 답하세요.\n\n컨텍스트:\n${context}\n\n질문: ${query}\n\n답변:`;
    
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
      ragAnswer: {
        answer,
        summary,
        sources: sources.slice(0, 3),
        hasSourceContext: true
      },
      fallbackAnswer
    };
  } catch (error) {
    console.error('RAG 응답 생성 오류:', error);
    throw error;
  }
} 