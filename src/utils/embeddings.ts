import OpenAI from 'openai';
import { ChatMessage } from '@/types';
import { encode, decode } from 'gpt-tokenizer';

// 서버 측에서만 OpenAI 클라이언트 초기화
let openai: OpenAI | null = null;

// 서버 측에서만 OpenAI 클라이언트 초기화
if (typeof window === 'undefined') {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    openai = null;
  }
}

// 개발 모드에서 임베딩 생성을 위한 가짜 데이터
function generateFakeEmbedding(text: string): number[] {
  // 항상 동일한 텍스트에 대해 동일한 임베딩 반환 (단순화된 해시 기반)
  const hash = Array.from(text || '').reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) % 997;
  }, 7);
  
  // 1536 차원의 임베딩 벡터 생성 (OpenAI 임베딩 차원 수와 동일)
  const embedding = Array(1536).fill(0).map((_, i) => {
    // 해시와 인덱스를 기반으로 -1과 1 사이의 값 생성
    return Math.cos((hash + i) / 100) * 0.5;
  });
  
  return embedding;
}

/**
 * 텍스트에서 유효하지 않은 문자를 제거합니다.
 * 특히 \u0000(NULL) 문자와 기타 PostgreSQL에서 문제를 일으킬 수 있는 문자를 제거합니다.
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  
  // null 문자 및 제어 문자 제거
  let sanitized = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
  
  // PostgreSQL에서 문제가 될 수 있는 특수 이스케이프 시퀀스 처리
  sanitized = sanitized.replace(/\\u0000/g, '');
  
  // 연속된 공백 제거
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  return sanitized.trim();
}

/**
 * 텍스트에 대한 임베딩 벡터를 생성합니다.
 * @param text 임베딩할 텍스트
 * @returns 임베딩 벡터
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    // 클라이언트 측에서 실행 중인 경우 가짜 임베딩 반환
    if (typeof window !== 'undefined') {
      return generateFakeEmbedding(text);
    }
    
    // 서버 측에서 실행 중이지만 OpenAI 인스턴스가 없는 경우
    if (!openai) {
      return generateFakeEmbedding(text);
    }
    
    // 텍스트 정제
    const sanitizedText = sanitizeText(text);
    
    if (!sanitizedText) {
      return Array(1536).fill(0);
    }
    
    // 텍스트가 너무 짧은 경우 (1-2글자) 처리
    if (sanitizedText.length < 3) {
      const expandedText = `질문: ${sanitizedText} 에 대한 정보를 찾습니다.`;
      
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: expandedText,
      });
      
      return response.data[0].embedding;
    }
    
    // 일반적인 경우 임베딩 생성
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: sanitizedText,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    return generateFakeEmbedding(text);
  }
}

/**
 * 토큰 제한에 맞게 텍스트를 자릅니다.
 * @param text 원본 텍스트
 * @param maxTokens 최대 토큰 수 (기본값 8000)
 * @returns 잘린 텍스트
 */
export function truncateText(text: string, maxTokens: number = 8000): string {
  const tokens = encode(text);
  
  if (tokens.length <= maxTokens) {
    return text;
  }
  
  // 수정된 부분
const truncatedTokens = tokens.slice(0, maxTokens);
return decode(truncatedTokens); // 잘못된 직접 구현 함수가 아니라 공식 함수 사용
}

/**
 * 대화 메시지를 청크로 분할합니다.
 * @param messages 메시지 배열
 * @param maxTokensPerChunk 청크당 최대 토큰 수 (기본값 500)
 * @returns 청크 배열
 */
export function chunkMessages(
  messages: ChatMessage[], 
  maxTokensPerChunk: number = 500
): {content: string; chunk_index: number}[] {
  const chunks: {content: string; chunk_index: number}[] = [];
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const messageText = `[${message.role}]: ${message.content}`;
    const messageTokens = encode(messageText).length;
    
    // 단일 메시지가 청크 제한을 초과하는 경우 (분할 필요)
    if (messageTokens > maxTokensPerChunk) {
      // 현재 축적된 청크가 있다면 먼저 저장
      if (currentTokens > 0) {
        chunks.push({
          content: currentChunk.trim(),
          chunk_index: chunkIndex++
        });
        currentChunk = '';
        currentTokens = 0;
      }
      
      // 긴 메시지를 여러 청크로 분할
      const tokens = encode(messageText);
      for (let j = 0; j < tokens.length; j += maxTokensPerChunk) {
        const chunkTokens = tokens.slice(j, j + maxTokensPerChunk);
        chunks.push({
          content: decode(chunkTokens).trim(), // 공식 decode 사용
          chunk_index: chunkIndex++
        });
      }
    } 
    // 현재 청크에 메시지를 추가할 수 있는지 확인
    else if (currentTokens + messageTokens <= maxTokensPerChunk) {
      currentChunk += (currentChunk ? '\n\n' : '') + messageText;
      currentTokens += messageTokens;
    } 
    // 새 청크 시작
    else {
      chunks.push({
        content: currentChunk.trim(),
        chunk_index: chunkIndex++
      });
      currentChunk = messageText;
      currentTokens = messageTokens;
    }
  }
  
  // 마지막 청크 추가
  if (currentTokens > 0) {
    chunks.push({
      content: currentChunk.trim(),
      chunk_index: chunkIndex
    });
  }
  
  return chunks;
}
