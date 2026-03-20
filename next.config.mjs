/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Remotion uses some Node.js modules that need to be ignored in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      child_process: false,
      os: false,
    };
    return config;
  },
};

export default nextConfig;
