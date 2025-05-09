/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    webpack(config, { isServer }) {
      if (!isServer) {
        // Disable Webpack caching for production build
        config.cache = false;
      }
      return config;
    },
  };
  
  export default nextConfig;
  