/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ensure assets work in Electron
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
  basePath: '',
  trailingSlash: true,
}

module.exports = nextConfig