FROM node:18-alpine AS base

# 기본 의존성 설치
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 패키지 설치
COPY package.json package-lock.json* ./
RUN npm ci

# 빌더 단계
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Playwright 설정을 위한 새 이미지 (Chromium 지원)
FROM mcr.microsoft.com/playwright:v1.40.0-focal AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# 필요한 시스템 패키지만 유지
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libnspr4 \
    libgbm1 \
    && rm -rf /var/lib/apt/lists/*

# 앱 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 앱 실행
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"] 