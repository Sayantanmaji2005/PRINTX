/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.qrserver.com', 'localhost'],
  },
};

module.exports = nextConfig;
