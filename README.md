# 🧠 PKMProject

개인 지식관리(PKM)와 ChatGPT 대화 저장, Obsidian 연동, RAG 기반 검색, SaaS 확장까지 고려한  
**풀스택 AI 지식관리 시스템**입니다.

---

## 🚀 프로젝트 개요

- **ChatGPT 대화**를 자동/수동으로 수집, 요약, Obsidian Vault에 저장
- **RAG(Retrieval-Augmented Generation)** 기반 검색 및 질의응답
- **Supabase** + **pgvector**로 임베딩/검색/스토리지
- **Next.js(App Router, TypeScript, TailwindCSS)** 기반 웹 UI
- **SaaS 확장** 및 자동화(puppeteer, n8n, GitHub Actions) 지원

---

## 🏗️ 폴더 구조

```
pmkProject/
├── .env, .gitignore, next.config.js, tsconfig.json, tailwind.config.ts
├── package.json, postcss.config.js, vercel.json
├── public/                # 정적 파일, 아이콘, 이미지
├── prisma/                # Prisma 스키마 (SQLite/확장시 PostgreSQL)
│   └── schema.prisma
├── src/
│   ├── app/               # Next.js App Router, API 라우트
│   │   └── api/           # REST API (rag, auth, admin 등)
│   ├── components/        # UI 컴포넌트
│   ├── contexts/          # React Context
│   ├── db/                # DB 마이그레이션, Supabase
│   ├── lib/               # 공통 유틸리티, Supabase/Prisma 클라이언트
│   ├── types/             # 타입 정의
│   └── utils/             # 데이터 처리, RAG, 임베딩, Supabase 핸들러
├── scripts/               # 자동화 스크립트
├── memory/                # 작업 메모리/로그
├── PKM_Project_Plan*.md   # 프로젝트 기획/아키텍처 문서
├── RAG_SYSTEM_GUIDE.md    # RAG 시스템 가이드
├── RAG_Workflow_Guide.md  # RAG 워크플로우 문서
└── README.md
```

---

## ⚙️ 주요 기술스택

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, shadcn/ui, Zustand
- **Backend**: Next.js API Routes, Node.js, Prisma, Supabase, pgvector
- **AI/자동화**: OpenAI GPT-4.1-nano, puppeteer, chromium, n8n, react-query, zod
- **DB**: SQLite(개인용) → PostgreSQL(확장), Supabase, Prisma ORM
- **RAG**: LangChain, OpenAI Embedding, pgvector
- **DevOps**: Vercel, GitHub Actions, 환경별 .env

---

## 🧩 주요 기능

- ChatGPT 대화 자동/수동 수집 및 요약(url활용)
- puppeteer, chromium을 활용한 자동화 크롤링
- Obsidian Vault 구조로 마크다운 저장
- otp, google auth, password르 활용한 3구조 로그인
- Supabase + pgvector 기반 임베딩/검색
- integrations 대화찾아보기 및 즐겨찾기
- 개인화된 대시보드로 식별
- RAG 기반 질의응답 API (`/api/rag/ask`)
- SaaS 확장 및 멀티 유저 지원 설계
- 자동화 스크립트(puppeteer, n8n 등)
- GitHub, Obsidian, Supabase 연동
- Stripe를 활용한 구독 및 결제시스템
- (실제결제X, api를 활용한 테스트결제만)
- 테스트 카드번호 (4242-4242-4242-4242)
- 대화내역 , 사용자 및 구독자 관리가능한 admin 페이지


---

## 🗄️ 데이터베이스/임베딩 구조

- `chat_sessions`: 대화 세션(제목, URL, 요약, 전체 메시지, 임베딩)
- `chat_chunks`: 대화 청크(세션별 분할, 임베딩, 벡터 검색)
- Supabase + pgvector + Prisma ORM

---

## 🛠️ 개발/실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env)
cp .env.example .env.local
# Supabase, OpenAI 등 키 입력

# 3. DB 마이그레이션 (Prisma)
npx prisma generate

# 4. 개발 서버 실행
npm run dev
```

---

## 🧪 주요 스크립트

- `npm run dev` : 개발 서버 실행
- `npm run build` : 프로덕션 빌드
- `npm run lint` : 코드 린트 검사
- `npm run setup-chromium` : Playwright용 크로미움 설치

---

## 🔐 환경 변수 예시

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=your-openai-api-key
SETUP_API_KEY=your-custom-setup-key
```

---

## 📚 참고 문서

- `PKM_Project_Plan*.md` : 프로젝트 기획/아키텍처/기능 명세
- `RAG_SYSTEM_GUIDE.md` : RAG 시스템 설정/사용법
- `RAG_Workflow_Guide.md` : 전체 워크플로우/자동화
- `prisma/schema.prisma` : DB 스키마
- `src/lib/supabase.ts` : Supabase 클라이언트
- `src/utils/supabaseHandler.ts` : Supabase 쿼리 핸들러

---

## 🧑‍💻 기여 가이드

1. 이슈/PR 작성 전 [프로젝트 플랜 문서] 참고
2. 커밋 메시지 컨벤션, 코드 스타일(ESLint/Prettier) 준수
3. 주요 기능/버그는 이슈 등록 후 작업

---

## 🏆 라이선스

본 저장소의 코드를 무단으로 복제, 포크, 상업적 사용하거나 재배포하는 행위를 금지합니다.
PKM AI

---