import 'dotenv/config';

import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from './src/utils/embeddings';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const sessionId = '1129f3aa-2e75-43a2-9cf0-6d08526cbcfb'; // FAQ: 프로젝트 세션 UUID

const faqPairs = [
  { question: '나만의뇌 프로젝트의 주요 기능은 무엇인가요?', answer: '나만의 뇌 프로젝트는 개인화된 지식 관리, 대화 저장 및 분석, 사용자 맞춤형 챗봇 구현, 대화 기록의 Markdown/JSON 저장, 역할 구분, RAG 기반 응답, Supabase 벡터DB, Obsidian 연동, 이미지 관리, 대화 시각화, 로컬 메모장/GPT 통합, 프리미엄/결제/자동화 워크플로우 등 다양한 기능을 제공합니다.' },
  { question: '프로젝트의 목적이 무엇인가요?', answer: '이 프로젝트의 목적은 사용자의 지식과 대화 데이터를 체계적으로 저장, 분석, 활용하여 맞춤형 AI 챗봇 경험과 지식 관리를 지원하는 것입니다.' },
  { question: '대화 기록은 어떻게 저장되고 관리되나요?', answer: '모든 대화 기록은 Markdown과 JSON 형식으로 저장되며, Supabase 벡터 데이터베이스와 연동되어 검색 및 분석이 가능합니다.' },
  { question: '사용자와 Assistant 역할은 어떻게 구분되나요?', answer: '대화 데이터에는 사용자와 Assistant의 역할이 명확히 구분되어 저장되어, 각 역할별로 대화 흐름을 분석할 수 있습니다.' },
  { question: 'RAG 시스템이란 무엇이고, 어떻게 적용되나요?', answer: 'RAG(Retrieval-Augmented Generation) 시스템은 저장된 대화/지식 기반에서 유사한 정보를 검색해 LLM 답변에 활용하는 구조로, LangChain 기반으로 구현되어 있습니다.' },
  { question: 'Supabase는 어떤 역할을 하나요?', answer: 'Supabase는 벡터 데이터베이스로서 대화 기록, 임베딩, 메타데이터 등을 저장/검색하는 데 사용됩니다.' },
  { question: 'Obsidian과는 어떻게 연동되나요?', answer: 'Obsidian을 통해 로컬 메모장과 프로젝트 데이터를 연동하여, 지식 관리와 검색을 강화할 수 있습니다.' },
  { question: '프론트엔드와 백엔드 기술 스택은 무엇인가요?', answer: '프론트엔드는 React, Next.js, TypeScript, 백엔드는 Spring Boot, Supabase, Redis를 사용합니다.' },
  { question: '배포는 어떻게 이루어지나요?', answer: 'Vercel(프론트엔드)과 Heroku(백엔드)에서 배포 및 운영됩니다.' },
  { question: '프리미엄 서비스에는 어떤 기능이 추가될 예정인가요?', answer: '프리미엄 서비스에는 고급 분석, 추가 저장공간, 맞춤형 챗봇, 자동화 워크플로우, 결제 시스템 등이 포함될 예정입니다.' },
  { question: '이미지 관리는 어떻게 처리되나요?', answer: 'Firebase Storage를 통해 이미지 업로드, 저장, 관리가 가능하며, 대화와 연동됩니다.' },
  { question: '대화 기록 시각화 기능이 있나요?', answer: '네, 대화 기록을 다양한 차트와 그래프로 시각화하여 분석할 수 있습니다.' },
  { question: '로컬 메모장과 GPT 대화 통합은 어떻게 동작하나요?', answer: 'Obsidian 등 로컬 메모장과 GPT 대화 데이터를 연동하여, 한 곳에서 지식과 대화를 통합 관리할 수 있습니다.' },
  { question: '자동화 워크플로우는 어떤 시나리오에 쓰이나요?', answer: '반복적인 작업, 데이터 백업, 알림, 대화 분석 등 다양한 자동화 시나리오를 지원합니다.' },
  { question: '향후 로드맵이 궁금합니다.', answer: '프리미엄 서비스, 결제 시스템, 고급 분석, 더 많은 외부 서비스 연동, 사용자 경험 개선 등이 계획되어 있습니다.' },
  { question: '백터 데이터베이스란 무엇인가요? ', answer: '벡터 데이터베이스(Vector Database)는 고차원 벡터(embedding vector)를 저장하고, 유사도 기반으로 빠르게 검색할 수 있도록 최적화된 데이터베이스입니다. 일반적인 관계형 DB와는 다르게, 벡터 간의 거리(예: 코사인 유사도, 유클리드 거리 등) 를 기반으로 가장 유사한 데이터를 찾아주는 것이 핵심입니다.' },
];

async function insertFaqChunks() {
  for (let i = 0; i < faqPairs.length; i++) {
    const { question, answer } = faqPairs[i];
    const content = `Q: ${question}\nA: ${answer}`;
    // 중복 체크: 동일한 content가 이미 DB에 있는지 확인
    const { data: existing, error: selectError } = await supabase
      .from('chat_chunks')
      .select('id')
      .eq('chat_session_id', sessionId)
      .eq('content', content)
      .maybeSingle();
    if (selectError) {
      console.error('중복 체크 오류:', selectError.message);
      continue;
    }
    if (existing) {
      console.log(`이미 존재: ${question}`);
      continue;
    }
    const embedding = await getEmbedding(content);
    await supabase.from('chat_chunks').insert({
      chat_session_id: sessionId,
      chunk_index: i,
      content,
      embedding
    });
    console.log(`추가됨: ${question}`);
  }
  console.log('FAQ 질문-답변 쌍이 DB에 성공적으로 저장되었습니다!');
}

insertFaqChunks(); 