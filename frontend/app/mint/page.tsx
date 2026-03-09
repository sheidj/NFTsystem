'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { contractABI, contractAddress, PERSONAL_RARITY } from '@/lib/contract';
import { useToast } from '@/components/Toast';

const RARITY_INFO = [
  { name: '普通', icon: '🎨', rate: '70%', color: 'from-teal-400 to-teal-500', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', textColor: 'text-teal-600' },
  { name: '稀有', icon: '🌟', rate: '25%', color: 'from-primary-400 to-primary-500', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', textColor: 'text-primary-600' },
  { name: '传说', icon: '💎', rate: '5%', color: 'from-accent-400 to-rose-400', bgColor: 'bg-accent-50', borderColor: 'border-accent-200', textColor: 'text-accent-600' },
];

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { showToast } = useToast();
  const [mintResult, setMintResult] = useState<{
    tokenId: number;
    rarity: number;
    colorSeed: string;
    mintNumber: number;
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [processedHashes, setProcessedHashes] = useState<Set<string>>(new Set());

  const { data: isRegistered } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'isRegisteredGraduate',
    args: address ? [address] : undefined,
  });

  const { data: remainingMints, refetch: refetchRemaining } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getRemainingDailyMints',
    args: address ? [address] : undefined,
  });

  const { data: pityCounter, refetch: refetchPity } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getPityCounter',
    args: address ? [address] : undefined,
  });

  const { data: totalMinted, refetch: refetchTotal } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'totalPersonalMinted',
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // 铸造成功后处理
  useEffect(() => {
    if (isSuccess && hash && publicClient) {
      // 防止重复处理同一个交易
      if (processedHashes.has(hash)) {
        return;
      }
      
      setProcessedHashes(prev => new Set(prev).add(hash));
      setIsAnimating(true);
      
      // 获取交易收据以解析事件
      const fetchReceipt = async () => {
        try {
          const receipt = await publicClient.getTransactionReceipt({ hash });
          
          // 获取区块信息以获取链上时间
          const block = await publicClient.getBlock({ blockHash: receipt.blockHash });
          const mintTime = Number(block.timestamp); // 链上时间戳（秒）
          
          // 调试日志：显示时间信息（与区块链浏览器对比）
          const mintDate = new Date(mintTime * 1000);
          console.log('🕐 链上时间调试:', {
            blockNumber: block.number?.toString(),
            blockTimestampRaw: block.timestamp,
            mintTimeSeconds: mintTime,
            mintTimeISO: mintDate.toISOString(), // 用于对比区块链浏览器
            mintTimeUTC: mintDate.toUTCString(),
            expectedBrowserTime: new Date(mintTime * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
          });
          
          // 解析 PersonalNFTMinted 事件
          for (const log of receipt.logs) {
            if (log.topics.length >= 3) {
              const tokenId = parseInt(log.topics[2] as string, 16);
              
              if (tokenId >= 10001 && log.data) {
                const dataHex = log.data.slice(2);
                const rarity = parseInt(dataHex.slice(0, 64), 16);
                const colorSeed = BigInt('0x' + dataHex.slice(64, 128)).toString();
                const mintNumber = parseInt(dataHex.slice(128, 192), 16);
                
                const rarityNames = ['普通', '稀有', '传说'];
                
                // 同步到数据库（使用链上时间）
                fetch('/api/db/mint', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    walletAddress: address,
                    tokenId: tokenId,
                    type: 'personal',
                    rarity: rarity,
                    colorSeed: colorSeed.toString(),
                    mintNumber: mintNumber,
                    mintTime: mintTime, // 链上时间戳
                    txHash: hash,
                  }),
                }).catch(console.error);

                // 自动上传到IPFS
                console.log('🚀 开始上传NFT到IPFS...', { tokenId, rarity, colorSeed: colorSeed.toString(), mintNumber });
                fetch('/api/ipfs/upload-personal', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tokenId: tokenId,
                    rarity: rarity,
                    colorSeed: colorSeed.toString(),
                    mintNumber: mintNumber,
                  }),
                })
                  .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok) {
                      throw new Error(data.error || `HTTP ${res.status}`);
                    }
                    return data;
                  })
                  .then(data => {
                    if (data.success) {
                      console.log('✅ NFT已成功上传到IPFS！');
                      console.log('📷 图片CID:', data.imageCID);
                      console.log('📄 元数据CID:', data.metadataCID);
                      console.log('🔗 元数据URI:', data.metadataURI);
                      console.log('🌐 Pinata网关:', data.gateway);
                      
                      // 延迟显示IPFS上传成功提示，避免与铸造成功提示重叠
                      setTimeout(() => {
                        showToast({
                          type: 'success',
                          title: '📦 IPFS存储成功',
                          message: 'NFT元数据已永久存储到IPFS',
                        });
                      }, 1800);
                    } else {
                      console.warn('⚠️ IPFS上传失败:', data.error);
                    }
                  })
                  .catch(error => {
                    console.error('❌ IPFS上传错误:', error.message || error);
                    // 显示友好的错误提示
                    showToast({
                      type: 'warning',
                      title: 'IPFS上传失败',
                      message: '元数据未能上传，但NFT已成功铸造',
                    });
                  });

                showToast({
                  type: rarity >= 1 ? 'success' : 'info',
                  title: `🎉 铸造成功！`,
                  message: `获得${rarity >= 1 ? '✨' : ''}${rarityNames[rarity]}纪念品 #${mintNumber}`,
                });
                
                setTimeout(() => {
                  setMintResult({ tokenId, rarity, colorSeed, mintNumber });
                  setIsAnimating(false);
                  refetchRemaining();
                  refetchPity();
                  refetchTotal();
                }, 1500);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Error parsing receipt:', error);
          showToast({
            type: 'error',
            title: '解析失败',
            message: '无法获取NFT信息，请刷新页面查看',
          });
        }
        
        setTimeout(() => {
          setMintResult({ 
            tokenId: 10001, 
            rarity: 0, 
            colorSeed: Date.now().toString(), 
            mintNumber: Number(totalMinted || 0) + 1 
          });
          setIsAnimating(false);
          refetchRemaining();
          refetchPity();
          refetchTotal();
        }, 1500);
      };
      
      fetchReceipt();
    }
  }, [isSuccess, hash, publicClient, refetchRemaining, refetchPity, refetchTotal, totalMinted, showToast, processedHashes]);

  const handleMint = () => {
    if (!isRegistered) {
      showToast({
        type: 'error',
        title: '未注册',
        message: '您还未被注册为毕业生，请联系管理员',
      });
      return;
    }
    if (remaining <= 0) {
      showToast({
        type: 'warning',
        title: '今日次数已用完',
        message: '每天最多可铸造5次，明天再来吧！',
      });
      return;
    }
    setMintResult(null);
    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'mintPersonalNFT',
      args: [],
    });
  };

  const handleReset = () => {
    setMintResult(null);
    reset();
  };

  const remaining = Number(remainingMints || 0);
  const pity = Number(pityCounter || 0);
  const canMint = remaining > 0;

  const rarityInfo = mintResult ? RARITY_INFO[mintResult.rarity] : null;

  return (
    <div className="min-h-screen celebration-bg">
      <Header />
      <main className="pt-20 sm:pt-24 pb-16 sm:pb-20 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <span className="inline-block px-4 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-rose-100 to-rose-200 text-rose-700 rounded-full text-xs sm:text-sm font-bold mb-3 sm:mb-4 border-2 border-rose-200 shadow-sm">
              🎨 个人纪念品
            </span>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold mb-3 sm:mb-4 text-light-800">
              铸造唯一 <span className="gradient-text">纪念NFT</span> ✨
            </h1>
            <p className="text-light-600 text-sm sm:text-lg px-2">
              每个NFT都是独一无二的，拥有专属颜色和编号！🌈
            </p>
          </div>

          {/* 稀有度概率 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            {RARITY_INFO.map((info, index) => (
              <div key={index} className={`${info.bgColor} ${info.borderColor} border-2 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-center hover:scale-[1.02] sm:hover:scale-105 transition-all duration-300 shadow-card`}>
                <div className="text-3xl sm:text-5xl mb-1 sm:mb-3 drop-shadow-md">{info.icon}</div>
                <div className={`font-bold text-sm sm:text-lg ${info.textColor}`}>{info.name}</div>
                <div className={`text-xl sm:text-3xl font-bold mt-1 sm:mt-2 ${info.textColor}`}>{info.rate}</div>
              </div>
            ))}
          </div>

          {/* 铸造区域 */}
          <div className="card-colorful p-4 sm:p-8">
            {!isConnected ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-5xl sm:text-7xl mb-3 sm:mb-4">🔗</div>
                <p className="text-light-500 text-base sm:text-lg">请先连接钱包</p>
              </div>
            ) : !isRegistered ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-5xl sm:text-7xl mb-3 sm:mb-4">🔒</div>
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-light-800">未注册</h3>
                <p className="text-light-500 text-sm sm:text-base">您还未被注册为毕业生，请联系管理员</p>
              </div>
            ) : mintResult && rarityInfo ? (
              <div className="text-center py-6 sm:py-8">
                {/* 显示铸造的NFT图片 */}
                <div className="mb-4 sm:mb-6 inline-block rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                  <img 
                    src={`/api/image/${mintResult.tokenId}?rarity=${mintResult.rarity}&colorSeed=${mintResult.colorSeed}&mintNumber=${mintResult.mintNumber}`}
                    alt={`NFT #${mintResult.mintNumber}`}
                    className="w-48 h-48 sm:w-72 sm:h-72 object-cover"
                  />
                </div>
                <div className={`inline-block px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold mb-3 sm:mb-4 ${
                  mintResult.rarity === 2 ? 'bg-accent-100 text-accent-700 border-2 border-accent-200' :
                  mintResult.rarity === 1 ? 'bg-primary-100 text-primary-700 border-2 border-primary-200' :
                  'bg-teal-100 text-teal-700 border-2 border-teal-200'
                }`}>
                  {rarityInfo.icon} {rarityInfo.name}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-light-800">毕业纪念 #{mintResult.mintNumber} 🎉</h2>
                <p className="text-light-500 mb-2 text-sm sm:text-base">Token ID: {mintResult.tokenId}</p>
                <p className="text-light-400 text-xs sm:text-sm mb-6 sm:mb-8">独一无二的专属颜色！✨</p>
                <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                  <button onClick={handleReset} className="btn-secondary text-sm">继续铸造 🎲</button>
                  <a href="/my-nfts" className="btn-primary text-sm">查看我的NFT 💎</a>
                </div>
              </div>
            ) : isAnimating ? (
              <div className="text-center py-10 sm:py-16">
                <div className="text-6xl sm:text-9xl mb-4 sm:mb-6 animate-bounce">🎰</div>
                <p className="text-base sm:text-xl text-light-600">正在生成您的专属NFT... ✨</p>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="text-6xl sm:text-9xl mb-6 sm:mb-8 animate-float">🎁</div>
                
                {/* 状态显示 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="stat-card gold flex flex-row sm:flex-col items-center justify-between sm:justify-center p-4">
                    <div className="text-primary-500 text-sm mb-0 sm:mb-1 font-medium">🎯 今日剩余</div>
                    <div className="text-2xl sm:text-3xl font-bold text-primary-600">{remaining}<span className="text-base sm:text-lg text-primary-400">/5</span></div>
                  </div>
                  <div className="stat-card purple flex flex-row sm:flex-col items-center justify-between sm:justify-center p-4">
                    <div className="text-accent-500 text-sm mb-0 sm:mb-1 font-medium">⭐ 保底计数</div>
                    <div className="text-2xl sm:text-3xl font-bold text-accent-600">{pity}<span className="text-base sm:text-lg text-accent-400">/20</span></div>
                  </div>
                  <div className="stat-card teal flex flex-row sm:flex-col items-center justify-between sm:justify-center p-4">
                    <div className="text-teal-500 text-sm mb-0 sm:mb-1 font-medium">🌍 已铸造</div>
                    <div className="text-2xl sm:text-3xl font-bold text-teal-600">{totalMinted?.toString() || '0'}</div>
                  </div>
                </div>

                {/* 保底进度条 */}
                <div className="mb-6 sm:mb-8 max-w-md mx-auto px-2">
                  <div className="flex justify-between text-xs sm:text-sm text-light-600 mb-2 font-medium">
                    <span>⭐ 保底进度</span>
                    <span>{pity}/20 次后必出稀有</span>
                  </div>
                  <div className="h-3 sm:h-4 bg-light-200 rounded-full overflow-hidden border-2 border-light-300">
                    <div 
                      className="h-full bg-gradient-to-r from-accent-400 to-rose-400 transition-all duration-300"
                      style={{ width: `${(pity / 20) * 100}%` }}
                    />
                  </div>
                  {pity >= 15 && (
                    <p className="text-accent-600 text-xs sm:text-sm mt-2 font-bold">🔥 即将触发保底！</p>
                  )}
                </div>

                {/* 每日次数用完提示 */}
                {remaining === 0 && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-primary-100 border-2 border-primary-200 rounded-xl sm:rounded-2xl mx-2">
                    <p className="text-primary-700 text-xs sm:text-sm font-medium">
                      ⚠️ 今日铸造次数已用完，明天再来吧！
                    </p>
                  </div>
                )}

                <button
                  onClick={handleMint}
                  disabled={isPending || isConfirming || !canMint}
                  className={`px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-xl font-bold rounded-2xl sm:rounded-3xl transition-all ${
                    canMint && !isPending && !isConfirming
                      ? 'bg-gradient-to-r from-rose-400 via-rose-500 to-accent-500 text-white hover:scale-105 sm:hover:scale-110 shadow-xl shadow-rose-500/30 border-2 border-rose-400/50'
                      : 'bg-light-300 text-light-500 cursor-not-allowed border-2 border-light-400'
                  }`}
                >
                  {isPending || isConfirming ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      铸造中...
                    </span>
                  ) : !canMint ? '今日次数已用完 😴' : '🎲 铸造唯一NFT ✨'}
                </button>
              </div>
            )}
          </div>

          {/* 规则说明 */}
          <div className="mt-6 sm:mt-10 card p-4 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-light-800 flex items-center gap-2">
              <span className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-100 rounded-xl flex items-center justify-center text-sm sm:text-base">📋</span>
              铸造规则
            </h3>
            <ul className="space-y-2 sm:space-y-4 text-light-600 text-sm">
              <li className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-teal-50 rounded-xl sm:rounded-2xl border-2 border-teal-100">
                <span className="text-teal-500 text-lg sm:text-xl">✓</span>
                <span>每日最多可铸造 <span className="text-teal-700 font-bold">5 次</span>，无冷却时间</span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-primary-50 rounded-xl sm:rounded-2xl border-2 border-primary-100">
                <span className="text-primary-500 text-lg sm:text-xl">✓</span>
                <span>铸造结果随机：<span className="text-teal-600 font-medium">普通70%</span>、<span className="text-primary-600 font-medium">稀有25%</span>、<span className="text-accent-600 font-medium">传说5%</span></span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-accent-50 rounded-xl sm:rounded-2xl border-2 border-accent-100">
                <span className="text-accent-500 text-lg sm:text-xl">★</span>
                <span><span className="text-accent-700 font-bold">20次保底</span>：连续20次未出稀有或传说，第20次必出！</span>
              </li>
              <li className="flex items-start gap-3 p-3 bg-rose-50 rounded-2xl border-2 border-rose-100">
                <span className="text-rose-500 text-xl">★</span>
                <span>提前出稀有/传说会<span className="text-rose-700 font-bold">重置保底计数</span></span>
              </li>
              <li className="flex items-start gap-3 p-3 bg-light-100 rounded-2xl border-2 border-light-200">
                <span className="text-light-600 text-xl">🌈</span>
                <span>每个NFT都是<span className="text-light-800 font-bold">独一无二</span>的，拥有专属颜色和编号</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
}
