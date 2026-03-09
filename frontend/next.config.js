/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      encoding: false,
    };
    
    // 忽略 React Native 相关模块警告
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // 忽略 MetaMask SDK 的 React Native 依赖警告
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
      };
    }
    
    // 忽略特定模块的警告
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/@wagmi\/connectors/ },
    ];
    
    return config;
  },
};

module.exports = nextConfig;

