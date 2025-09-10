/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000']
    },
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://cloudbasedcollborativecodeeditor-backend.onrender.com',
  },
  reactStrictMode: false, // Temporarily disabled to prevent double useEffect execution
  webpack(config, { isServer }) {
    if (!isServer) {
      // Disable Webpack caching for production build
      config.cache = false;
    }
    return config;
  },
};
  
  export default nextConfig;
  