'use client';

interface NFTCardProps {
  id: number;
  name: string;
  description: string;
  image: string;
  rarity: string;
  owned: boolean;
  onClaim: () => void;
  isLoading: boolean;
  isConnected: boolean;
  isRegistered: boolean;
}

const rarityColors: Record<string, string> = {
  '普通': 'bg-dark-600 text-dark-300',
  '稀有': 'bg-accent-500/20 text-accent-400 border border-accent-500/30',
  '传说': 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
};

export function NFTCard({
  id,
  name,
  description,
  image,
  rarity,
  owned,
  onClaim,
  isLoading,
  isConnected,
  isRegistered,
}: NFTCardProps) {
  return (
    <div className="card group overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        {/* Placeholder gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-900 flex items-center justify-center">
          <div className="text-8xl opacity-50 group-hover:scale-110 transition-transform duration-500">
            {id === 1 && '📜'}
            {id === 2 && '🏅'}
            {id === 3 && '🏆'}
            {id === 4 && '⭐'}
          </div>
        </div>

        {/* Rarity Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${rarityColors[rarity]}`}>
            {rarity}
          </span>
        </div>

        {/* Owned Badge */}
        {owned && (
          <div className="absolute top-4 right-4 z-10">
            <span className="status-badge success">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              已拥有
            </span>
          </div>
        )}

        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary-400 transition-colors">
          {name}
        </h3>
        <p className="text-dark-400 text-sm mb-4 line-clamp-2">{description}</p>

        {/* Token ID */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-dark-500">Token ID</span>
          <span className="font-mono text-dark-300">#{id}</span>
        </div>

        {/* Action Button */}
        {!isConnected ? (
          <button disabled className="w-full btn-secondary opacity-50 cursor-not-allowed">
            请先连接钱包
          </button>
        ) : !isRegistered ? (
          <button disabled className="w-full btn-secondary opacity-50 cursor-not-allowed">
            未注册为毕业生
          </button>
        ) : owned ? (
          <div className="w-full py-3 px-6 bg-green-500/20 text-green-400 rounded-xl border border-green-500/30 text-center">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              已拥有
            </span>
          </div>
        ) : (
          <button
            onClick={onClaim}
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                处理中...
              </span>
            ) : (
              '领取 NFT'
            )}
          </button>
        )}
      </div>
    </div>
  );
}

