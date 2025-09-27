/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Ensure assets work in Electron
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  basePath: '',
  trailingSlash: false,
}

module.exports = nextConfig