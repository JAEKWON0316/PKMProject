import OpenAI from 'openai';
import { ChatSession } from '@/types';

// 카테고리 정의
export const PREDEFINED_CATEGORIES = [
  "개발", // 프로그래밍, 코딩, 개발 도구, 기술 구현
  "창작", // 글쓰기, 디자인, 예술, 창작물
  "학습", // 공부, 교육, 학교, 강의
  "업무", // 업무 프로세스, 비즈니스, 회의, 협업
  "취미", // 게임, 영화, 음악, 독서, 여가 활동
  "생활", // 일상생활, 가정, 요리, 쇼핑
  "건강", // 운동, 식단, 건강관리, 의료
  "여행", // 여행 계획, 관광, 휴가
  "경제", // 금융, 투자, 경제 동향, 재테크
  "기술", // IT 트렌드, 신기술, 기기, 도구
  "기타"  // 위 카테고리에 속하지 않는 경우
];

// OpenAI 클라이언트 초기화 (서버 측에서만)
let openai: OpenAI | null = null;

if (typeof window === 'undefined') {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } catch (error) {
    openai = null;
  }
}

/**
 * OpenAI API를 사용하여 대화 세션의 카테고리를 자동으로 분류합니다.
 * @param session 분류할 대화 세션
 * @returns 분류된 카테고리
 */
export async function classifySessionCategory(session: Partial<ChatSession>): Promise<string> {
  try {
    // 클라이언트 측에서 실행 중인 경우 기본 카테고리 반환
    if (typeof window !== 'undefined') {
      return "기타";
    }
    
    // OpenAI 클라이언트가 초기화되지 않은 경우
    if (!openai) {
      return "기타";
    }
    
    // 분석할 콘텐츠 준비
    const content = prepareContentForClassification(session);
    
    // 카테고리 설명을 상세하게 제공
    const categoryDescriptions = getCategoryDescriptions();
    
    // OpenAI API 호출 (gpt-4.1-nano 모델 사용)
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano", // gpt-4.1-nano 모델 사용
      messages: [
        {
          role: "system",
          content: `당신은 대화 내용을 분석하여 가장 적합한 카테고리를 선택하는 전문가입니다. 
          다음 카테고리 중 하나만 선택하세요:
          
          ${categoryDescriptions}
          
          반드시 위 카테고리 중 하나만 답변으로 제시하세요. 추가 설명이나 다른 텍스트는 포함하지 마세요.`
        },
        { 
          role: "user", 
          content: content 
        }
      ],
      temperature: 0.3, // 일관된 결과를 위해 낮은 temperature 설정
      max_tokens: 10 // 짧은 응답 (카테고리명만 필요)
    });

    // 응답에서 카테고리 추출
    const suggestedCategory = response.choices[0].message.content?.trim() || "";
    
    // 카테고리 검증 및 반환
    return validateCategory(suggestedCategory);
  } catch (error) {
    return "기타"; // 오류 발생 시 기본 카테고리
  }
}

/**
 * 대화 내용을 분석용으로 준비합니다.
 */
function prepareContentForClassification(session: Partial<ChatSession>): string {
  // 제목과 요약
  const title = session.title || '';
  const summary = session.summary || '';
  
  // 메시지 내용 (처음 10개 메시지만)
  const messageContent = session.messages 
    ? session.messages.slice(0, 10).map(m => `${m.role}: ${m.content}`).join('\n')
    : '';
  
  // 기존 메타데이터에서 유용한 정보 추출
  const metadata = session.metadata || {};
  const existingTags = metadata.tags ? `태그: ${metadata.tags.join(', ')}` : '';
  
  // 분석용 콘텐츠 구성
  return `
제목: ${title}
요약: ${summary}
${existingTags ? existingTags + '\n' : ''}
---
대화 내용:
${messageContent}
`;
}

/**
 * 상세한 카테고리 설명을 생성합니다.
 */
function getCategoryDescriptions(): string {
  return `
- 개발: 프로그래밍, 코딩, 소프트웨어 개발, 앱 개발, 웹 개발, 디버깅, API, 프레임워크, 데이터베이스 관련 대화
- 창작: 글쓰기, 디자인, 그림, 음악, 영상 제작, 콘텐츠 창작, 예술 활동, 창의적 작업 관련 대화
- 학습: 학교, 공부, 강의, 교육, 온라인 강좌, 시험, 과제, 자기계발, 지식 습득 관련 대화
- 업무: 회사 업무, 비즈니스, 프로젝트 관리, 회의, 협업, 업무 계획, 보고서, 직장 생활 관련 대화
- 취미: 게임, 영화, 음악 감상, 독서, 스포츠, 여가 활동, 취미 생활, 오락 관련 대화
- 생활: 일상생활, 가정, 요리, 쇼핑, 가사, 생활 팁, 인간관계, 일상 문제 해결 관련 대화
- 건강: 운동, 식단, 다이어트, 건강관리, 질병, 의료, 정신 건강, 웰빙 관련 대화
- 여행: 여행 계획, 관광지, 숙박, 교통, 여행 경험, 휴가, 해외여행, 국내여행 관련 대화
- 경제: 금융, 투자, 주식, 부동산, 경제 동향, 재테크, 저축, 지출 관리 관련 대화
- 기술: IT 트렌드, 신기술, 기기, 전자제품, AI, 블록체인, 소프트웨어, 하드웨어 관련 대화
- 기타: 위 카테고리에 분명하게 속하지 않는 모든 대화
`;
}

/**
 * 제안된 카테고리가 유효한지 확인합니다.
 */
function validateCategory(category: string): string {
  // 공백 및 대소문자 처리
  const normalizedCategory = category.trim();
  
  // 정확한 카테고리명 확인
  const matchedCategory = PREDEFINED_CATEGORIES.find(
    cat => normalizedCategory.toLowerCase().includes(cat.toLowerCase())
  );
  
  return matchedCategory || "기타";
} 