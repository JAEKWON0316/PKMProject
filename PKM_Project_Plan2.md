# 📘 PKM Project Plan (개인용 뇌 프로젝트)

## 1. 프로젝트 목표
- ChatGPT, Cursor, 로컬 메모장 등 다양한 소스의 정보를 하나로 통합
- Obsidian을 개인 지식관리(PKM) 허브로 활용
- 향후 웹 기반 서비스(SaaS)로 확장 가능성 고려

## 2. 기술 스택
| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js (App Router), TypeScript, Tailwind CSS |
| 백엔드 | Node.js (API), Python (Playwright & GPT 요약), Express |
| 데이터 저장 | Obsidian 로컬 Vault, Git 연동 |
| 자동화 | n8n (향후), GitHub Actions (백업 및 버전관리) |
| AI 요약 | OpenAI GPT-4 API |
| 기타 | Playwright (ChatGPT 스크래핑) |

---

## 3. 핵심 기능 목록

### 🔹 데이터 수집
- [x] ChatGPT 대화 URL별 스크래핑 (Playwright)
- [x] Cursor 내 노트 자동 추출 (로컬 폴더 감지)
- [x] 로컬 메모장(.txt/.md) 폴더 감지

### 🔹 요약 및 저장
- [x] GPT-4 API로 요약 처리
- [x] 날짜별 마크다운 파일 생성 및 분류
- [x] Obsidian Vault로 자동 저장

### 🔹 Obsidian 구조 설계
Obsidian Vault/ ├── GPT_Notes/ │ 
                └── 20250429_chat_summary.md ├── Cursor_Notes/ │ 
                                             └── project-xyz.md ├── Memo_Notes/ │ 
                                                                └── idea-bank.md4

                                                                ---

## 4. 향후 확장 기능 (Web/SaaS)
- 사용자별 ChatGPT 요약 수집 → Vault 백업
- Obsidian Publish 스타일의 Web View 구현
- OAuth 기반 사용자별 Vault 관리
- n8n 연동 자동화
- 요약 프롬프트 커스터마이징 UI

---

## 5. 작업 워크플로우

1. ChatGPT에서 수동 or 자동 URL 복사
2. Playwright로 스크래핑 (로그인 후 대화 추출)
3. 요약 → GPT-4 → Markdown 변환
4. 파일 자동 저장 → Obsidian Vault로 이동
5. Obsidian에서 자동으로 인덱스화

---

## 6. 프로젝트 디렉토리 구조 (Next.js 기반)

Obsidian Vault/ ├── GPT_Notes/ │ └── 20250429_chat_summary.md ├── Cursor_Notes/ │ └── project-xyz.md ├── Memo_Notes/ │ └── idea-bank.md
---

## 7. TODO 리스트

- [ ] ChatGPT 요약 자동화 완료 (Python)
- [ ] GPT API Key 환경변수 설정
- [ ] Obsidian 파일 구조 반영
- [ ] Next.js에서 사용자 입력받는 Form 구현
- [ ] 향후 n8n으로 통합

---

## 8. 참고

- Obsidian Vault 위치: `~/Obsidian/PKM-Vault/`
- GPT 요약 모델: `gpt-4` (최적 결과 도출)
- 사용 언어: `TypeScript + Python` 병행