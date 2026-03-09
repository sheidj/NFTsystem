'use client';

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useReadContract } from 'wagmi';
import Link from 'next/link';
import { contractABI, contractAddress } from '@/lib/contract';

// 管理员地址（Sepolia 测试网部署账户）
const ADMIN_ADDRESS = '0x3B0CeAf6021C9201CFbE76421738359b71cE2C00';

// 测试账户映射（备用）
const TEST_ACCOUNTS: Record<string, string> = {
  '0x3b0ceaf6021c9201cfbe76421738359b71ce2c00': '管理员',
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': 'Hardhat账户#0',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': 'Hardhat账户#1',
};

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address, isConnected, chain } = useAccount();
  const [showTip, setShowTip] = useState(false);

  // 判断是否是管理员
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  
  // 从合约读取学生信息
  const { data: graduateInfo } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getGraduateInfo',
    args: address ? [address as `0x${string}`] : undefined,
  });

  const { data: isRegistered } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'isRegisteredGraduate',
    args: address ? [address as `0x${string}`] : undefined,
  });
  
  // 获取账户名称（优先从合约读取）
  const getAccountName = () => {
    if (!address) return '';
    
    // 如果是管理员
    if (isAdmin) return '管理员';
    
    // 如果已注册，从合约读取学生姓名
    if (isRegistered && graduateInfo && graduateInfo[1]) {
      return `${graduateInfo[1]} (学生)`;
    }
    
    // 如果在测试账户中
    const testName = TEST_ACCOUNTS[address.toLowerCase()];
    if (testName) return testName;
    
    // 默认显示
    return '游客';
  };

  const accountName = getAccountName();

  // 账户变化时显示提示
  useEffect(() => {
    if (isConnected && address) {
      console.log('当前账户:', address, accountName);
      console.log('当前网络:', chain?.name || '未知');
    }
  }, [address, isConnected, accountName, chain]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 rounded-xl sm:rounded-2xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-primary-500/30">
              <span className="text-xl sm:text-2xl">🎓</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="font-display font-bold text-lg sm:text-xl text-light-800 leading-tight">
                毕业纪念NFT
              </h1>
              <p className="text-xs text-light-500 font-medium hidden sm:block">Graduation Memorial ✨</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <a
              href="/"
              className="px-4 py-2 rounded-xl text-light-600 hover:text-primary-600 hover:bg-primary-50 font-semibold transition-all duration-300"
            >
              🏠 首页
            </a>
            <a
              href="/mint"
              className="px-4 py-2 rounded-xl text-light-600 hover:text-accent-600 hover:bg-accent-50 font-semibold transition-all duration-300"
            >
              🎲 铸造
            </a>
            <a
              href="/my-nfts"
              className="px-4 py-2 rounded-xl text-light-600 hover:text-teal-600 hover:bg-teal-50 font-semibold transition-all duration-300"
            >
              💎 我的NFT
            </a>
            <a
              href="/transfer"
              className="px-4 py-2 rounded-xl text-light-600 hover:text-teal-600 hover:bg-teal-50 font-semibold transition-all duration-300"
            >
              🔄 转让
            </a>
            <a
              href="/stats"
              className="px-4 py-2 rounded-xl text-light-600 hover:text-primary-600 hover:bg-primary-50 font-semibold transition-all duration-300"
            >
              📊 统计
            </a>
            <a
              href="/admin"
              className="px-4 py-2 rounded-xl text-light-600 hover:text-rose-600 hover:bg-rose-50 font-semibold transition-all duration-300"
            >
              ⚙️ 管理
            </a>
          </nav>

          {/* Connect Wallet Area */}
          <div className="flex items-center gap-3">
            {/* 角色标签 */}
            {isConnected && (
              <div className="hidden sm:flex items-center gap-2">
                <span className={`px-4 py-2 rounded-2xl text-sm font-bold shadow-sm ${
                  isAdmin 
                    ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 border-2 border-primary-300' 
                    : 'bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700 border-2 border-accent-300'
                }`}>
                  {isAdmin ? '👑 管理员' : '🎓 ' + accountName}
                </span>
              </div>
            )}

            {/* 钱包连接按钮 */}
            <div className="relative">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div
                      {...(!ready && {
                        'aria-hidden': true,
                        style: {
                          opacity: 0,
                          pointerEvents: 'none',
                          userSelect: 'none',
                        },
                      })}
                    >
                      {(() => {
                        if (!connected) {
                          return (
                            <button
                              onClick={openConnectModal}
                              className="btn-primary text-sm"
                            >
                              ✨ 连接钱包
                            </button>
                          );
                        }

                        if (chain.unsupported) {
                          return (
                            <button
                              onClick={openChainModal}
                              className="px-4 py-2 bg-rose-100 text-rose-600 rounded-2xl text-sm border-2 border-rose-200 font-bold hover:bg-rose-200 transition-colors"
                            >
                              ⚠️ 切换网络
                            </button>
                          );
                        }

                        return (
                          <div className="flex items-center gap-2">
                            {/* 网络按钮 */}
                            <button
                              onClick={openChainModal}
                              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-2xl text-sm hover:bg-light-100 transition-colors border-2 border-light-200 shadow-sm"
                            >
                              {chain.hasIcon && chain.iconUrl ? (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className="w-5 h-5 rounded-full"
                                />
                              ) : (
                                <span className="w-5 h-5 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {chain.name?.charAt(0) || '?'}
                                </span>
                              )}
                              <span className="text-light-700 font-semibold">{chain.name || '未知网络'}</span>
                            </button>

                            {/* 账户按钮 */}
                            <button
                              onClick={openAccountModal}
                              onMouseEnter={() => setShowTip(true)}
                              onMouseLeave={() => setShowTip(false)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl text-sm hover:from-primary-100 hover:to-accent-100 transition-all border-2 border-primary-200 shadow-sm"
                            >
                              <span className="font-mono font-bold text-light-700">
                                {account.displayName}
                              </span>
                              <span className="text-primary-600 font-bold">
                                {account.displayBalance}
                              </span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }}
              </ConnectButton.Custom>

              {/* 切换账户提示 */}
              {showTip && isConnected && (
                <div className="absolute top-full right-0 mt-2 p-4 bg-white rounded-2xl border-2 border-primary-200 shadow-xl text-sm w-64 z-50">
                  <p className="text-light-700 mb-2 font-bold">💡 切换账户方法：</p>
                  <ol className="text-light-600 text-xs space-y-1 list-decimal list-inside">
                    <li>点击此按钮打开面板</li>
                    <li>在 MetaMask 中切换账户</li>
                    <li>页面会自动更新</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-light-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t-2 border-primary-100 pt-4">
            {/* 移动端角色显示 */}
            {isConnected && (
              <div className="mb-4 pb-4 border-b-2 border-primary-100">
                <span className={`px-4 py-2 rounded-2xl text-sm font-bold ${
                  isAdmin 
                    ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 border-2 border-primary-300' 
                    : 'bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700 border-2 border-accent-300'
                }`}>
                  {isAdmin ? '👑 管理员' : '🎓 ' + accountName}
                </span>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <a
                href="/"
                className="px-4 py-3 rounded-xl text-light-600 hover:text-primary-600 hover:bg-primary-50 font-semibold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                🏠 首页
              </a>
              <a
                href="/mint"
                className="px-4 py-3 rounded-xl text-light-600 hover:text-accent-600 hover:bg-accent-50 font-semibold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                🎲 铸造
              </a>
              <a
                href="/my-nfts"
                className="px-4 py-3 rounded-xl text-light-600 hover:text-teal-600 hover:bg-teal-50 font-semibold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                💎 我的NFT
              </a>
              <a
                href="/transfer"
                className="px-4 py-3 rounded-xl text-light-600 hover:text-teal-600 hover:bg-teal-50 font-semibold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                🔄 转让
              </a>
              <a
                href="/stats"
                className="px-4 py-3 rounded-xl text-light-600 hover:text-primary-600 hover:bg-primary-50 font-semibold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                📊 统计
              </a>
              <a
                href="/admin"
                className="px-4 py-3 rounded-xl text-light-600 hover:text-rose-600 hover:bg-rose-50 font-semibold transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ⚙️ 管理
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
