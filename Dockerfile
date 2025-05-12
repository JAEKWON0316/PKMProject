# Node.js 20 버전 사용 (npm 11 호환성을 위해)
FROM node:20 AS deps

# 작업 디렉토리 설정
WORKDIR /app

# CI 환경에서 패키지 설치 문제 해결을 위한 설정
ENV NODE_ENV=development
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 패키지 파일 복사
COPY package.json package-lock.json ./

# 의존성 설치 (npm 업그레이드 없이)
RUN npm install --no-audit --no-fund

# 빌드 단계
FROM node:20 AS builder
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