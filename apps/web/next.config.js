/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @teletrade/shared ships a built dist/index.js (CommonJS). We deliberately
  // do NOT transpile it from source — that makes Next.js walk src/ and try to
  // resolve relative paths to .js files that only live in dist/.
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
