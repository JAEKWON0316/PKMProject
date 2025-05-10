# RAG 시스템 가이드

이 문서는 RAG(Retrieval-Augmented Generation) 시스템의 설정과 사용법을 설명합니다.

## 개요

이 RAG 시스템은 다음의 기능을 제공합니다:

1. ChatGPT 대화 자동 크롤링 및 저장
2. 대화 내용의 청크 분할 및 벡터 임베딩 생성
3. 대화 내용을 Obsidian, Supabase, GitHub에 저장
4. 벡터 유사도 검색을 통한 질의응답 기능

## 시스템 설정

### 환경 변수 설정

프로젝트 루트에 `.env` 또는 `.env.local` 파일을 만들고 다음 환경 변수를 설정하세요:

```bash
# Supabase 정보
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI API 키
OPENAI_API_KEY=your-openai-api-key

# 설정 API 보안 키
SETUP_API_KEY=your-custom-setup-key

# GitHub 저장소 정보 (선택사항)
GITHUB_TOKEN=your-github-token
GITHUB_REPO=your-github-repo
```

### 데이터베이스 설정

1. Supabase 프로젝트를 생성하세요.
2. 다음 API 엔드포인트를 호출하여 필요한 테이블과 함수를 설정하세요:

```bash
curl -X POST http://localhost:3000/api/rag/setup \
  -H "Content-Type: application/json" \
  -d '{"key": "your-setup-api-key"}'
```

또는 웹 브라우저에서:

1. 개발 서버 실행: `npm run dev`
2. http://localhost:3000/api/rag/setup 페이지 방문
3. RAG UI 페이지: http://localhost:3000/rag

## 사용 방법

### ChatGPT 대화 저장

1. ChatGPT에서 대화를 나눈 후, "Share" 버튼을 클릭하여 공유 링크를 생성합니다.
2. RAG UI 페이지에서 URL 입력란에 공유 링크를 붙여넣습니다.
3. "대화 저장" 버튼을 클릭합니다.
4. 대화 내용이 처리되고 저장됩니다.

### 질문하기

1. RAG UI 페이지에서 질문 입력란에 질문을 입력합니다.
2. "질문하기" 버튼을 클릭합니다.
3. 시스템이 저장된 대화에서 관련 정보를 검색하고 응답을 생성합니다.
4. 응답과 함께 정보 출처가 표시됩니다.

## API 참조

### `/api/rag/conversations`

ChatGPT 대화를 저장하기 위한 API 엔드포인트입니다.

**요청 (POST):**
```json
{
  "url": "https://chat.openai.com/share/..."
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "대화 제목",
    "url": "원본 URL",
    "summary": "대화 요약",
    "keywords": ["키워드1", "키워드2"],
    "obsidian": {
      "fileName": "파일명.md"
    },
    "chunks": 10
  }
}
```

### `/api/rag/ask`

질문에 대한 답변을 생성하기 위한 API 엔드포인트입니다.

**요청 (POST):**
```json
{
  "query": "질문 내용",
  "similarity": 0.7,
  "limit": 5
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "answer": "질문에 대한 답변...",
    "sources": [
      {
        "id": "uuid",
        "title": "출처 제목",
        "url": "출처 URL",
        "similarity": 0.85
      }
    ]
  }
}
```

## 문제 해결

**Q: Supabase 연결 오류가 발생합니다.**  
A: 환경 변수 설정을 확인하고, Supabase 프로젝트가 활성화되어 있는지 확인하세요.

**Q: OpenAI API 오류가 발생합니다.**  
A: OpenAI API 키가 올바르게 설정되었는지 확인하고, API 할당량을 확인하세요.

**Q: 대화 저장이 실패합니다.**  
A: ChatGPT 공유 링크가 올바른 형식인지 확인하세요. 링크 형식은 `https://chat.openai.com/share/...`여야 합니다.

**Q: 벡터 검색 함수가 없다는 오류가 발생합니다.**  
A: `/api/rag/setup` API를 호출하여 필요한 함수가 생성되었는지 확인하세요.

## 기술 스택

- Next.js (App Router)
- TypeScript
- Supabase (PostgreSQL + pgvector)
- OpenAI API
- Obsidian (MCP)
- GitHub 연동 