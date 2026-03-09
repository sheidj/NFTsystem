// 合约地址 - 本地部署地址
export const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;

// ============ NFT类型常量 ============

// 官方认证NFT (管理员发放)
export const OFFICIAL_NFT = {
  DIPLOMA: 1,           // 毕业证书
  MEMORIAL_BADGE: 2,    // 纪念徽章
  HONOR_CERTIFICATE: 3, // 荣誉证书
  SPECIAL_AWARD: 4,     // 特殊奖项
} as const;

// 个人纪念NFT从 10001 开始，每个都是唯一的

// NFT详细信息（官方NFT固定信息）
export const NFT_INFO: Record<number, {
  name: string;
  description: string;
  icon: string;
  rarity: string;
  type: 'official' | 'personal';
  color: string;
}> = {
  // 官方认证NFT
  1: { name: '毕业证书', description: '官方数字毕业证书', icon: '📜', rarity: '官方', type: 'official', color: 'from-blue-600 to-blue-700' },
  2: { name: '纪念徽章', description: '毕业纪念徽章', icon: '🏅', rarity: '官方', type: 'official', color: 'from-green-600 to-green-700' },
  3: { name: '荣誉证书', description: '优秀毕业生荣誉证书', icon: '🏆', rarity: '稀有', type: 'official', color: 'from-purple-600 to-purple-700' },
  4: { name: '特殊奖项', description: '杰出贡献者特殊奖项', icon: '⭐', rarity: '传说', type: 'official', color: 'from-yellow-500 to-orange-600' },
};

// 个人NFT稀有度配置
export const PERSONAL_RARITY = {
  0: { name: '普通', icon: '🎨', color: 'from-cyan-500 to-blue-500' },
  1: { name: '稀有', icon: '🌟', color: 'from-purple-500 to-pink-500' },
  2: { name: '传说', icon: '💎', color: 'from-yellow-400 to-orange-500' },
} as const;

// 合约ABI
export const contractABI = [
  // 读取函数
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'isRegisteredGraduate',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'graduateAddress', type: 'address' }],
    name: 'getGraduateInfo',
    outputs: [
      { name: 'studentId', type: 'string' },
      { name: 'studentName', type: 'string' },
      { name: 'major', type: 'string' },
      { name: 'college', type: 'string' },
      { name: 'mintedAt', type: 'uint256' },
      { name: 'hasClaimed', type: 'bool' },
      { name: 'selfMintCount', type: 'uint256' },
      { name: 'pityCounter', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'universityName',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'maxSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalGraduates',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'student', type: 'address' }],
    name: 'getRemainingDailyMints',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'student', type: 'address' }],
    name: 'getPityCounter',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'studentId', type: 'string' }],
    name: 'studentIdToAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'isOfficialNFT',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'isPersonalNFT',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getPersonalNFTData',
    outputs: [
      { name: 'owner', type: 'address' },
      { name: 'rarity', type: 'uint8' },
      { name: 'mintTime', type: 'uint256' },
      { name: 'colorSeed', type: 'uint256' },
      { name: 'mintNumber', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'nextPersonalTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalPersonalMinted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },

  // 写入函数 - 管理员
  {
    inputs: [
      { name: 'graduateAddress', type: 'address' },
      { name: 'studentId', type: 'string' },
      { name: 'studentName', type: 'string' },
      { name: 'major', type: 'string' },
      { name: 'college', type: 'string' },
    ],
    name: 'registerGraduate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    name: 'mintOfficialNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // 写入函数 - 学生
  {
    inputs: [],
    name: 'mintPersonalNFT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // ERC-1155 转让函数
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },

  // 事件
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'graduate', type: 'address' },
      { indexed: false, name: 'studentId', type: 'string' },
      { indexed: false, name: 'studentName', type: 'string' },
    ],
    name: 'GraduateRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'nftType', type: 'string' },
    ],
    name: 'OfficialNFTMinted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'rarity', type: 'uint8' },
      { indexed: false, name: 'colorSeed', type: 'uint256' },
      { indexed: false, name: 'mintNumber', type: 'uint256' },
    ],
    name: 'PersonalNFTMinted',
    type: 'event',
  },
] as const;
