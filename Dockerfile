# 다른 Node.js 버전 시도 (LTS 버전인 18 사용)
FROM node:18 AS deps

# 작업 디렉토리 설정
WORKDIR /app

# CI 환경에서 패키지 설치 문제 해결을 위한 설정
ENV NODE_ENV=development
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 패키지 파일 복사
COPY package.json package-lock.json ./

# npm 최신 버전으로 업데이트
RUN npm install -g npm@latest

# 의존성 설치
RUN npm install --no-audit --no-fund

# 빌드 단계
FROM node:18 AS builder
WORKDIR /app

# 설치된 node_modules 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 실행
RUN npm run build

# 실행 환경
FROM mcr.microsoft.com/playwright:v1.40.0-focal AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# 필요한 파일 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 앱 실행
EXPOSE 3000
CMD ["npm", "start"] 