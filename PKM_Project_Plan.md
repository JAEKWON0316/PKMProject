# 🧠 Personal Knowledge Management (PKM) Project Plan

> 생성일: 2025-04-29

## 🚀 프로젝트 개요

나만의 GPT 대화 저장 및 지식관리 시스템을 구축하여 Obsidian과 연동하고, 추후 SaaS 형태로 확장 가능한 웹 기반 서비스로 발전시키는 것을 목표로 한다.

---

## 1. 🎯 목표

- ChatGPT 대화를 자동으로 수집하여 Obsidian에 저장
- GPT 응답 요약, 워크플로우 문서화co
- Obsidian 기반 PKM 시스템 구축
- 향후 사용자 서비스(SaaS)로의 확장 기반 마련

---

## 2. 🏗️ 아키텍처

```yaml
frontend: Next.js (TypeScript)
backend: Python FastAPI (요약 및 수집 API)
automation: Playwright + Cron (스크래핑 자동화)
database: SQLite (개인용) → 확장 시 PostgreSQL
storage: Local filesystem → 확장 시 AWS S3
vault: Obsidian Vault (Markdown 저장)
```

---

## 3. 🔧 기능 명세

### ✅ 개인용 기능 (1단계)

- [x] ChatGPT 대화 수동/자동 수집 (Playwright)
- [x] GPT API를 통한 요약 및 정리 (openai.ChatCompletion)
- [x] Markdown 파일로 저장 (Obsidian Vault 구조)
- [x] 시간대별 대화 기록 및 구분
- [x] YAML 설정 관리 가능

### ⏭️ 확장 기능 (2단계)

- [ ] 사용자 인증 및 API Key 저장
- [ ] 웹 대시보드 제공
- [ ] 사용자별 Vault 동기화
- [ ] GPT 요약 파라미터 커스터마이징

---

## 4. ⚙️ 기술 스택

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Python (FastAPI), OpenAI API
- **Browser Automation**: Playwright (headless scraping)
- **Storage**: Markdown Files, YAML config
- **PKM Tool**: Obsidian
- **Dev Tool**: Cursor IDE

---

## 5. 🗂️ 파일 구조 예시

```bash
PKM-Project/
├─ pages/
│  └─ index.tsx
├─ scripts/
│  └─ scrape_chatgpt.py
├─ obsidian-vault/
│  └─ 2025-04-29_chat.md
├─ config/
│  └─ settings.yaml
├─ README.md
```

---

## 6. 📅 일정 계획

| 단계 | 기간 | 목표 |
|------|------|------|
| 1단계 | 2025.04 ~ 05 | 개인용 자동화 및 Obsidian 연동 |
| 2단계 | 2025.06 이후 | 사용자 서비스 및 SaaS 확장 준비 |

---

## 7. 📌 기타 메모

- `n8n`, `Zapier`는 프로토타이핑에 유용
- GPT 로그인을 유지해야 스크래핑 가능
- 추후 Obsidian Sync나 git과 연계 가능

---

> 📌 개발환경: Cursor 기반, GitHub 저장소 연동, 로컬 Markdown 문서 자동화 중심
