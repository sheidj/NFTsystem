'use client';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-white via-primary-50/30 to-accent-50/30 border-t-2 border-primary-100 py-8 sm:py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Logo & Description */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-lg sm:text-2xl">🎓</span>
              </div>
              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-light-800">毕业纪念NFT</h3>
                <p className="text-[10px] sm:text-xs text-light-500 font-medium">Graduation Memorial ✨</p>
              </div>
            </div>
            <p className="text-light-600 max-w-sm leading-relaxed text-xs sm:text-sm hidden sm:block">
              🌟 基于ERC-1155协议的高校毕业纪念NFT系统，将您珍贵的毕业记忆永久保存在区块链上。
            </p>
            <p className="text-light-600 text-xs sm:hidden">
              🌟 将您珍贵的毕业记忆永久保存在区块链上！
            </p>
            
            {/* 社交图标 */}
            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-4">
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center text-primary-600 hover:scale-110 transition-transform shadow-sm">
                <span className="text-xs sm:text-sm">🐦</span>
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-accent-100 to-accent-200 rounded-lg flex items-center justify-center text-accent-600 hover:scale-110 transition-transform shadow-sm">
                <span className="text-xs sm:text-sm">📱</span>
              </a>
              <a href="#" className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center text-teal-600 hover:scale-110 transition-transform shadow-sm">
                <span className="text-xs sm:text-sm">💬</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm sm:text-base text-light-800 mb-2 sm:mb-4 flex items-center gap-2">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-100 rounded-md flex items-center justify-center text-[10px] sm:text-xs">🔗</span>
              快速链接
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <a href="/" className="text-light-600 hover:text-primary-600 transition-colors font-medium flex items-center gap-1.5">
                  <span className="text-primary-400 hidden sm:inline">→</span> 🏠 首页
                </a>
              </li>
              <li>
                <a href="/#nfts" className="text-light-600 hover:text-primary-600 transition-colors font-medium flex items-center gap-1.5">
                  <span className="text-primary-400 hidden sm:inline">→</span> 💎 NFT系列
                </a>
              </li>
              <li>
                <a href="/mint" className="text-light-600 hover:text-primary-600 transition-colors font-medium flex items-center gap-1.5">
                  <span className="text-primary-400 hidden sm:inline">→</span> 🎲 NFT铸造
                </a>
              </li>
              <li>
                <a href="/my-nfts" className="text-light-600 hover:text-primary-600 transition-colors font-medium flex items-center gap-1.5">
                  <span className="text-primary-400 hidden sm:inline">→</span> 📦 我的NFT
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-bold text-sm sm:text-base text-light-800 mb-2 sm:mb-4 flex items-center gap-2">
              <span className="w-5 h-5 sm:w-6 sm:h-6 bg-accent-100 rounded-md flex items-center justify-center text-[10px] sm:text-xs">📚</span>
              学习资源
            </h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <a
                  href="https://opensea.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light-600 hover:text-accent-600 transition-colors font-medium flex items-center gap-1.5"
                >
                  <span className="text-accent-400 hidden sm:inline">→</span> OpenSea
                </a>
              </li>
              <li>
                <a
                  href="https://ethereum.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light-600 hover:text-accent-600 transition-colors font-medium flex items-center gap-1.5"
                >
                  <span className="text-accent-400 hidden sm:inline">→</span> Ethereum
                </a>
              </li>
              <li>
                <a
                  href="https://docs.openzeppelin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-light-600 hover:text-accent-600 transition-colors font-medium flex items-center gap-1.5"
                >
                  <span className="text-accent-400 hidden sm:inline">→</span> OpenZeppelin
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-4 sm:pt-6 border-t-2 border-primary-100 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
          <p className="text-light-500 text-[10px] sm:text-xs font-medium text-center md:text-left">
            © {new Date().getFullYear()} 高校毕业纪念NFT系统 🎉
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-light-500 text-[10px] sm:text-xs font-medium hidden sm:inline">Powered by</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 px-2 py-0.5 rounded-full font-bold border border-primary-200">
                ERC-1155
              </span>
              <span className="text-[10px] bg-gradient-to-r from-accent-100 to-accent-200 text-accent-700 px-2 py-0.5 rounded-full font-bold border border-accent-200">
                IPFS
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
