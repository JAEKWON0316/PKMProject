import { supabaseAdmin } from '@/lib/supabase';
import { ChatMessage, ChatChunk, ChatSession } from '@/types';
import { getEmbedding, chunkMessages } from './embeddings';

// Supabase 클라이언트 재사용
export const supabase = supabaseAdmin;

/**
 * JSON 데이터를 안전하게 처리합니다.
 * PostgreSQL에 저장하기 전 유효하지 않은 문자나 구조를 제거합니다.
 */
function sanitizeJsonData(data: any): any {
  if (!data) return null;
  
  if (typeof data === 'string') {
    // 문자열에서 제어 문자 제거 및 유니코드 문자 처리 개선
    return data
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')  // 제어 문자 제거
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, match => match) // 올바른 유니코드 이모지 유지
      .replace(/\uFFFD/g, '') // 대체 문자 제거
      .replace(/\s+/g, ' ') // 연속된 공백 제거
      .trim();
  }
  
  if (Array.isArray(data)) {
    // 배열의 각 항목 정제
    return data.map(item => sanitizeJsonData(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    // 객체의 각 필드 정제
    const sanitized: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeJsonData(data[key]);
      }
    }
    return sanitized;
  }
  
  // 기본 자료형은 그대로 반환
  return data;
}

/**
 * URL이 이미 저장되어 있는지 확인합니다.
 * @param url 확인할 URL
 * @returns 중복 여부와 기존 세션 정보
 */
export async function checkUrlExists(url: string): Promise<{ exists: boolean; session?: Partial<ChatSession> }> {
  try {
    // URL 정규화 (쿼리 파라미터 등 제거)
    const normalizedUrl = new URL(url).origin + new URL(url).pathname;
    
    // 정규화된 URL로 시작하는 세션 검색
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('id, title, url, summary, created_at')
      .ilike('url', `${normalizedUrl}%`)
      .limit(1);
    
    if (error) {
      console.error('URL 중복 확인 중 오류:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      return { exists: true, session: data[0] };
    }
    
    return { exists: false };
  } catch (error) {
    console.error('URL 중복 확인 중 오류:', error);
    // 오류 발생 시 안전하게 중복이 아닌 것으로 처리
    return { exists: false };
  }
}

/**
 * 대화 세션을 Supabase에 저장합니다.
 */
export async function insertChatSession({
  title,
  url,
  summary,
  messages,
  metadata = {},
  skipDuplicateCheck = false
}: {
  title: string;
  url: string;
  summary: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
  skipDuplicateCheck?: boolean;
}) {
  try {
    // URL 중복 확인 (skipDuplicateCheck가 false일 때만)
    if (!skipDuplicateCheck && url) {
      const { exists, session } = await checkUrlExists(url);
      
      if (exists) {
        console.log(`URL이 이미 존재합니다: ${url}`);
        console.log(`기존 세션 정보: ${session?.title} (${session?.id})`);
        return { 
          id: session?.id, 
          duplicate: true, 
          message: '이미 저장된 대화입니다.' 
        };
      }
    }
    
    // 데이터 정제
    const sanitizedTitle = sanitizeJsonData(title);
    const sanitizedSummary = sanitizeJsonData(summary);
    const sanitizedMessages = sanitizeJsonData(messages);
    const sanitizedMetadata = sanitizeJsonData(metadata);
    
    // 요약 텍스트 임베딩 생성
    const embedding = await getEmbedding(sanitizedSummary);
    
    // 세션 데이터 삽입
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        title: sanitizedTitle,
        url,
        summary: sanitizedSummary,
        messages: sanitizedMessages,
        metadata: sanitizedMetadata,
        embedding
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    return { ...data, duplicate: false };
  } catch (error) {
    console.error('대화 세션 저장 중 오류:', error);
    throw error;
  }
}

/**
 * 대화 청크를 생성하고 Supabase에 저장합니다.
 */
export async function processAndInsertChunks(
  sessionId: string,
  messages: ChatMessage[]
) {
  try {
    // 메시지 정제
    const sanitizedMessages = sanitizeJsonData(messages);
    
    // 메시지를 청크로 분할
    const chunks = chunkMessages(sanitizedMessages);
    console.log('🧱 분할된 청크:', chunks);
    
    // 각 청크에 대해 임베딩 생성 및 저장
    const chunkPromises = chunks.map(async (chunk) => {
      // 청크 내용 정제
      const sanitizedContent = sanitizeJsonData(chunk.content);
      const embedding = await getEmbedding(sanitizedContent);
      
      return {
        chat_session_id: sessionId,
        chunk_index: chunk.chunk_index,
        content: sanitizedContent,
        embedding
      };
    });
    
    // 모든 청크 임베딩 처리 완료 대기
    const chunksWithEmbeddings = await Promise.all(chunkPromises);
    
    // 청크 데이터 삽입 (최대 1MB 제한으로 청크 10개씩 배치 처리)
    const batchSize = 10;
    const results = [];
    
    for (let i = 0; i < chunksWithEmbeddings.length; i += batchSize) {
      const batch = chunksWithEmbeddings.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('chat_chunks')
          .insert(batch);
        
        if (error) throw error;
        results.push(data);
      } catch (error) {
        console.error(`청크 배치 ${i}/${chunksWithEmbeddings.length} 저장 중 오류:`, error);
        // 개별 청크 에러를 기록하되 전체 프로세스는 계속 진행
      }
    }
    
    return { success: true, count: chunksWithEmbeddings.length };
  } catch (error) {
    console.error('청크 처리 및 저장 중 오류:', error);
    throw error;
  }
}

