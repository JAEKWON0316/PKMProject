/** @type {import('next').NextConfig} */
const path = require('path');

// 운영체제 감지
const isWindows = process.platform === 'win32';
const isVercel = process.env.VERCEL === '1';

// 환경에 맞는 Chromium 경로 설정
const chromiumPath = isWindows 
  ? path.join(process.cwd(), '.chromium')
  : '/tmp/chromium';

const nextConfig = {
  output: 'standalone', // Docker 배포에 필요한 설정
  reactStrictMode: true,
  // 환경 변수 설정
  env: {
    CHROMIUM_PATH: chromiumPath,
    IS_WINDOWS: isWindows ? 'true' : 'false',
    IS_VERCEL: isVercel ? 'true' : 'false',
  },
  // puppeteer-core 및 관련 패키지를 트랜스파일
  transpilePackages: ['puppeteer-core', '@sparticuz/chromium'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // undici 관련 이슈 해결을 위한 설정
      config.externals.push('undici');
      
      // 서버 측에서 puppeteer-core를 번들링에서 제외
      config.externals.push('puppeteer-core');
      config.externals.push('@sparticuz/chromium');
    }
    
    // puppeteer-core ESM 이슈 대응
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false
      };
    }
    
    return config;
  },
}

module.exports = nextConfig 