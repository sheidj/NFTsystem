'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import {
  mainnet,
  sepolia,
  polygon,
  polygonAmoy,
  arbitrum,
  optimism,
  base,
} from 'viem/chains';
import type { Chain } from 'viem/chains';
import '@rainbow-me/rainbowkit/styles.css';

// 自定义 Hardhat 本地网络配置
const hardhatLocal: Chain = {
  id: 31337,
  name: 'Hardhat 本地',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
};

// Ganache 本地网络
const ganacheLocal: Chain = {
  id: 1337,
  name: 'Ganache 本地',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:7545'] },
  },
  testnet: true,
};

const { wallets } = getDefaultWallets();

// 获取WalletConnect项目ID，如果未配置则使用临时ID（仅用于本地开发）
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'YOUR_PROJECT_ID';

// 仅在开发环境且未配置真实项目ID时提示
if (typeof window !== 'undefined' && walletConnectProjectId === 'YOUR_PROJECT_ID' && process.env.NODE_ENV === 'development') {
  console.warn(
    '⚠️ WalletConnect项目ID未配置。\n' +
    '请在 https://cloud.walletconnect.com/ 创建项目并获取项目ID，\n' +
    '然后在 frontend/.env 文件中添加: NEXT_PUBLIC_WALLET_CONNECT_ID=你的项目ID'
  );
}

const config = getDefaultConfig({
  appName: '高校毕业纪念NFT',
  projectId: walletConnectProjectId,
  wallets: [
    ...wallets,
    {
      groupName: '其他钱包',
      wallets: [argentWallet, trustWallet, ledgerWallet],
    },
  ],
  chains: [
    hardhatLocal,    // 本地开发网络（默认）
    ganacheLocal,    // Ganache 本地
    sepolia,         // 以太坊测试网
    polygonAmoy,     // Polygon 测试网
    mainnet,         // 以太坊主网
    polygon,         // Polygon 主网
    arbitrum,        // Arbitrum 主网
    optimism,        // Optimism 主网
    base,            // Base 主网
  ],
  ssr: true,
});

// 创建单例 QueryClient 避免重复初始化
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // 使用 useMemo 确保 providers 稳定，避免不必要的重新渲染
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#f59e0b',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
          locale="zh-CN"
          showRecentTransactions={true}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
