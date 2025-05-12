# 단일 단계 빌드로 단순화
FROM node:20-bullseye-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    libnss3 \
    libnspr4 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# 패키지 파일 복사
COPY package.json ./

# 개발 의존성 제외하고 npm 패키지 설치
RUN npm install --omit=dev

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 환경 변수 설정
ENV NODE_ENV=production
ENV PORT=3000 
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Playwright 브라우저 설치
RUN npx playwright install chromium --with-deps

# 앱 실행
EXPOSE 3000
CMD ["npm", "start"] 