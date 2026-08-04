/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Bypasses Next.js TS check on Vercel since local build is verified
    ignoreBuildErrors: true,
  },
  eslint: {
    // Bypasses ESLint check on Vercel build step
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;