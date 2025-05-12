/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['playwright'],
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