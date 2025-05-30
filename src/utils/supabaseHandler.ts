import { getSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { ChatMessage, ChatChunk, ChatSession } from '@/types';
import { getEmbedding, chunkMessages } from './embeddings';
import { SupabaseClient } from '@supabase/supabase-js';
import { classifySessionCategory } from './categoryClassifier';
import { createClient } from '@supabase/supabase-js';

// 싱글톤 클라이언트 인스턴스
let supabaseInstance: SupabaseClient | null = null;

// 일반 클라이언트 (RLS 적용) - 싱글톤 패턴
function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase 환경 변수가 설정되지 않았습니다.');
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
  }
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
}

// RAG 검색용 클라이언트 (Admin 권한으로 공개 데이터 접근)
function getSupabaseForRag(): SupabaseClient {
  // 서버 사이드에서는 Admin 클라이언트 사용
  if (typeof window === 'undefined') {
    const adminClient = getSupabaseAdmin();
    if (adminClient) {
      return adminClient;
    }
  }
  
  // 클라이언트 사이드에서는 일반 클라이언트 사용
  return getSupabase();
}

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
    const { data, error } = await getSupabase()
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
  skipDuplicateCheck = false,
  userId = null
}: {
  title: string;
  url: string;
  summary: string;
  messages: ChatMessage[];
  metadata?: Record<string, any>;
  skipDuplicateCheck?: boolean;
  userId?: string | null;
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
    let sanitizedMetadata = sanitizeJsonData(metadata);
    
    // AI 기반 카테고리 자동 분류 시도 (서버 측에서만)
    if (typeof window === 'undefined') {
      try {
        console.log('대화 세션 카테고리 자동 분류 시도 중...');
        
        // 분류할 세션 객체 준비
        const sessionToClassify: Partial<ChatSession> = {
          title: sanitizedTitle,
          summary: sanitizedSummary,
          messages: sanitizedMessages,
          metadata: sanitizedMetadata
        };
        
        // 자동 카테고리 분류 실행
        const category = await classifySessionCategory(sessionToClassify);
        console.log(`카테고리 분류 결과: ${category}`);
        
        // 기존 메타데이터에 카테고리 추가
        sanitizedMetadata = {
          ...sanitizedMetadata,
          mainCategory: category
        };
      } catch (classifyError) {
        console.error('카테고리 자동 분류 중 오류:', classifyError);
        // 오류 시 기본 카테고리 설정
        if (!sanitizedMetadata.mainCategory) {
          sanitizedMetadata.mainCategory = '기타';
        }
      }
    } else {
      // 클라이언트 측에서는 메타데이터에 기본 카테고리 설정
      if (!sanitizedMetadata.mainCategory) {
        sanitizedMetadata.mainCategory = '기타';
      }
    }
    
    // 요약 텍스트 임베딩 생성
    const embedding = await getEmbedding(sanitizedSummary);
    
    // 세션 데이터 삽입 (user_id 포함)
    const { data, error } = await getSupabase()
      .from('chat_sessions')
      .insert({
        title: sanitizedTitle,
        url,
        summary: sanitizedSummary,
        messages: sanitizedMessages,
        metadata: sanitizedMetadata,
        embedding,
        user_id: userId // 로그인한 사용자 ID 저장 (null이면 공개 대화)
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
        const { data, error } = await getSupabase()
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
      const { data: sessionData, error: sessionError } = await getSupabase()
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
    
    // 유사한 청크 검색 (일반 클라이언트 사용 - 모든 데이터 접근 가능)
    const { data, error } = await getSupabase().rpc(
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
      
      const { data: retryData, error: retryError } = await getSupabase().rpc(
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
        
        const { data: lastRetryData, error: lastRetryError } = await getSupabase().rpc(
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
  const { data, error } = await getSupabase()
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
  try {
    const { data, error } = await getSupabase()
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('채팅 세션 가져오기 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getAllChatSessions 오류:', error);
    return [];
  }
}

/**
 * 특정 사용자의 대화 세션만 조회합니다.
 */
export async function getUserChatSessions(userId: string): Promise<Partial<ChatSession>[]> {
  try {
    const { data, error } = await getSupabase()
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('사용자 채팅 세션 가져오기 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getUserChatSessions 오류:', error);
    return [];
  }
}

/**
 * 대화 세션의 모든 청크를 가져옵니다.
 */
export async function getChunksBySessionId(sessionId: string): Promise<ChatChunk[]> {
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
    .from('chat_sessions')
    .select('id, title, url, summary, created_at, metadata, user_id')
    .or(`title.ilike.%${keyword}%,summary.ilike.%${keyword}%`)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  return data;
}

/**
 * 모든 대화 세션과 사용자별 대화 수를 함께 가져옵니다.
 * @param currentUserId 현재 로그인한 사용자 ID (없으면 null)
 * @returns 모든 대화 세션과 사용자별 대화 수
 */
export async function getAllChatSessionsWithUserCount(currentUserId: string | null = null): Promise<{
  sessions: Partial<ChatSession>[];
  userChatCount: number;
}> {
  try {
    // 모든 대화 세션 가져오기
    const { data: sessions, error: sessionsError } = await getSupabase()
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('채팅 세션 가져오기 오류:', sessionsError);
      return { sessions: [], userChatCount: 0 };
    }

    // 현재 사용자의 대화 수 계산
    let userChatCount = 0;
    if (currentUserId && sessions) {
      userChatCount = sessions.filter(session => session.user_id === currentUserId).length;
    }

    return {
      sessions: sessions || [],
      userChatCount
    };
  } catch (error) {
    console.error('getAllChatSessionsWithUserCount 오류:', error);
    return { sessions: [], userChatCount: 0 };
  }
}

/**
 * 대화 세션을 경량화하여 빠르게 가져옵니다 (메시지 제외)
 * 초기 로딩용으로 최적화됨
 */
export async function getAllChatSessionsLightweight(currentUserId: string | null = null): Promise<{
  sessions: Partial<ChatSession>[];
  userChatCount: number;
  categoryCounts: Record<string, number>;
}> {
  try {
    console.log('경량 세션 데이터 조회 시작...');
    const startTime = Date.now();

    // 메시지를 제외한 필수 필드만 선택하여 속도 향상
    const { data: sessions, error: sessionsError } = await getSupabase()
      .from('chat_sessions')
      .select('id, title, url, summary, metadata, created_at, user_id, messages')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('경량 채팅 세션 가져오기 오류:', sessionsError);
      return { sessions: [], userChatCount: 0, categoryCounts: {} };
    }

    const sessionsData = sessions || [];
    
    // 각 세션의 메시지 개수 계산 (클라이언트에서 직접 계산)
    const sessionWithMessageCounts = sessionsData.map((session) => {
      let messageCount = 0;
      
      try {
        // messages가 배열인지 확인하고 개수 계산
        if (Array.isArray(session.messages)) {
          messageCount = session.messages.length;
        } else if (session.messages && typeof session.messages === 'object') {
          // messages가 객체인 경우 키의 개수 또는 다른 로직 적용
          messageCount = Object.keys(session.messages).length;
        }
      } catch (err) {
        console.warn(`세션 ${session.id}의 메시지 개수 계산 오류:`, err);
        messageCount = 0;
      }

      // messages 필드를 제거하고 messageCount를 메타데이터에 추가
      const { messages: _, ...sessionWithoutMessages } = session;
      
      return {
        ...sessionWithoutMessages,
        metadata: {
          ...session.metadata,
          messageCount
        }
      };
    });

    // 사용자 대화 수 계산
    let userChatCount = 0;
    if (currentUserId) {
      userChatCount = sessionWithMessageCounts.filter(session => session.user_id === currentUserId).length;
    }

    // 기본 카테고리 분류 (이미 저장된 메타데이터 활용)
    const categoryCounts: Record<string, number> = {
      'All': sessionWithMessageCounts.length
    };

    if (currentUserId) {
      categoryCounts['내 대화'] = userChatCount;
    }

    // 기존 카테고리 정보 활용 (복잡한 정규식 연산 회피)
    const categoryMap = new Map<string, number>();
    
    sessionWithMessageCounts.forEach(session => {
      const category = session.metadata?.mainCategory || '기타';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // 카테고리 카운트 통합
    categoryMap.forEach((count, category) => {
      categoryCounts[category] = count;
    });

    // 빈 카테고리들도 0으로 설정 (UI 일관성)
    const predefinedCategories = ['개발', '학습', '업무', '창작', '취미', '생활', '건강', '여행', '경제', '기술', '기타'];
    predefinedCategories.forEach(category => {
      if (!(category in categoryCounts)) {
        categoryCounts[category] = 0;
      }
    });

    const endTime = Date.now();
    console.log(`경량 세션 데이터 조회 완료: ${endTime - startTime}ms, 세션 수: ${sessionWithMessageCounts.length}`);

    return {
      sessions: sessionWithMessageCounts,
      userChatCount,
      categoryCounts
    };
  } catch (error) {
    console.error('getAllChatSessionsLightweight 오류:', error);
    return { sessions: [], userChatCount: 0, categoryCounts: {} };
  }
}

/**
 * 세션들의 카테고리를 백그라운드에서 개선합니다
 * 사용자가 이미 데이터를 보고 있는 동안 실행됨
 */
export async function enhanceSessionCategories(sessionIds: string[]): Promise<{
  enhanced: number;
  errors: number;
}> {
  try {
    console.log(`${sessionIds.length}개 세션의 카테고리 개선 시작...`);
    
    let enhanced = 0;
    let errors = 0;
    
    // 배치로 처리 (한 번에 너무 많이 처리하지 않음)
    const batchSize = 10;
    for (let i = 0; i < sessionIds.length; i += batchSize) {
      const batch = sessionIds.slice(i, i + batchSize);
      
      try {
        // 배치별로 세션 정보 가져오기
        const { data: sessions, error } = await getSupabase()
          .from('chat_sessions')
          .select('id, title, summary, metadata')
          .in('id', batch);
          
        if (error) throw error;
        
        // 카테고리 개선이 필요한 세션들 처리
        for (const session of sessions || []) {
          if (!session.metadata?.mainCategory || session.metadata.mainCategory === '기타') {
            try {
              // 간단한 키워드 기반 분류
              const improvedCategory = await improveSessionCategory(session);
              
              if (improvedCategory !== session.metadata?.mainCategory) {
                // 개선된 카테고리로 업데이트
                const { error: updateError } = await getSupabase()
                  .from('chat_sessions')
                  .update({
                    metadata: {
                      ...session.metadata,
                      mainCategory: improvedCategory,
                      enhancedAt: new Date().toISOString()
                    }
                  })
                  .eq('id', session.id);
                  
                if (updateError) throw updateError;
                enhanced++;
              }
            } catch (err) {
              console.error(`세션 ${session.id} 카테고리 개선 실패:`, err);
              errors++;
            }
          }
        }
      } catch (batchError) {
        console.error(`배치 ${i}-${i + batchSize} 처리 실패:`, batchError);
        errors += batch.length;
      }
      
      // 배치 간 짧은 대기 (DB 부하 방지)
      if (i + batchSize < sessionIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`카테고리 개선 완료: ${enhanced}개 개선, ${errors}개 오류`);
    return { enhanced, errors };
  } catch (error) {
    console.error('enhanceSessionCategories 오류:', error);
    return { enhanced: 0, errors: sessionIds.length };
  }
}

/**
 * 단일 세션의 카테고리를 개선합니다
 */
async function improveSessionCategory(session: any): Promise<string> {
  const content = `${session.title || ''} ${session.summary || ''}`.toLowerCase();
  
  // 효율적인 키워드 매칭 (정규식 최소화)
  const categoryKeywords = {
    '개발': ['코딩', '개발', '프로그래밍', 'javascript', 'python', 'react', 'api', '서버'],
    '학습': ['학습', '공부', '교육', '강의', '수업', '과제'],
    '업무': ['비즈니스', '업무', '회의', '프로젝트', '기획', '보고서'],
    '창작': ['디자인', '창작', '콘텐츠', '예술', '작성'],
    '취미': ['게임', '영화', '취미', '독서', '여가'],
    '생활': ['요리', '쇼핑', '일상', '집안'],
    '건강': ['운동', '건강', '다이어트', '의료'],
    '여행': ['여행', '관광', '휴가', '숙소'],
    '경제': ['금융', '투자', '주식', '경제'],
    '기술': ['ai', '인공지능', '블록체인', 'iot']
  };
  
  // 가장 많이 매칭되는 카테고리 찾기
  let bestCategory = '기타';
  let maxMatches = 0;
  
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const matches = keywords.filter(keyword => content.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestCategory = category;
    }
  });
  
  return bestCategory;
} 