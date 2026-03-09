'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export function HeroSection() {
  const { isConnected } = useAccount();

  // 滚动到指定区域
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-300/40 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-300/40 rounded-full blur-3xl animate-float animation-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-200/30 to-teal-200/30 rounded-full blur-3xl" />
        
        {/* 装饰性元素 */}
        <div className="absolute top-20 right-20 text-6xl animate-bounce-slow opacity-50 hidden sm:block">🎓</div>
        <div className="absolute bottom-40 left-20 text-5xl animate-float opacity-50 hidden sm:block">✨</div>
        <div className="absolute top-40 left-1/3 text-4xl animate-sparkle opacity-50 hidden md:block">🌟</div>
        <div className="absolute bottom-20 right-1/3 text-5xl animate-confetti opacity-50 hidden md:block">🎉</div>
      </div>

      {/* Dot Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(251, 191, 36, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/90 border-2 border-primary-200 mb-8 animate-slide-up shadow-lg">
          <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm text-light-700 font-semibold">基于 ERC-1155 协议 · 支持 OpenSea</span>
          <span className="text-lg">🚀</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-bold mb-4 sm:mb-6 animate-slide-up animation-delay-200 text-light-800">
          高校毕业纪念
          <br />
          <span className="gradient-text">NFT 系统</span>
          <span className="inline-block ml-1 sm:ml-2 animate-bounce-slow text-2xl sm:text-5xl md:text-7xl">🎓</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl md:text-2xl text-light-600 max-w-2xl mx-auto mb-6 sm:mb-10 animate-slide-up animation-delay-400 px-4">
          将你的毕业记忆永久保存在区块链上 ✨
          <br className="hidden sm:block" />
          <span className="text-light-500 text-sm sm:text-base">独一无二的数字纪念品，见证你的成长</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up animation-delay-600 px-4">
          {!isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button onClick={openConnectModal} className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
                  ✨ 连接钱包开始
                </button>
              )}
            </ConnectButton.Custom>
          ) : (
            <button 
              onClick={() => scrollToSection('nfts')} 
              className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
            >
              💎 查看 NFT 系列
            </button>
          )}
          <button 
            onClick={() => scrollToSection('how-to')} 
            className="btn-secondary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto"
          >
            📖 了解更多
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 mt-10 sm:mt-20 animate-slide-up animation-delay-600 px-2">
          {[
            { value: '10,000+', label: '毕业生', icon: '👨‍🎓', color: 'from-primary-400 to-primary-500' },
            { value: '4', label: 'NFT类型', icon: '💎', color: 'from-accent-400 to-accent-500' },
            { value: '100%', label: '链上存储', icon: '🔗', color: 'from-teal-400 to-teal-500' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-3 sm:p-6 bg-white/80 rounded-2xl sm:rounded-3xl border-2 border-light-200 shadow-soft hover:shadow-lg hover:scale-105 transition-all duration-300">
              <div className="text-xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</div>
              <div className={`text-lg sm:text-3xl md:text-4xl font-display font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-light-500 mt-1 font-medium text-xs sm:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