/**
 * 유사한 청크를 검색합니다.
 */
export async function searchSimilarChunks(
  query: string,
  similarity: number = 0.3,  // 기본값 0.5에서 0.3으로 더 낮춤
  limit: number = 10
): Promise<ChatChunk[]> {
  try {
    // 메타 질문 감지 (예: "이 대화의 핵심이 뭐야?", "요약해줘" 등)
    const metaQuestionPatterns = [
      /이\s*대화의?\s*(핵심|요약|내용|주제)/i,
      /대화를?\s*(요약|정리)/i,
      /요약해\s*줘/i,
      /핵심\s*(내용|포인트)/i,
      /주요\s*(내용|포인트)/i
    ];
    
    const isMetaQuestion = metaQuestionPatterns.some(pattern => pattern.test(query));
    
    if (isMetaQuestion) {
      console.log('메타 질문 감지됨, 모든 세션의 요약 정보를 검색합니다.');
      // 메타 질문인 경우 가장 최근 세션의 요약 정보를 가져오기
      const { data: sessionData, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, title, summary')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (sessionError || !sessionData || sessionData.length === 0) {
        console.warn('세션 데이터를 찾을 수 없습니다.');
        return [];
      }
      
      // 세션의 요약 정보를 청크로 변환하여 반환
      const session = sessionData[0];
      const fakeChunk: ChatChunk = {
        id: 'meta-question-chunk',
        chat_session_id: session.id,
        chunk_index: 0,
        content: `[요약]: ${session.summary}`,
        similarity: 1.0
      };
      
      return [fakeChunk];
    }
    
    console.log(`검색 쿼리: "${query}", 유사도 임계값: ${similarity}, 제한: ${limit}`);
    
    // 쿼리 텍스트 정제
    const sanitizedQuery = sanitizeJsonData(query);
    console.log(`정제된 쿼리: "${sanitizedQuery}"`);
    
    if (!sanitizedQuery || sanitizedQuery.trim().length < 2) {
      console.warn('쿼리가 너무 짧거나 비어 있습니다');
      return [];
    }
    
    // 쿼리 텍스트 임베딩 생성
    const queryEmbedding = await getEmbedding(sanitizedQuery);
    console.log(`임베딩 생성 완료: ${queryEmbedding.length} 차원`);
    
    // 유사한 청크 검색
    const { data, error } = await supabase.rpc(
      'match_chunks',
      {
        query_embedding: queryEmbedding,
        match_threshold: similarity,
        match_count: limit
      }
    );
    
    if (error) {
      console.error('유사 청크 검색 오류:', error);
      throw error;
    }
    
    console.log(`검색된 청크 수: ${data?.length || 0}`);
    
    // 검색 결과가 없는 경우 유사도 임계값을 낮춰서 다시 시도 (2단계로 낮춤)
    if (!data || data.length === 0) {
      // 첫 번째 재시도: 임계값을 50% 낮춤
      const lowerThreshold = similarity * 0.5;
      console.log(`결과가 없어 유사도 임계값을 ${lowerThreshold.toFixed(2)}로 낮춰 재시도`);
      
      const { data: retryData, error: retryError } = await supabase.rpc(
        'match_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: lowerThreshold,
          match_count: limit
        }
      );
      
      if (retryError) {
        console.error('낮은 임계값으로 재시도 중 오류:', retryError);
      } else if (retryData && retryData.length > 0) {
        console.log(`낮은 임계값으로 ${retryData.length}개 청크 검색됨`);
        return retryData;
      } else {
        // 두 번째 재시도: 매우 낮은 임계값 (0.1)으로 시도
        const lowestThreshold = 0.1;
        console.log(`결과가 여전히 없어 최저 임계값 ${lowestThreshold.toFixed(2)}로 재시도`);
        
        const { data: lastRetryData, error: lastRetryError } = await supabase.rpc(
          'match_chunks',
          {
            query_embedding: queryEmbedding,
            match_threshold: lowestThreshold,
            match_count: limit
          }
        );
        
        if (lastRetryError) {
          console.error('최저 임계값으로 재시도 중 오류:', lastRetryError);
        } else if (lastRetryData && lastRetryData.length > 0) {
          console.log(`최저 임계값으로 ${lastRetryData.length}개 청크 검색됨`);
          return lastRetryData;
        }
      }
    }
    
    return data || [];
  } catch (error) {
    console.error('유사 청크 검색 중 오류:', error);
    throw error;
  }
}

/**
 * 세션 ID로 대화 세션을 조회합니다.
 */
export async function getChatSessionById(id: string): Promise<ChatSession> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) throw error;
  
  return data;
}

/**
 * 모든 대화 세션을 조회합니다.
 * 요약 정보만 반환합니다 (전체 메시지는 제외).
 */
export async function getAllChatSessions(): Promise<Partial<ChatSession>[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, url, summary, created_at, metadata')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return data;
}

/**
 * 대화 세션의 모든 청크를 가져옵니다.
 */
export async function getChunksBySessionId(sessionId: string): Promise<ChatChunk[]> {
  const { data, error } = await supabase
    .from('chat_chunks')
    .select('*')
    .eq('chat_session_id', sessionId)
    .order('chunk_index', { ascending: true });
    
  if (error) throw error;
  
  return data;
}

/**
 * 키워드로 대화 세션을 검색합니다.
 */
export async function searchChatSessions(keyword: string): Promise<Partial<ChatSession>[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, url, summary, created_at, metadata')
    .or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return data;
} 