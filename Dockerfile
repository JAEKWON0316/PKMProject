# 공식 Node.js 이미지 사용 (Alpine 대신 공식 이미지로 변경)
FROM node:16 AS deps

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 설치를 위한 파일 복사
COPY package.json package-lock.json ./

# 일반 npm install 사용
RUN npm install

# 빌드 단계
FROM node:16 AS builder
WORKDIR /app

# 설치된 node_modules와 소스 코드 복사
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 애플리케이션 빌드
RUN npm run build

# 실행 환경 설정
FROM mcr.microsoft.com/playwright:v1.40.0-focal AS runner
WORKDIR /app

# 환경 변수 설정
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