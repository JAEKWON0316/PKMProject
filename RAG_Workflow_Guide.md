# 🧠 GPT 대화 저장 기반 RAG 시스템 구축 워크플로우

## ✅ 현재 완료된 단계
- [x] ChatGPT 공유 링크 크롤링 (Playwright 사용)
- [x] `.md` 파일로 Obsidian Vault에 저장
- [x] `.json` 파일로 대화 로그(user/assistant role) 저장
- [x] GPT API 요약 생성 및 `.md`, `.json`에 포함
- [x] GitHub / Supabase / Obsidian MCP 연동 완료

---

## 🔄 다음 목표
**목표**: 저장된 데이터를 기반으로 Embedding, DB 저장, LangChain 기반 검색/질의 응답, 챗봇 UI 구현

---

## 1. 📥 Supabase DB 설계 및 저장

### 📌 테이블 설계 (`chat_sessions`)
| 필드명         | 타입             | 설명 |
|----------------|------------------|------|
| `id`           | UUID (PK)        | 세션 ID |
| `title`        | TEXT             | 대화 제목 |
| `url`          | TEXT             | 공유된 GPT URL |
| `summary`      | TEXT             | GPT 요약 |
| `messages`     | JSONB            | 전체 대화 (user/assistant role) |
| `created_at`   | TIMESTAMP        | 대화 시간 |
| `embedding`    | VECTOR           | 요약 또는 청크 임베딩 (pgvector) |

### ✅ 데이터 삽입 예시 (Node.js)
```ts
import { createClient } from '@supabase/supabase-js';
import { encode } from 'gpt-tokenizer'; // 또는 custom chunker
import axios from 'axios';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// OpenAI 임베딩 API 호출
async function getEmbedding(text) {
  const res = await axios.post('https://api.openai.com/v1/embeddings', {
    input: text,
    model: 'text-embedding-3-small'
  }, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
  });
  return res.data.data[0].embedding;
}

async function insertChat(jsonData) {
  const embedding = await getEmbedding(jsonData.summary);
  const { data, error } = await supabase.from('chat_sessions').insert([{
    title: jsonData.title,
    url: jsonData.url,
    summary: jsonData.summary,
    messages: jsonData.messages,
    created_at: new Date(),
    embedding
  }]);
}
```

---

## 2. 🧩 청크 분할 및 벡터 저장

### 📌 청크 기준
- `user`/`assistant` 페어마다 묶기
- 토큰 기준 200~500자 단위로 분할
- 각 청크에 `chat_session_id`와 `chunk_index` 부여

### 📌 테이블 설계 (`chat_chunks`)
| 필드명           | 타입       | 설명 |
|------------------|------------|------|
| `id`             | UUID       | PK |
| `chat_session_id`| UUID       | 원본 세션 ID (FK) |
| `chunk_index`    | INTEGER    | 청크 순번 |
| `content`        | TEXT       | 청크 본문 |
| `embedding`      | VECTOR     | 벡터 임베딩 |

### ✅ 청크 삽입 예시
```ts
for (let i = 0; i < chunks.length; i++) {
  const emb = await getEmbedding(chunks[i]);
  await supabase.from('chat_chunks').insert({
    chat_session_id: parentSessionId,
    chunk_index: i,
    content: chunks[i],
    embedding: emb
  });
}
```

---

## 3. 🔍 LangChain RAG 파이프라인

### 🧠 LangChain 구성요소
- **Retriever**: Supabase pgvector 기반 유사도 검색
- **Prompt Template**: context + 질문 조합
- **LLMChain**: context-aware 답변 생성

### ✅ 예시 (LangChain + Supabase Retriever)
```ts
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

const retriever = await SupabaseVectorStore.fromExistingIndex(
  new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY }),
  {
    client: supabase,
    tableName: 'chat_chunks',
    queryName: 'match_chunks',
  }
);

// 질문 처리
const results = await retriever.similaritySearch("How did I describe UX issues?", 3);
```

---

## 4. 💬 챗봇 UI 구현 (웹앱)

### ✅ 기능 흐름
1. 사용자 질문 입력
2. 백엔드 → Supabase에서 관련 청크 검색
3. GPT API 호출 → context 포함 질문
4. UI에 응답 출력

### ✅ 백엔드 예시 (Express.js)
```ts
app.post('/ask', async (req, res) => {
  const { question } = req.body;
  const chunks = await getSimilarChunks(question);
  const prompt = `
  Context:
  ${chunks.map((c, i) => `[${i+1}] ${c.content}`).join("\n")}
  
  Question: ${question}
  Answer:
  `;
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  }, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` }
  });
  res.json({ answer: response.data.choices[0].message.content });
});
```

---

## 🔐 보안 및 접근 제어 (옵션)
- Supabase Auth → GitHub 기반 로그인
- 사용자별 데이터 분리 저장 (`user_id` 필드 추가)
- RLS 정책 적용 (Row-Level Security)

---

## 📈 향후 개선 방향
- ✅ MCP 기반 Obsidian ⇄ Supabase 연동 자동화
- 📌 사용 빈도 기반 벡터 리랭킹 (Hybrid Search)
- 🧩 GPT Summary를 vectorize하지 않고 RAG의 system prompt에 직접 삽입
- 📊 챗봇 응답 평가 및 피드백 저장

---