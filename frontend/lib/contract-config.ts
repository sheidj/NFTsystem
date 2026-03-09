// 合约配置文件 - 支持多环境切换

export type Network = 'local' | 'sepolia' | 'amoy' | 'mainnet';

// 合约地址配置
const CONTRACT_ADDRESSES: Record<Network, string> = {
  local: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // 本地 Hardhat 部署地址（需要替换）
  sepolia: '', // Sepolia 测试网地址（部署后填入）
  amoy: '', // Polygon Amoy 测试网地址（部署后填入）
  mainnet: '', // 主网地址（部署后填入）
};

// 网络配置
export const NETWORK_CONFIG = {
  local: {
    name: 'Hardhat Local',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
  },
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    explorer: 'https://sepolia.etherscan.io',
  },
  amoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    explorer: 'https://amoy.polygonscan.com',
  },
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    explorer: 'https://etherscan.io',
  },
};

// 当前使用的网络（在这里切换！）
export const CURRENT_NETWORK: Network = 'local';

// 获取当前合约地址
export const getCurrentContractAddress = (): string => {
  const address = CONTRACT_ADDRESSES[CURRENT_NETWORK];
  if (!address) {
    throw new Error(`No contract address configured for network: ${CURRENT_NETWORK}`);
  }
  return address;
};

// 获取当前网络配置
export const getCurrentNetworkConfig = () => {
  return NETWORK_CONFIG[CURRENT_NETWORK];
};

// 导出当前合约地址（兼容现有代码）
export const contractAddress = getCurrentContractAddress();

