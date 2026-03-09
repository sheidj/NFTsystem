'use client';

import { useAccount, useReadContract } from 'wagmi';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { GraduateInfo } from '@/components/GraduateInfo';
import { Footer } from '@/components/Footer';
import { BackToTop } from '@/components/BackToTop';
import { contractABI, contractAddress, NFT_INFO, OFFICIAL_NFT } from '@/lib/contract';

// 官方NFT列表
const OFFICIAL_NFTS = Object.values(OFFICIAL_NFT);

// 个人NFT稀有度展示
const RARITY_INFO = [
  { name: '普通', icon: '🎨', rate: '70%', color: 'from-teal-400 to-teal-500', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', textColor: 'text-teal-600', description: '基础纪念品' },
  { name: '稀有', icon: '🌟', rate: '25%', color: 'from-primary-400 to-primary-500', bgColor: 'bg-primary-50', borderColor: 'border-primary-200', textColor: 'text-primary-600', description: '闪耀的回忆' },
  { name: '传说', icon: '💎', rate: '5%', color: 'from-accent-400 to-rose-400', bgColor: 'bg-accent-50', borderColor: 'border-accent-200', textColor: 'text-accent-600', description: '璀璨珍藏' },
];

// 使用步骤
const STEPS = [
  { step: 1, title: '连接钱包', desc: '使用 MetaMask 或其他钱包连接系统', icon: '🔗' },
  { step: 2, title: '注册身份', desc: '联系管理员完成毕业生身份认证', icon: '📝' },
  { step: 3, title: '获取官方NFT', desc: '管理员审核后发放官方证书NFT', icon: '🏛️' },
  { step: 4, title: '铸造个人NFT', desc: '每天可铸造5次独特纪念品', icon: '🎨' },
];

export default function Home() {
  const { address, isConnected } = useAccount();

  const { data: graduateInfo } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getGraduateInfo',
    args: address ? [address] : undefined,
  });

  const { data: isRegistered } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'isRegisteredGraduate',
    args: address ? [address] : undefined,
  });

  const { data: totalPersonalMinted } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'totalPersonalMinted',
  });

  // 读取官方NFT余额
  const { data: b1 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(1)] : undefined });
  const { data: b2 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(2)] : undefined });
  const { data: b3 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(3)] : undefined });
  const { data: b4 } = useReadContract({ address: contractAddress, abi: contractABI, functionName: 'balanceOf', args: address ? [address, BigInt(4)] : undefined });

  const officialBalances: Record<number, number> = {
    1: Number(b1 || 0), 2: Number(b2 || 0), 3: Number(b3 || 0), 4: Number(b4 || 0),
  };

  const totalOfficial = Object.values(officialBalances).reduce((a, b) => a + b, 0);
  
  // 从 graduateInfo 获取用户的个人铸造数量
  const userPersonalCount = graduateInfo ? Number((graduateInfo as any)[6] || 0) : 0;
  const userPityCounter = graduateInfo ? Number((graduateInfo as any)[7] || 0) : 0;

  return (
    <div className="min-h-screen celebration-bg">
      <Header />
      <main>
        <HeroSection />
        
        {/* 官方认证NFT */}
        <section id="nfts" className="py-20 px-4 scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-5 py-2 bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700 rounded-full text-sm font-bold mb-4 border-2 border-accent-200 shadow-sm">
                🏛️ 学校官方发放
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-light-800">
                官方认证 <span className="gradient-text-purple">NFT</span>
              </h2>
              <p className="text-light-600 text-lg max-w-2xl mx-auto">
                经学校审核后由管理员发放的官方证书与荣誉 ✨
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {OFFICIAL_NFTS.map((id) => {
                const nft = NFT_INFO[id];
                if (!nft) return null;
                const balance = officialBalances[id];
                return (
                  <div key={id} className="card-accent group overflow-hidden hover:scale-105 transition-all duration-300">
                    <div className={`relative aspect-square bg-gradient-to-br ${nft.color} flex items-center justify-center`}>
                      <span className="text-7xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 drop-shadow-lg">{nft.icon}</span>
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1.5 bg-white/90 text-accent-600 rounded-full text-xs font-bold border-2 border-accent-200 shadow-sm">
                          {nft.rarity}
                        </span>
                      </div>
                      {isConnected && balance > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full text-xs font-bold border-2 border-teal-200 shadow-sm">
                            ✓ 已获得
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 bg-white/50">
                      <h3 className="text-lg font-bold mb-1 text-light-800">{nft.name}</h3>
                      <p className="text-light-500 text-sm">{nft.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {isConnected && (
              <p className="text-center text-light-600 mt-8 text-lg">
                你已获得 <span className="text-accent-600 font-bold text-2xl">{totalOfficial}</span> 个官方认证NFT 🎉
              </p>
            )}
          </div>
        </section>

        {/* 个人纪念NFT */}
        <section className="py-20 px-4 bg-gradient-to-b from-white via-rose-50/30 to-accent-50/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-5 py-2 bg-gradient-to-r from-rose-100 to-rose-200 text-rose-700 rounded-full text-sm font-bold mb-4 border-2 border-rose-200 shadow-sm">
                🎨 学生自由铸造
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-light-800">
                个人纪念 <span className="gradient-text">NFT</span>
              </h2>
              <p className="text-light-600 text-lg max-w-2xl mx-auto">
                每个NFT都是独一无二的！拥有专属颜色和编号，随机稀有度带来惊喜 🌈
              </p>
            </div>

            {/* 稀有度展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {RARITY_INFO.map((rarity, index) => (
                <div key={index} className={`${rarity.bgColor} ${rarity.borderColor} border-2 rounded-3xl group overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 hover:scale-105`}>
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 drop-shadow-md">{rarity.icon}</div>
                    <h3 className={`text-2xl font-bold mb-2 ${rarity.textColor}`}>{rarity.name}</h3>
                    <p className="text-light-500 text-sm mb-4">{rarity.description}</p>
                    <div className={`text-4xl font-bold ${rarity.textColor}`}>{rarity.rate}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 特性说明 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="stat-card gold">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-bold text-lg text-primary-700">每日5次</div>
                <div className="text-primary-500 text-sm">无冷却时间</div>
              </div>
              <div className="stat-card purple">
                <div className="text-3xl mb-2">⭐</div>
                <div className="font-bold text-lg text-accent-700">20次保底</div>
                <div className="text-accent-500 text-sm">必出稀有或传说</div>
              </div>
              <div className="stat-card teal">
                <div className="text-3xl mb-2">🌈</div>
                <div className="font-bold text-lg text-teal-700">独一无二</div>
                <div className="text-teal-500 text-sm">专属颜色和编号</div>
              </div>
            </div>

            {/* 统计 */}
            <div className="card-colorful p-8 mb-10">
              <div className="flex flex-wrap justify-center gap-12">
                <div className="text-center">
                  <div className="text-5xl font-bold gradient-text">{totalPersonalMinted?.toString() || '0'}</div>
                  <div className="text-light-500 text-sm mt-2 font-medium">🌍 全球已铸造</div>
                </div>
                {isConnected && (
                  <>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-rose-500">{userPersonalCount}</div>
                      <div className="text-light-500 text-sm mt-2 font-medium">💎 你的收藏</div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-accent-500">{userPityCounter}/20</div>
                      <div className="text-light-500 text-sm mt-2 font-medium">⭐ 保底进度</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="text-center">
              <a href="/mint" className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-rose-400 via-rose-500 to-accent-500 text-white font-bold text-xl rounded-3xl hover:scale-110 transition-all duration-300 shadow-xl shadow-rose-500/30 border-2 border-rose-400/50">
                <span className="text-3xl animate-bounce-slow">🎲</span>
                铸造唯一NFT
                <span className="text-2xl">✨</span>
              </a>
            </div>
          </div>
        </section>

        {/* 使用指南 */}
        <section id="how-to" className="py-20 px-4 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-5 py-2 bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 rounded-full text-sm font-bold mb-4 border-2 border-teal-200 shadow-sm">
                📖 新手指南
              </span>
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-4 text-light-800">
                如何 <span className="gradient-text">使用系统</span>
              </h2>
              <p className="text-light-600 text-lg max-w-2xl mx-auto">
                简单四步，开启你的数字纪念品之旅 🚀
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((item, index) => (
                <div key={index} className="card-colorful p-6 text-center hover:scale-105 transition-all duration-300 relative">
                  <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {item.step}
                  </div>
                  <div className="text-5xl mb-4 mt-2">{item.icon}</div>
                  <h3 className="text-lg font-bold mb-2 text-light-800">{item.title}</h3>
                  <p className="text-light-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* 快速入口 */}
            <div className="mt-12 card-colorful p-8">
              <h3 className="text-xl font-bold mb-6 text-light-800 text-center">🚀 快速入口</h3>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/mint" className="btn-primary">
                  🎲 去铸造
                </a>
                <a href="/my-nfts" className="btn-accent">
                  💎 我的NFT
                </a>
                <a href="/admin" className="btn-teal">
                  ⚙️ 管理面板
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 个人信息 */}
        {isConnected && (
          <section id="profile" className="py-20 px-4 scroll-mt-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <span className="inline-block px-5 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 rounded-full text-sm font-bold mb-4 border-2 border-primary-200 shadow-sm">
                  👤 个人中心
                </span>
                <h2 className="text-3xl font-display font-bold text-light-800">
                  我的信息
                </h2>
              </div>
              <GraduateInfo graduateInfo={graduateInfo as any} isRegistered={!!isRegistered} address={address} />
            </div>
          </section>
        )}
      </main>
      <BackToTop />
      <Footer />
    </div>
  );
}
