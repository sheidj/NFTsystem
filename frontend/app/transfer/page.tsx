'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { contractABI, contractAddress, NFT_INFO, PERSONAL_RARITY } from '@/lib/contract';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

// 官方NFT IDs
const OFFICIAL_IDS = [1, 2, 3, 4];

interface OwnedNFT {
  tokenId: number;
  balance: number;
  name: string;
  icon: string;
  type: 'official' | 'personal';
  rarity?: number;
  colorSeed?: string;
  mintNumber?: number;
}

export default function TransferPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { showToast } = useToast();

  const [ownedNFTs, setOwnedNFTs] = useState<OwnedNFT[]>([]);
  const [selectedNFT, setSelectedNFT] = useState<OwnedNFT | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('1');
  const [loading, setLoading] = useState(true);

  // 官方NFT余额
  const { data: balance1 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: address ? [address, BigInt(1)] : undefined,
  });
  const { data: balance2 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: address ? [address, BigInt(2)] : undefined,
  });
  const { data: balance3 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: address ? [address, BigInt(3)] : undefined,
  });
  const { data: balance4 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: address ? [address, BigInt(4)] : undefined,
  });

  // 获取下一个个人NFT的Token ID（用于确定范围）
  const { data: nextTokenId } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'nextPersonalTokenId',
  });

  // 转让合约调用
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  // 计算官方NFT数量（用于显示提示）
  const officialNFTCount = [
    Number(balance1 || 0),
    Number(balance2 || 0),
    Number(balance3 || 0),
    Number(balance4 || 0),
  ].reduce((sum, b) => sum + (b > 0 ? 1 : 0), 0);

  // 加载拥有的NFT（只加载个人NFT，官方NFT不可转让）
  useEffect(() => {
    const loadNFTs = async () => {
      if (!address || !publicClient) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const nfts: OwnedNFT[] = [];

      // 注意：官方NFT不可转让，所以不加入列表
      // 只加载个人NFT（使用批量查询优化）
      const maxTokenId = Number(nextTokenId || 10001);

      // 遍历所有可能的个人NFT token ID，检查用户是否拥有
      if (maxTokenId > 10001) {
        const BATCH_SIZE = 100;
        const totalTokens = maxTokenId - 10001;
        
        console.log(`🔄 开始加载个人NFT，总共 ${totalTokens} 个token需要检查...`);
        const startTime = Date.now();

        for (let batchStart = 10001; batchStart < maxTokenId; batchStart += BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + BATCH_SIZE, maxTokenId);
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
            const detailPromises = ownedTokens.map(({ tokenId, balance }: { tokenId: number; balance: number }) =>
              publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'getPersonalNFTData',
                args: [BigInt(tokenId)],
              }).then((data: unknown) => {
                const d = data as [string, number, bigint, bigint, bigint];
                const rarity = Number(d[1]);
                const rarityInfo = PERSONAL_RARITY[rarity as keyof typeof PERSONAL_RARITY];
                return {
                  tokenId,
                  balance,
                  name: `毕业纪念 #${Number(d[4])}`,
                  icon: rarityInfo?.icon || '🎨',
                  type: 'personal' as const,
                  rarity,
                  colorSeed: d[3].toString(),
                  mintNumber: Number(d[4]),
                };
              }).catch(() => ({
                tokenId,
                balance,
                name: `个人NFT #${tokenId}`,
                icon: '🎨',
                type: 'personal' as const,
              }))
            );
            
            const details = await Promise.all(detailPromises);
            nfts.push(...details);
          }

          // 每批次完成后更新进度（可选）
          if (batchEnd < maxTokenId) {
            console.log(`⏳ 已处理 ${batchEnd - 10001}/${totalTokens}...`);
          }
        }

        const elapsed = Date.now() - startTime;
        console.log(`✅ 个人NFT加载完成，找到 ${nfts.length} 个，耗时 ${elapsed}ms`);
      }

      setOwnedNFTs(nfts);
      setLoading(false);
    };

    loadNFTs();
  }, [address, publicClient, balance1, balance2, balance3, balance4, nextTokenId]);

  // 转让成功处理
  useEffect(() => {
    if (isSuccess) {
      showToast({
        type: 'success',
        title: '转让成功！',
        message: `已将 ${selectedNFT?.name} 转让给 ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}`,
      });
      setSelectedNFT(null);
      setRecipientAddress('');
      setTransferAmount('1');
      reset();
      // 重新加载NFT列表
      window.location.reload();
    }
    if (isError) {
      showToast({
        type: 'error',
        title: '转让失败',
        message: '交易执行失败，请重试',
      });
    }
  }, [isSuccess, isError, selectedNFT, recipientAddress, showToast, reset]);

  // 执行转让
  const handleTransfer = () => {
    if (!selectedNFT || !recipientAddress || !address) {
      showToast({
        type: 'error',
        title: '信息不完整',
        message: '请选择NFT并输入接收地址',
      });
      return;
    }

    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      showToast({
        type: 'error',
        title: '地址格式错误',
        message: '请输入有效的以太坊地址',
      });
      return;
    }

    // 不能转给自己
    if (recipientAddress.toLowerCase() === address.toLowerCase()) {
      showToast({
        type: 'error',
        title: '无效操作',
        message: '不能转让给自己',
      });
      return;
    }

    const amount = parseInt(transferAmount) || 1;
    if (amount > selectedNFT.balance) {
      showToast({
        type: 'error',
        title: '数量超出',
        message: `您只拥有 ${selectedNFT.balance} 个该NFT`,
      });
      return;
    }

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'safeTransferFrom',
      args: [
        address,
        recipientAddress as `0x${string}`,
        BigInt(selectedNFT.tokenId),
        BigInt(amount),
        '0x' as `0x${string}`,
      ],
    });
  };

  return (
    <div className="min-h-screen celebration-bg">
      <Header />
      
      <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 rounded-full text-xs sm:text-sm font-bold mb-3 sm:mb-4 border-2 border-teal-200 shadow-sm">
              🔄 NFT转让
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-4 text-light-800">
              转让 <span className="gradient-text">个人纪念NFT</span> 🎁
            </h1>
            <p className="text-light-600 text-sm sm:text-lg">
              将您铸造的个人纪念品转让或赠送给其他用户
            </p>
            <p className="text-light-400 text-xs sm:text-sm mt-2">
              ⚠️ 官方认证NFT（毕业证书、荣誉证书等）不可转让
            </p>
          </div>

          {!isConnected ? (
            <div className="card-colorful p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">🔗</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-light-800">请先连接钱包</h2>
              <p className="text-light-500 text-sm sm:text-base">连接钱包后即可转让您的NFT</p>
            </div>
          ) : loading ? (
            <div className="card-colorful p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-7xl mb-4 sm:mb-6 animate-bounce">⏳</div>
              <p className="text-light-500">加载中...</p>
            </div>
          ) : ownedNFTs.length === 0 ? (
            <div className="card-colorful p-8 sm:p-12 text-center">
              <div className="text-5xl sm:text-7xl mb-4 sm:mb-6">📭</div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-light-800">暂无可转让的NFT</h2>
              <p className="text-light-500 mb-4 text-sm sm:text-base">您还没有任何个人纪念NFT可以转让</p>
              {officialNFTCount > 0 && (
                <div className="bg-primary-50 rounded-xl p-4 mb-6 border-2 border-primary-200 max-w-md mx-auto">
                  <p className="text-primary-700 text-sm">
                    💡 您拥有 <span className="font-bold">{officialNFTCount}</span> 个官方认证NFT，
                    但官方NFT（毕业证书、荣誉证书等）代表个人身份认证，<span className="font-bold">不可转让</span>。
                  </p>
                </div>
              )}
              <Link href="/mint" className="btn-primary text-sm">🎲 去铸造个人纪念品</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* 选择NFT */}
              <div className="card-colorful p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-light-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-xl flex items-center justify-center">1️⃣</span>
                  选择要转让的个人NFT
                </h2>

                {/* 官方NFT提示 */}
                {officialNFTCount > 0 && (
                  <div className="bg-accent-50 rounded-xl p-3 mb-4 border border-accent-200">
                    <p className="text-accent-700 text-xs">
                      🏛️ 您拥有 {officialNFTCount} 个官方NFT（不可转让）
                    </p>
                  </div>
                )}
                
                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {ownedNFTs.map((nft) => {
                    const rarityInfo = nft.rarity !== undefined ? PERSONAL_RARITY[nft.rarity as keyof typeof PERSONAL_RARITY] : null;
                    return (
                      <button
                        key={nft.tokenId}
                        onClick={() => setSelectedNFT(nft)}
                        className={`w-full p-3 sm:p-4 rounded-xl border-2 text-left transition-all ${
                          selectedNFT?.tokenId === nft.tokenId
                            ? 'border-teal-400 bg-teal-50'
                            : 'border-light-200 bg-white hover:border-teal-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl sm:text-3xl">{nft.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm sm:text-base text-light-800 truncate">{nft.name}</div>
                            <div className="text-xs text-light-500">
                              Token ID: {nft.tokenId} · 拥有: {nft.balance}
                            </div>
                          </div>
                          {rarityInfo && (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              nft.rarity === 2 ? 'bg-accent-100 text-accent-700' :
                              nft.rarity === 1 ? 'bg-primary-100 text-primary-700' :
                              'bg-teal-100 text-teal-700'
                            }`}>
                              {rarityInfo.icon} {rarityInfo.name}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 转让信息 */}
              <div className="card-colorful p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-light-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-xl flex items-center justify-center">2️⃣</span>
                  填写转让信息
                </h2>

                {selectedNFT ? (
                  <div className="space-y-4">
                    {/* 已选NFT预览 */}
                    <div className="bg-teal-50 rounded-xl p-4 border-2 border-teal-200">
                      <div className="text-sm text-teal-600 mb-1">已选择</div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{selectedNFT.icon}</span>
                        <span className="font-bold text-light-800">{selectedNFT.name}</span>
                      </div>
                    </div>

                    {/* 接收地址 */}
                    <div>
                      <label className="block text-xs sm:text-sm text-light-600 mb-1.5 font-medium">
                        接收地址 *
                      </label>
                      <input
                        type="text"
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        placeholder="0x..."
                        className="input-field font-mono text-xs sm:text-sm"
                      />
                    </div>

                    {/* 转让数量 */}
                    {selectedNFT.balance > 1 && (
                      <div>
                        <label className="block text-xs sm:text-sm text-light-600 mb-1.5 font-medium">
                          转让数量 (最多 {selectedNFT.balance})
                        </label>
                        <input
                          type="number"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          min="1"
                          max={selectedNFT.balance}
                          className="input-field"
                        />
                      </div>
                    )}

                    {/* 转让按钮 */}
                    <button
                      onClick={handleTransfer}
                      disabled={isPending || isConfirming || !recipientAddress}
                      className="btn-teal w-full text-sm sm:text-base"
                    >
                      {isPending || isConfirming ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          处理中...
                        </span>
                      ) : (
                        '🔄 确认转让'
                      )}
                    </button>

                    {/* 提示 */}
                    <div className="bg-primary-50 rounded-xl p-3 border border-primary-200">
                      <p className="text-xs text-primary-700">
                        ⚠️ 转让后NFT将从您的账户转移到接收地址，此操作不可撤销。请仔细核对接收地址。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="text-5xl mb-4">👈</div>
                    <p className="text-light-500 text-sm sm:text-base">请先从左侧选择要转让的NFT</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 快捷操作 */}
          <div className="mt-6 sm:mt-8 card-colorful p-4 sm:p-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/my-nfts" className="btn-secondary text-sm">💎 我的NFT</Link>
              <Link href="/mint" className="btn-primary text-sm">🎲 铸造NFT</Link>
            </div>
          </div>
        </div>
      </main>

      <BackToTop />
      <Footer />
    </div>
  );
}

