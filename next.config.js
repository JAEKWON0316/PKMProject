/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Docker 배포에 필요한 설정
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['playwright-core'],
  },
  // 환경 변수 설정
  env: {
    PLAYWRIGHT_BROWSERS_PATH: '/ms-playwright',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // undici 관련 이슈 해결을 위한 설정
      config.externals.push('undici');
    }
    return config;
  },
}

module.exports = nextConfig 