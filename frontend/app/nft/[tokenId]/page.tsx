'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DetailPageSkeleton } from '@/components/Skeleton';
import { CopyableAddress } from '@/components/CopyableAddress';
import { contractABI, contractAddress, NFT_INFO, PERSONAL_RARITY } from '@/lib/contract';
import Link from 'next/link';

export default function NFTDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tokenId = Number(params.tokenId);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  
  const urlRarity = searchParams.get('rarity');
  const urlColorSeed = searchParams.get('colorSeed');
  const urlMintNumber = searchParams.get('mintNumber');

  const [nftData, setNftData] = useState<{
    owner: string;
    rarity: number;
    colorSeed: string;
    mintNumber: number;
    mintTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const isOfficialNFT = tokenId >= 1 && tokenId <= 4;
  const officialNft = isOfficialNFT ? NFT_INFO[tokenId] : null;

  const { data: balance } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'balanceOf',
    args: address ? [address, BigInt(tokenId)] : undefined,
  });

  const { data: totalSupply } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'totalSupply',
    args: [BigInt(tokenId)],
  });

  const { data: maxSupply } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'maxSupply',
    args: [BigInt(tokenId)],
    query: { enabled: isOfficialNFT },
  });

  const { data: universityName } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'universityName',
  });

  useEffect(() => {
    const loadNFTData = async () => {
      setLoading(true);
      try {
        if (isOfficialNFT) {
          setNftData(null);
        } else if (tokenId >= 10001) {
          if (urlRarity && urlColorSeed && urlMintNumber) {
            setNftData({
              owner: address || '',
              rarity: Number(urlRarity),
              colorSeed: urlColorSeed,
              mintNumber: Number(urlMintNumber),
              mintTime: 0,
            });
          } else if (publicClient) {
            try {
              const data = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: 'getPersonalNFTData',
                args: [BigInt(tokenId)],
              }) as [string, number, bigint, bigint, bigint];
              setNftData({
                owner: data[0],
                rarity: Number(data[1]),
                colorSeed: data[3].toString(),
                mintNumber: Number(data[4]),
                mintTime: Number(data[2]),
              });
            } catch (e) {
              setNftData(null);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
      setLoading(false);
    };
    loadNFTData();
  }, [tokenId, publicClient, isOfficialNFT, address, urlRarity, urlColorSeed, urlMintNumber]);

  const rarityInfo = nftData ? PERSONAL_RARITY[nftData.rarity as keyof typeof PERSONAL_RARITY] : null;
  const ownsNFT = Number(balance || 0) > 0;

  // 导入 NFT 到 MetaMask
  const handleImportToMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('请安装 MetaMask 浏览器插件！');
      return;
    }

    setImporting(true);
    try {
      const success = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC1155',
          options: {
            address: contractAddress,
            tokenId: tokenId.toString(),
          },
        },
      });

      if (success) {
        alert('✅ NFT 已添加到 MetaMask！\n\n请打开 MetaMask，在 "NFT" 标签中查看。\n注意：可能需要等待几秒钟才能显示。');
      }
    } catch (error: any) {
      console.error('导入 NFT 失败:', error);
      if (error.code === 4001) {
        alert('❌ 已取消导入');
      } else {
        alert('❌ 导入失败：' + (error.message || '未知错误'));
      }
    } finally {
      setImporting(false);
    }
  };

  const imageUrl = isOfficialNFT 
    ? `/api/image/${tokenId}`
    : nftData 
      ? `/api/image/${tokenId}?rarity=${nftData.rarity}&colorSeed=${nftData.colorSeed}&mintNumber=${nftData.mintNumber}`
      : '';

  const getRarityStyle = () => {
    if (isOfficialNFT) return 'bg-accent-100 text-accent-700 border-accent-200';
    if (!nftData) return '';
    switch (nftData.rarity) {
      case 2: return 'bg-gradient-to-r from-accent-100 to-rose-100 text-accent-700 border-accent-200';
      case 1: return 'bg-primary-100 text-primary-700 border-primary-200';
      default: return 'bg-teal-100 text-teal-700 border-teal-200';
    }
  };

  const rarityProbability: Record<number, { prob: string; desc: string }> = {
    0: { prob: '70%', desc: '基础纪念品' },
    1: { prob: '25%', desc: '闪耀的回忆' },
    2: { prob: '5%', desc: '璀璨珍藏' },
  };

  return (
    <div className="min-h-screen celebration-bg">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* 返回 */}
          <Link href="/my-nfts" className="inline-flex items-center gap-2 text-light-600 hover:text-primary-600 mb-4 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </Link>

          {loading ? (
            <DetailPageSkeleton />
          ) : !isOfficialNFT && !nftData ? (
            <div className="card-colorful p-12 text-center">
              <div className="text-5xl mb-4">❓</div>
              <h2 className="text-xl font-bold mb-2 text-light-800">NFT 不存在</h2>
              <p className="text-light-500 mb-4">Token ID: {tokenId}</p>
              <Link href="/my-nfts" className="btn-primary">返回</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* 左侧：图片 - 占2列 */}
              <div className="lg:col-span-2">
                <div className="card-colorful overflow-hidden">
                  <div className="aspect-square relative">
                    {imageUrl && (
                      <img src={imageUrl} alt="NFT" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1.5 rounded-full font-bold text-xs border-2 shadow-lg ${getRarityStyle()}`}>
                        {isOfficialNFT ? `🏛️ ${officialNft?.rarity}` : `${rarityInfo?.icon} ${rarityInfo?.name}`}
                      </span>
                    </div>
                    {ownsNFT && (
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full font-bold text-xs border-2 border-teal-200 shadow-lg">
                          ✓ 已拥有
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex gap-2 flex-wrap">
                    <button onClick={() => window.open(imageUrl, '_blank')} className="flex-1 min-w-[100px] btn-secondary text-xs py-2">
                      🖼️ 原图
                    </button>
                    <button
                      onClick={() => {
                        const name = isOfficialNFT ? officialNft?.name : `毕业纪念 #${nftData?.mintNumber}`;
                        navigator.clipboard.writeText(`${name} | Token #${tokenId} | ${contractAddress}`);
                        alert('已复制！');
                      }}
                      className="flex-1 min-w-[100px] btn-secondary text-xs py-2"
                    >
                      📋 复制
                    </button>
                    {ownsNFT && (
                      <button
                        onClick={handleImportToMetaMask}
                        disabled={importing}
                        className="flex-1 min-w-[100px] btn-primary text-xs py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="将此 NFT 添加到 MetaMask 钱包"
                      >
                        {importing ? '⏳ 导入中...' : '🦊 添加到 MetaMask'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 右侧：信息 - 占3列 */}
              <div className="lg:col-span-3 space-y-4">
                {/* 标题 + 基本信息 */}
                <div className="card-colorful p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isOfficialNFT ? 'bg-accent-100 text-accent-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isOfficialNFT ? '🏛️ 官方' : '🎨 个人'}
                    </span>
                    <span className="px-2 py-0.5 bg-light-100 rounded-full text-xs text-light-600">
                      🏫 {universityName as string || '江西软件大学'}
                    </span>
                    <span className="px-2 py-0.5 bg-light-100 rounded-full text-xs text-light-600">
                      📅 2026届
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-light-800 mb-1">
                    {isOfficialNFT ? officialNft?.name : `毕业纪念 #${nftData?.mintNumber}`}
                  </h1>
                  <p className="text-light-500 text-sm">
                    {isOfficialNFT ? officialNft?.description : '独一无二的专属纪念品'}
                  </p>
                </div>

                {/* 属性网格 - 紧凑布局 */}
                <div className="card-colorful p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-light-100 rounded-xl p-3 text-center">
                      <div className="text-xs text-light-500 mb-1">Token ID</div>
                      <div className="font-bold text-light-800">#{tokenId}</div>
                    </div>
                    <div className={`rounded-xl p-3 text-center ${
                      !isOfficialNFT && nftData && nftData.rarity >= 1 
                        ? 'bg-primary-50 border border-primary-200' 
                        : 'bg-light-100'
                    }`}>
                      <div className="text-xs text-light-500 mb-1">稀有度</div>
                      <div className="font-bold text-light-800">
                        {isOfficialNFT ? officialNft?.rarity : rarityInfo?.name}
                      </div>
                    </div>
                    <div className="bg-light-100 rounded-xl p-3 text-center">
                      <div className="text-xs text-light-500 mb-1">供应量</div>
                      <div className="font-bold text-light-800">
                        {totalSupply?.toString() || '0'}{isOfficialNFT && maxSupply ? `/${maxSupply.toString()}` : ''}
                      </div>
                    </div>
                    <div className="bg-light-100 rounded-xl p-3 text-center">
                      <div className="text-xs text-light-500 mb-1">拥有</div>
                      <div className="font-bold text-light-800">{balance?.toString() || '0'}</div>
                    </div>

                    {/* 个人NFT专属属性 */}
                    {!isOfficialNFT && nftData && (
                      <>
                        <div className="bg-light-100 rounded-xl p-3 text-center">
                          <div className="text-xs text-light-500 mb-1">编号</div>
                          <div className="font-bold text-light-800">#{nftData.mintNumber}</div>
                        </div>
                        <div className="bg-light-100 rounded-xl p-3 text-center">
                          <div className="text-xs text-light-500 mb-1">颜色种子</div>
                          <div className="font-bold text-light-800 text-xs truncate">{nftData.colorSeed.slice(0, 6)}...</div>
                        </div>
                        <div className="bg-light-100 rounded-xl p-3 text-center col-span-2">
                          <div className="text-xs text-light-500 mb-1">获得概率</div>
                          <div className="font-bold text-light-800">
                            {rarityProbability[nftData.rarity]?.prob} - {rarityProbability[nftData.rarity]?.desc}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 合约信息 - 紧凑 */}
                <div className="card-colorful p-5">
                  <h3 className="text-sm font-bold text-light-800 mb-3 flex items-center gap-2">
                    <span>⚙️</span> 技术信息
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="relative p-2 bg-light-50 rounded-lg">
                      <CopyableAddress 
                        address={contractAddress}
                        label="合约"
                        shortened={true}
                      />
                    </div>
                    <div className="flex justify-between p-2 bg-light-50 rounded-lg">
                      <span className="text-light-500">标准</span>
                      <span className="text-light-700">ERC-1155</span>
                    </div>
                    <div className="flex justify-between p-2 bg-light-50 rounded-lg">
                      <span className="text-light-500">网络</span>
                      <span className="text-light-700">Ethereum</span>
                    </div>
                    {!isOfficialNFT && nftData?.owner && (
                      <div className="flex justify-between p-2 bg-light-50 rounded-lg">
                        <span className="text-light-500">持有者</span>
                        <span className="font-mono text-light-700">{nftData.owner.slice(0, 8)}...{nftData.owner.slice(-6)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 快捷操作 */}
                <div className="flex gap-3">
                  <Link href="/my-nfts" className="flex-1 btn-secondary text-center text-sm">
                    📦 我的NFT
                  </Link>
                  <Link href="/mint" className="flex-1 btn-primary text-center text-sm">
                    🎲 继续铸造
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
