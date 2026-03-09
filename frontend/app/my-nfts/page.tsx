'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { NFTGridSkeleton, StatRowSkeleton } from '@/components/Skeleton';
import { contractABI, contractAddress, NFT_INFO, PERSONAL_RARITY } from '@/lib/contract';
import Link from 'next/link';

// 官方NFT IDs
const OFFICIAL_IDS = [1, 2, 3, 4];

// 筛选类型
type FilterType = 'all' | 'official' | 'personal';
type RarityFilter = 'all' | 0 | 1 | 2;

export default function MyNFTsPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [personalNFTs, setPersonalNFTs] = useState<Array<{
    tokenId: number;
    rarity: number;
    colorSeed: string;
    mintNumber: number;
  }>>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  // 筛选状态
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 读取官方NFT余额
  const { data: b1 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(1)] : undefined });
  const { data: b2 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(2)] : undefined });
  const { data: b3 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(3)] : undefined });
  const { data: b4 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(4)] : undefined });

  // 获取下一个个人NFT的Token ID（用于确定遍历范围）
  const { data: nextTokenId } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'nextPersonalTokenId',
  });

  const officialBalances: Record<number, number> = {
    1: Number(b1 || 0), 2: Number(b2 || 0), 3: Number(b3 || 0), 4: Number(b4 || 0),
  };

  const totalOfficial = Object.values(officialBalances).reduce((a, b) => a + b, 0);

  // 加载用户的个人NFT（优化版本：使用批量查询）
  useEffect(() => {
    const loadPersonalNFTs = async () => {
      const maxId = Number(nextTokenId || 10001);
      
      // 只有当有个人NFT被铸造过才需要遍历
      if (!address || !publicClient || maxId <= 10001) {
        setPersonalNFTs([]);
        setLoadingPersonal(false);
        return;
      }

      setLoadingPersonal(true);
      const nfts: typeof personalNFTs = [];

      // 优化：使用多调用（multicall）批量查询余额
      // 将tokenId分批处理，每批100个
      const BATCH_SIZE = 100;
      const totalTokens = maxId - 10001;
      
      console.log(`🔄 开始加载个人NFT，总共 ${totalTokens} 个token需要检查...`);
      const startTime = Date.now();

      for (let batchStart = 10001; batchStart < maxId; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, maxId);
        const batchPromises = [];

        // 创建批次查询
        for (let tokenId = batchStart; tokenId < batchEnd; tokenId++) {
          batchPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: contractABI,
              functionName: 'balanceOf',
              args: [address, BigInt(tokenId)],
            }).then((balance: unknown) => ({ tokenId, balance: Number(balance) }))
            .catch(() => ({ tokenId, balance: 0 }))
          );
        }

        // 等待批次完成
        const batchResults = await Promise.all(batchPromises) as { tokenId: number; balance: number }[];
        
        // 筛选出用户拥有的NFT
        const ownedTokens = batchResults.filter((r: { tokenId: number; balance: number }) => r.balance > 0);
        
        // 批量获取拥有的NFT详情
        if (ownedTokens.length > 0) {
          const detailPromises = ownedTokens.map(({ tokenId }: { tokenId: number }) =>
            publicClient.readContract({
              address: contractAddress,
              abi: contractABI,
              functionName: 'getPersonalNFTData',
              args: [BigInt(tokenId)],
            }).then((data: unknown) => {
              const d = data as [string, number, bigint, bigint, bigint];
              return {
                tokenId,
                rarity: Number(d[1]),
                colorSeed: d[3].toString(),
                mintNumber: Number(d[4]),
              };
            }).catch(() => ({
              tokenId,
              rarity: 0,
              colorSeed: '0',
              mintNumber: tokenId - 10000,
            }))
          );
          
          const details = await Promise.all(detailPromises);
          nfts.push(...details);
        }

        // 每批次完成后更新进度（可选）
        if (batchEnd < maxId) {
          console.log(`⏳ 已处理 ${batchEnd - 10001}/${totalTokens}...`);
        }
      }

      const elapsed = Date.now() - startTime;
      console.log(`✅ 个人NFT加载完成，找到 ${nfts.length} 个，耗时 ${elapsed}ms`);

      setPersonalNFTs(nfts);
      setLoadingPersonal(false);
    };

    loadPersonalNFTs();
  }, [address, publicClient, nextTokenId]);

  // 构建所有拥有的官方NFT列表
  const ownedOfficialNFTs = useMemo(() => {
    return OFFICIAL_IDS.filter(id => officialBalances[id] > 0).map(id => ({
      tokenId: id,
      balance: officialBalances[id],
      nft: NFT_INFO[id],
    }));
  }, [officialBalances]);

  // 筛选逻辑
  const filteredOfficialNFTs = useMemo(() => {
    if (typeFilter === 'personal') return [];
    
    return ownedOfficialNFTs.filter(item => {
      // 搜索筛选
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = item.nft?.name?.toLowerCase().includes(query);
        const idMatch = item.tokenId.toString().includes(query);
        if (!nameMatch && !idMatch) return false;
      }
      return true;
    });
  }, [typeFilter, ownedOfficialNFTs, searchQuery]);

  const filteredPersonalNFTs = useMemo(() => {
    if (typeFilter === 'official') return [];
    
    return personalNFTs.filter(nft => {
      // 稀有度筛选
      if (rarityFilter !== 'all' && nft.rarity !== rarityFilter) {
        return false;
      }
      // 搜索筛选
      if (searchQuery.trim()) {
        const query = searchQuery.trim();
        const idMatch = nft.tokenId.toString().includes(query);
        const numMatch = nft.mintNumber.toString().includes(query);
        if (!idMatch && !numMatch) return false;
      }
      return true;
    });
  }, [typeFilter, personalNFTs, rarityFilter, searchQuery]);

  const totalOwned = totalOfficial + personalNFTs.length;
  const filteredTotal = filteredOfficialNFTs.length + filteredPersonalNFTs.length;

  // 官方NFT卡片 - 直接链接到详情页
  const OfficialNFTCard = ({ id, balance }: { id: number; balance: number }) => {
    const nft = NFT_INFO[id];
    if (!nft) return null;

    return (
      <Link 
        href={`/nft/${id}`}
        className="card-accent overflow-hidden group hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 cursor-pointer block"
      >
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={`/api/image/${id}`} 
            alt={nft.name}
            className="w-full h-full object-cover group-hover:scale-105 sm:group-hover:scale-110 transition-transform duration-500"
          />
          {balance > 1 && (
            <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold border-2 border-accent-200 text-accent-700 shadow-lg">
              x{balance}
            </div>
          )}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
            <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-accent-100 text-accent-700 rounded-full text-[10px] sm:text-xs font-bold border-2 border-accent-200">
              🏛️ 官方
            </span>
          </div>
        </div>
        <div className="p-2.5 sm:p-4 bg-white/50">
          <h3 className="font-bold mb-0.5 sm:mb-1 text-light-800 text-sm sm:text-base truncate">{nft.name}</h3>
          <p className="text-light-500 text-xs sm:text-sm truncate">{nft.description}</p>
        </div>
      </Link>
    );
  };

  // 个人NFT卡片 - 直接链接到详情页
  const PersonalNFTCard = ({ nft }: { nft: typeof personalNFTs[0] }) => {
    const rarityInfo = PERSONAL_RARITY[nft.rarity as keyof typeof PERSONAL_RARITY];
    const cardClass = nft.rarity === 2 ? 'card-accent' : nft.rarity === 1 ? 'card-colorful' : 'card-teal';

    return (
      <Link 
        href={`/nft/${nft.tokenId}?rarity=${nft.rarity}&colorSeed=${nft.colorSeed}&mintNumber=${nft.mintNumber}`}
        className={`${cardClass} overflow-hidden group hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 cursor-pointer block`}
      >
        <div className="aspect-square relative overflow-hidden">
          <img 
            src={`/api/image/${nft.tokenId}?rarity=${nft.rarity}&colorSeed=${nft.colorSeed}&mintNumber=${nft.mintNumber}`}
            alt={`NFT #${nft.mintNumber}`}
            className="w-full h-full object-cover group-hover:scale-105 sm:group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg ${
              nft.rarity === 2 ? 'bg-gradient-to-r from-accent-100 to-rose-100 text-accent-700 border-2 border-accent-200' :
              nft.rarity === 1 ? 'bg-primary-100 text-primary-700 border-2 border-primary-200' :
              'bg-teal-100 text-teal-700 border-2 border-teal-200'
            }`}>
              {rarityInfo?.icon} {rarityInfo?.name}
            </span>
          </div>
        </div>
        <div className="p-2.5 sm:p-4 bg-white/50">
          <h3 className="font-bold mb-0.5 sm:mb-1 text-light-800 text-sm sm:text-base">纪念 #{nft.mintNumber}</h3>
          <p className="text-light-500 text-xs sm:text-sm">ID: {nft.tokenId}</p>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen celebration-bg">
      <Header />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block px-5 py-2 bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 rounded-full text-sm font-bold mb-4 border-2 border-teal-200 shadow-sm">
              💎 我的收藏
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 text-light-800">
              我的 <span className="gradient-text">NFT 收藏</span>
            </h1>
            <p className="text-light-600 text-base sm:text-lg">
              点击NFT查看详细信息 🎓
            </p>
          </div>

          {!isConnected ? (
            <div className="card-colorful p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">🔗</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-light-800">请先连接钱包</h2>
              <p className="text-light-500 text-sm sm:text-base">连接您的钱包以查看您拥有的NFT</p>
            </div>
          ) : (
            <>
              {/* 统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
                <div className="stat-card gold">
                  <div className="text-2xl sm:text-4xl font-display font-bold gradient-text mb-1">{totalOwned}</div>
                  <div className="text-primary-500 text-xs sm:text-sm font-medium">🎯 NFT总数</div>
                </div>
                <div className="stat-card purple">
                  <div className="text-2xl sm:text-4xl font-display font-bold text-accent-600 mb-1">{totalOfficial}</div>
                  <div className="text-accent-500 text-xs sm:text-sm font-medium">🏛️ 官方认证</div>
                </div>
                <div className="stat-card rose">
                  <div className="text-2xl sm:text-4xl font-display font-bold text-rose-600 mb-1">{personalNFTs.length}</div>
                  <div className="text-rose-500 text-xs sm:text-sm font-medium">🎨 个人纪念</div>
                </div>
                <div className="stat-card teal">
                  <div className="text-2xl sm:text-4xl font-display font-bold text-teal-600 mb-1">
                    {personalNFTs.filter(n => n.rarity >= 1).length}
                  </div>
                  <div className="text-teal-500 text-xs sm:text-sm font-medium">✨ 稀有/传说</div>
                </div>
              </div>

              {/* 搜索和筛选 */}
              {totalOwned > 0 && (
                <div className="card-colorful p-4 sm:p-6 mb-6">
                  <div className="flex flex-col gap-4">
                    {/* 搜索框 */}
                    <div className="relative w-full">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 搜索 Token ID 或编号..."
                        className="input-field pl-10 pr-10 text-base"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-light-400 hover:text-light-600 text-lg p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* 筛选按钮 */}
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setTypeFilter('all')}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                            typeFilter === 'all'
                              ? 'bg-primary-500 text-white shadow-lg'
                              : 'bg-white text-light-600 border-2 border-light-200 hover:border-primary-300'
                          }`}
                        >
                          全部 ({totalOwned})
                        </button>
                        <button
                          onClick={() => setTypeFilter('official')}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                            typeFilter === 'official'
                              ? 'bg-accent-500 text-white shadow-lg'
                              : 'bg-white text-light-600 border-2 border-light-200 hover:border-accent-300'
                          }`}
                        >
                          🏛️ 官方 ({totalOfficial})
                        </button>
                        <button
                          onClick={() => setTypeFilter('personal')}
                          className={`flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                            typeFilter === 'personal'
                              ? 'bg-rose-500 text-white shadow-lg'
                              : 'bg-white text-light-600 border-2 border-light-200 hover:border-rose-300'
                          }`}
                        >
                          🎨 个人 ({personalNFTs.length})
                        </button>
                      </div>

                      <div className="flex gap-2 items-center">
                        {/* 稀有度筛选 - 仅在显示个人NFT时显示 */}
                        {typeFilter !== 'official' && personalNFTs.length > 0 && (
                          <select
                            value={rarityFilter}
                            onChange={(e) => setRarityFilter(e.target.value === 'all' ? 'all' : Number(e.target.value) as RarityFilter)}
                            className="select-field text-sm py-2 flex-1 sm:w-auto"
                          >
                            <option value="all">全部稀有度</option>
                            <option value="0">🎨 普通</option>
                            <option value="1">🌟 稀有</option>
                            <option value="2">💎 传说</option>
                          </select>
                        )}

                        {/* 筛选结果提示 */}
                        {(typeFilter !== 'all' || rarityFilter !== 'all') && (
                          <span className="text-xs sm:text-sm text-light-500 whitespace-nowrap ml-auto sm:ml-0">
                            共 {filteredTotal} 个
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {totalOwned === 0 ? (
                <div className="card-colorful p-8 sm:p-12 text-center">
                  <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">📭</div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-light-800">暂无NFT</h2>
                  <p className="text-light-500 mb-4 sm:mb-6 text-sm sm:text-base">
                    您还没有任何毕业纪念NFT，去铸造属于你的专属纪念品吧！
                  </p>
                  <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                    <Link href="/" className="btn-secondary text-sm">🏠 返回首页</Link>
                    <Link href="/mint" className="btn-primary text-sm">🎲 去铸造</Link>
                  </div>
                </div>
              ) : filteredTotal === 0 ? (
                <div className="card-colorful p-8 sm:p-12 text-center">
                  <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">🔍</div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-light-800">未找到匹配的NFT</h2>
                  <p className="text-light-500 mb-4 sm:mb-6 text-sm sm:text-base">尝试调整筛选条件</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setTypeFilter('all');
                      setRarityFilter('all');
                    }}
                    className="btn-primary text-sm"
                  >
                    清除筛选
                  </button>
                </div>
              ) : (
                <>
                  {/* 官方认证NFT */}
                  {filteredOfficialNFTs.length > 0 && (
                    <div className="mb-6 sm:mb-8">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <span className="text-xl sm:text-2xl">🏛️</span>
                        <h2 className="text-lg sm:text-xl font-bold text-light-800">官方认证</h2>
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-accent-100 text-accent-700 rounded-full text-xs sm:text-sm font-bold">
                          {filteredOfficialNFTs.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                        {filteredOfficialNFTs.map((item) => (
                          <OfficialNFTCard key={item.tokenId} id={item.tokenId} balance={item.balance} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 个人纪念NFT */}
                  {filteredPersonalNFTs.length > 0 && (
                    <div className="mb-6 sm:mb-8">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <span className="text-xl sm:text-2xl">🎨</span>
                        <h2 className="text-lg sm:text-xl font-bold text-light-800">个人纪念</h2>
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-rose-100 text-rose-700 rounded-full text-xs sm:text-sm font-bold">
                          {filteredPersonalNFTs.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                        {filteredPersonalNFTs.map((nft) => (
                          <PersonalNFTCard key={nft.tokenId} nft={nft} />
                        ))}
                      </div>
                    </div>
                  )}

                  {loadingPersonal && (
                    <div className="mb-6 sm:mb-8">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <span className="text-xl sm:text-2xl">⏳</span>
                        <h2 className="text-lg sm:text-xl font-bold text-light-800">加载中...</h2>
                      </div>
                      <NFTGridSkeleton count={4} />
                    </div>
                  )}

                  {/* 快捷操作 */}
                  <div className="card-colorful p-4 sm:p-6">
                    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                      <Link href="/mint" className="btn-primary text-sm">🎲 继续铸造</Link>
                      <Link href="/transfer" className="btn-teal text-sm">🔄 转让NFT</Link>
                      <Link href="/" className="btn-secondary text-sm">🏠 返回首页</Link>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>

      <BackToTop />
      <Footer />
    </div>
  );
}
