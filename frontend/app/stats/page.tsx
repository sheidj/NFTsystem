'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { contractABI, contractAddress, NFT_INFO } from '@/lib/contract';
import Link from 'next/link';

// 管理员地址
const ADMIN_ADDRESS = '0x3B0CeAf6021C9201CFbE76421738359b71cE2C00';

// NFT类型（带完整颜色配置）
const NFT_TYPES = [
  { id: 1, name: '📜 毕业证书', bg: 'bg-primary-100', border: 'border-primary-200', text: 'text-primary-700', bar: 'bg-primary-400' },
  { id: 2, name: '🏅 纪念徽章', bg: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-700', bar: 'bg-teal-400' },
  { id: 3, name: '🏆 荣誉证书', bg: 'bg-accent-100', border: 'border-accent-200', text: 'text-accent-700', bar: 'bg-accent-400' },
  { id: 4, name: '⭐ 特殊奖项', bg: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-700', bar: 'bg-rose-400' },
];

// 稀有度信息
const RARITY_INFO = [
  { name: '普通', icon: '🎨', color: 'teal', bgColor: 'bg-teal-100', textColor: 'text-teal-700' },
  { name: '稀有', icon: '🌟', color: 'primary', bgColor: 'bg-primary-100', textColor: 'text-primary-700' },
  { name: '传说', icon: '💎', color: 'accent', bgColor: 'bg-accent-100', textColor: 'text-accent-700' },
];

export default function StatsPage() {
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // 基础统计数据
  const { data: totalGraduates } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getTotalGraduates',
  });

  const { data: universityName } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'universityName',
  });

  // 各类型NFT供应量
  const { data: supply1 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'totalSupply', args: [BigInt(1)],
  });
  const { data: supply2 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'totalSupply', args: [BigInt(2)],
  });
  const { data: supply3 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'totalSupply', args: [BigInt(3)],
  });
  const { data: supply4 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'totalSupply', args: [BigInt(4)],
  });

  // 最大供应量
  const { data: maxSupply1 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'maxSupply', args: [BigInt(1)],
  });
  const { data: maxSupply2 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'maxSupply', args: [BigInt(2)],
  });
  const { data: maxSupply3 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'maxSupply', args: [BigInt(3)],
  });
  const { data: maxSupply4 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'maxSupply', args: [BigInt(4)],
  });

  // 个人NFT统计
  const { data: nextPersonalTokenId } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'nextPersonalTokenId',
  });

  const officialSupplies = [
    { ...NFT_TYPES[0], supply: Number(supply1 || 0), max: Number(maxSupply1 || 0) },
    { ...NFT_TYPES[1], supply: Number(supply2 || 0), max: Number(maxSupply2 || 0) },
    { ...NFT_TYPES[2], supply: Number(supply3 || 0), max: Number(maxSupply3 || 0) },
    { ...NFT_TYPES[3], supply: Number(supply4 || 0), max: Number(maxSupply4 || 0) },
  ];

  const totalOfficialMinted = officialSupplies.reduce((sum, item) => sum + item.supply, 0);
  const personalNFTCount = Number(nextPersonalTokenId || 10001) - 10001;
  const totalNFTMinted = totalOfficialMinted + personalNFTCount;

  // 从数据库获取统计数据
  const [dbStats, setDbStats] = useState<{
    summary: { users: number; officialNFTs: number; personalNFTs: number };
    distribution: {
      college: Array<{ name: string; count: number }>;
      rarity: Array<{ rarity: number; count: number }>;
    };
    recentActivity: Array<{
      tokenId: number;
      type: string;
      rarity: number | null;
      user: string;
      time: string;
    }>;
  } | null>(null);

  const [loadingDbStats, setLoadingDbStats] = useState(true);

  useEffect(() => {
    fetch('/api/db/stats')
      .then(res => res.json())
      .then(data => {
        setDbStats(data);
        setLoadingDbStats(false);
      })
      .catch(err => {
        console.error('Failed to fetch DB stats:', err);
        setLoadingDbStats(false);
      });
  }, []);

  // 稀有度统计（从数据库读取，如果没有则估算）
  const [rarityStats, setRarityStats] = useState({ common: 0, rare: 0, legendary: 0 });
  
  useEffect(() => {
    if (dbStats && dbStats.distribution.rarity.length > 0) {
      // 使用数据库的真实数据
      const stats = { common: 0, rare: 0, legendary: 0 };
      dbStats.distribution.rarity.forEach(item => {
        if (item.rarity === 0) stats.common = item.count;
        else if (item.rarity === 1) stats.rare = item.count;
        else if (item.rarity === 2) stats.legendary = item.count;
      });
      setRarityStats(stats);
    } else if (personalNFTCount > 0) {
      // 简化：基于概率估算稀有度分布
      // 实际应该从事件日志读取
      const estimated = {
        common: Math.round(personalNFTCount * 0.70),
        rare: Math.round(personalNFTCount * 0.25),
        legendary: Math.round(personalNFTCount * 0.05),
      };
      // 调整确保总数正确
      const diff = personalNFTCount - (estimated.common + estimated.rare + estimated.legendary);
      estimated.common += diff;
      setRarityStats(estimated);
    }
  }, [personalNFTCount, dbStats]);

  // 计算百分比（保留1位小数，最小显示0.1%）
  const getPercentage = (value: number, total: number) => {
    if (total === 0) return '0.0';
    const rawPercent = (value / total) * 100;
    // 如果有值但百分比小于0.1，至少显示0.1%
    const percent = value > 0 && rawPercent < 0.1 ? '0.1' : rawPercent.toFixed(1);
    return percent;
  };

  return (
    <div className="min-h-screen celebration-bg">
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-3 sm:px-4">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700 rounded-full text-xs sm:text-sm font-bold mb-3 sm:mb-4 border-2 border-accent-200 shadow-sm">
              📊 数据统计
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-4 text-light-800">
              系统 <span className="gradient-text">统计仪表板</span> 📈
            </h1>
            <p className="text-light-600 text-sm sm:text-lg">
              实时查看NFT铸造数据和系统状态
            </p>
            
            {/* 钱包连接状态提示 */}
            {!isConnected && (
              <div className="mt-4 p-3 bg-primary-50 border-2 border-primary-200 rounded-xl inline-flex items-center gap-2">
                <span className="text-primary-600">💡</span>
                <span className="text-sm text-primary-700">
                  连接钱包可查看更多个性化数据
                </span>
              </div>
            )}
          </div>

          {/* 核心指标卡片 - 优化布局 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* 学校卡片 - 桌面端跨两列 */}
            <div className="card-colorful p-5 sm:p-7 text-center lg:col-span-1">
              <div className="text-4xl sm:text-6xl mb-3">🏫</div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-2">{universityName as string || '江西软件大学'}</div>
              <div className="text-xs sm:text-sm text-light-500 font-medium tracking-wide">UNIVERSITY</div>
            </div>
            
            {/* 注册毕业生卡片 */}
            <div className="card-colorful p-5 sm:p-7 text-center">
              <div className="text-4xl sm:text-6xl mb-3">👥</div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-teal-600 mb-2">{totalGraduates?.toString() || '0'}</div>
              <div className="text-xs sm:text-sm text-light-500 font-medium tracking-wide">注册毕业生</div>
            </div>
            
            {/* NFT总数卡片 */}
            <div className="card-colorful p-5 sm:p-7 text-center">
              <div className="text-4xl sm:text-6xl mb-3">🎨</div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-rose-600 mb-2">{totalNFTMinted}</div>
              <div className="text-xs sm:text-sm text-light-500 font-medium tracking-wide">NFT 总铸造</div>
            </div>
          </div>

          {/* 详细统计 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* 官方NFT统计 */}
            <div className="card-colorful p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-light-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-100 rounded-xl flex items-center justify-center">🏛️</span>
                官方NFT发放统计
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {officialSupplies.map((item, index) => {
                  const type = NFT_TYPES[index];
                  const percent = getPercentage(item.supply, item.max);
                  return (
                    <div key={index} className={`${type.bg} rounded-xl p-3 sm:p-4 border-2 ${type.border}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold text-sm sm:text-base ${type.text}`}>{item.name}</span>
                        <span className={`text-sm sm:text-base font-bold ${type.text}`}>
                          {item.supply} / {item.max}
                        </span>
                      </div>
                      <div className="h-2 sm:h-3 bg-white/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${type.bar} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className={`text-right text-xs mt-1 ${type.text}`}>
                        {percent}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-3 border-t-2 border-light-200 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-light-700">官方NFT总计</span>
                  <span className="text-xl sm:text-2xl font-bold text-accent-600">{totalOfficialMinted}</span>
                </div>
              </div>
            </div>

            {/* 个人NFT统计 */}
            <div className="card-colorful p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-light-800 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-100 rounded-xl flex items-center justify-center">🎨</span>
                个人NFT铸造统计
              </h2>
              
              {/* 总数 */}
              <div className="bg-gradient-to-r from-rose-50 to-accent-50 rounded-xl p-4 sm:p-6 mb-4 border-2 border-rose-200">
                <div className="text-center">
                  <div className="text-4xl sm:text-6xl font-bold gradient-text mb-2">{personalNFTCount}</div>
                  <div className="text-sm sm:text-base text-light-600 font-medium">个人NFT总铸造量</div>
                </div>
              </div>

              {/* 稀有度分布 */}
              <h3 className="font-bold text-light-700 mb-3 text-sm sm:text-base">
                稀有度分布{dbStats && dbStats.distribution.rarity.length > 0 ? '（真实数据）' : '（估算）'}
              </h3>
              <div className="space-y-3">
                {RARITY_INFO.map((rarity, index) => {
                  const count = index === 0 ? rarityStats.common : index === 1 ? rarityStats.rare : rarityStats.legendary;
                  const percent = getPercentage(count, personalNFTCount);
                  // 使用固定颜色类名，避免Tailwind动态类名问题
                  const colorClasses = [
                    { bg: 'bg-teal-100', border: 'border-teal-200', text: 'text-teal-700', bar: 'bg-teal-400' },
                    { bg: 'bg-primary-100', border: 'border-primary-200', text: 'text-primary-700', bar: 'bg-primary-400' },
                    { bg: 'bg-accent-100', border: 'border-accent-200', text: 'text-accent-700', bar: 'bg-accent-400' },
                  ];
                  const colors = colorClasses[index];
                  return (
                    <div key={index} className={`${colors.bg} rounded-xl p-3 border-2 ${colors.border}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`font-bold text-sm ${colors.text}`}>
                          {rarity.icon} {rarity.name}
                        </span>
                        <span className={`font-bold ${colors.text}`}>{count}</span>
                      </div>
                      <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors.bar} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-right text-xs text-light-500 mt-1">{percent}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 学院分布 & 最近活动 */}
          {dbStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 items-start">
              {/* 学院分布 */}
              {dbStats.distribution.college.length > 0 && (
                <div className="card-colorful p-4 sm:p-6 flex flex-col">
                  <h2 className="text-lg sm:text-xl font-bold text-light-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-xl flex items-center justify-center">🏛️</span>
                    学院分布
                  </h2>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {dbStats.distribution.college.map((item, index) => {
                      const total = dbStats.distribution.college.reduce((sum, c) => sum + c.count, 0);
                      const percent = getPercentage(item.count, total);
                      const colorClasses = [
                        'bg-primary-400', 
                        'bg-teal-400', 
                        'bg-accent-400', 
                        'bg-rose-400', 
                        'bg-indigo-400' // Fallback or standard tailwind color
                      ];
                      const bgClass = colorClasses[index % colorClasses.length];
                      return (
                        <div key={index} className="bg-white/50 rounded-xl p-3 border border-light-200">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm text-light-800">{item.name}</span>
                            <span className="font-bold text-light-600">{item.count} 人</span>
                          </div>
                          <div className="h-2 bg-light-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${bgClass} transition-all duration-500`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="text-right text-xs text-light-500 mt-1">{percent}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 最近活动 */}
              {dbStats.recentActivity.length > 0 && (
                <div className="card-colorful p-4 sm:p-6 flex flex-col">
                  <h2 className="text-lg sm:text-xl font-bold text-light-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-100 rounded-xl flex items-center justify-center">📝</span>
                    最近活动
                    <span className="text-sm font-normal text-light-500">({dbStats.recentActivity.length}条)</span>
                  </h2>
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {dbStats.recentActivity.map((activity, index) => (
                      <div key={index} className="bg-white/50 rounded-xl p-3 border border-light-200 hover:border-primary-300 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {activity.type === 'official' ? '🏛️' : activity.rarity === 2 ? '💎' : activity.rarity === 1 ? '🌟' : '🎨'}
                            </span>
                            <span className="font-bold text-sm text-light-800">
                              {activity.type === 'official' ? '官方NFT' : '个人NFT'} #{activity.tokenId}
                            </span>
                          </div>
                          <span className="text-xs text-light-500">
                            {new Date(activity.time).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-light-600">
                          铸造者: {activity.user}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 系统信息 */}
          <div className="card-colorful p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-light-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-xl flex items-center justify-center">⚙️</span>
              系统信息
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/50 rounded-xl p-4 border border-light-200">
                <div className="text-xs text-light-500 mb-1">合约地址</div>
                <div className="font-mono text-xs sm:text-sm text-light-700 break-all">
                  {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
                </div>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-light-200">
                <div className="text-xs text-light-500 mb-1">代币标准</div>
                <div className="font-bold text-light-800">ERC-1155</div>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-light-200">
                <div className="text-xs text-light-500 mb-1">网络</div>
                <div className="font-bold text-light-800">{chain?.name || '未连接'}</div>
              </div>
              <div className="bg-white/50 rounded-xl p-4 border border-light-200">
                <div className="text-xs text-light-500 mb-1">下一个Token ID</div>
                <div className="font-bold text-light-800">{nextPersonalTokenId?.toString() || '10001'}</div>
              </div>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="card-colorful p-4 sm:p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/" className="btn-secondary text-sm">🏠 返回首页</Link>
              <Link href="/my-nfts" className="btn-primary text-sm">💎 我的NFT</Link>
              {isAdmin && (
                <Link href="/admin" className="btn-accent text-sm">⚙️ 管理面板</Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <BackToTop />
      <Footer />
    </div>
  );
}

