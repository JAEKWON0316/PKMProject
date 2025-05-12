# 1단계: 종속성 설치 및 빌드
FROM node:16 AS builder
WORKDIR /app

# 종속성 먼저 복사 및 설치
COPY package.json package-lock.json* ./
RUN npm install --only=production --no-optional

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 2단계: 실행 환경 (Playwright 포함)
FROM mcr.microsoft.com/playwright:v1.40.0-focal
WORKDIR /app

ENV NODE_ENV production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# 필요한 파일만 복사
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"] 