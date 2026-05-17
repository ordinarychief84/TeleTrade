/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@teletrade/shared'],
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
