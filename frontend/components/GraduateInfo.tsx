'use client';

interface GraduateInfoProps {
  graduateInfo?: readonly [string, string, string, string, bigint, boolean, bigint] | null;
  isRegistered: boolean;
  address?: string;
}

export function GraduateInfo({ graduateInfo, isRegistered, address }: GraduateInfoProps) {
  if (!isRegistered) {
    return (
      <div className="card-colorful p-8 text-center">
        <div className="text-7xl mb-4">🔒</div>
        <h3 className="text-2xl font-bold mb-2 text-light-800">尚未注册</h3>
        <p className="text-light-500 mb-6">
          您的钱包地址尚未被注册为毕业生。请联系学校管理员完成注册。
        </p>
        <div className="bg-light-100 rounded-2xl p-4 font-mono text-sm text-light-600 break-all border-2 border-light-200">
          {address}
        </div>
      </div>
    );
  }

  // 从数组中解构数据
  // [studentId, studentName, major, college, mintedAt, hasClaimed, selfMintCount]
  const studentId = graduateInfo?.[0] || '';
  const studentName = graduateInfo?.[1] || '';
  const major = graduateInfo?.[2] || '';
  const college = graduateInfo?.[3] || '';
  const mintedAt = graduateInfo?.[4] || BigInt(0);
  const hasClaimed = graduateInfo?.[5] || false;
  const selfMintCount = graduateInfo?.[6] || BigInt(0);

  const mintDate = mintedAt > BigInt(0)
    ? new Date(Number(mintedAt) * 1000).toLocaleString('zh-CN')
    : null;

  return (
    <div className="card-colorful overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-100 via-accent-100 to-rose-100 p-6 border-b-2 border-primary-200">
        <div className="flex items-center gap-4">
          <div className="w-18 h-18 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg shadow-primary-500/30">
            🎓
          </div>
          <div>
            <h3 className="text-2xl font-bold text-light-800">{studentName || '加载中...'}</h3>
            <p className="text-light-500">毕业生认证信息 ✨</p>
          </div>
          {hasClaimed && (
            <div className="ml-auto status-badge success">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              已认证
            </div>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="p-6 bg-white/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem label="学号" value={studentId || '-'} icon="🆔" color="primary" />
          <InfoItem label="姓名" value={studentName || '-'} icon="👤" color="accent" />
          <InfoItem label="学院" value={college || '-'} icon="🏛️" color="teal" />
          <InfoItem label="专业" value={major || '-'} icon="📚" color="rose" />
        </div>

        {/* 铸造统计 */}
        <div className="mt-6 pt-6 border-t-2 border-light-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card gold">
              <div className="text-3xl font-bold text-primary-600">{selfMintCount.toString()}</div>
              <div className="text-sm text-primary-500 font-medium">🎨 个人铸造次数</div>
            </div>
            <div className="stat-card teal">
              <div className="text-3xl font-bold text-teal-600">{hasClaimed ? '✓' : '-'}</div>
              <div className="text-sm text-teal-500 font-medium">🏅 已获得官方NFT</div>
            </div>
          </div>
        </div>

        {hasClaimed && mintDate && (
          <div className="mt-6 pt-6 border-t-2 border-light-200">
            <div className="flex items-center gap-2 text-light-600 bg-light-100 rounded-2xl p-4">
              <span className="text-xl">⏰</span>
              <span className="font-medium">首次获得NFT时间: {mintDate}</span>
            </div>
          </div>
        )}

        {/* Wallet Address */}
        <div className="mt-6 pt-6 border-t-2 border-light-200">
          <div className="text-sm text-light-500 mb-2 font-medium">🔗 钱包地址</div>
          <div className="flex items-center gap-2">
            <div className="bg-light-100 rounded-2xl px-4 py-3 font-mono text-sm text-light-600 flex-1 truncate border-2 border-light-200">
              {address}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(address || '')}
              className="p-3 bg-primary-100 rounded-2xl hover:bg-primary-200 transition-colors border-2 border-primary-200"
              title="复制地址"
            >
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, icon, color }: { label: string; value: string; icon: string; color: 'primary' | 'accent' | 'teal' | 'rose' }) {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200 text-primary-700',
    accent: 'bg-accent-50 border-accent-200 text-accent-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
  };

  return (
    <div className={`${colorClasses[color]} rounded-2xl p-4 flex items-center gap-4 border-2`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-sm opacity-70 font-medium">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}
