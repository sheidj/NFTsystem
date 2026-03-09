import { NextRequest, NextResponse } from 'next/server';

// NFT 元数据配置
const NFT_METADATA: Record<number, {
  name: string;
  description: string;
  icon: string;
  rarity: string;
  type: string;
  bgColor: string;
  textColor: string;
}> = {
  // 官方认证NFT
  1: {
    name: '毕业证书',
    description: '官方数字毕业证书，证明您的学业成就。由学校官方认证颁发。',
    icon: '📜',
    rarity: 'Official',
    type: 'official',
    bgColor: '#1e40af',
    textColor: '#93c5fd',
  },
  2: {
    name: '纪念徽章',
    description: '专属毕业纪念徽章，记录美好的大学时光。',
    icon: '🏅',
    rarity: 'Official',
    type: 'official',
    bgColor: '#166534',
    textColor: '#86efac',
  },
  3: {
    name: '荣誉证书',
    description: '优秀毕业生专属荣誉证书，表彰卓越的学术成就。',
    icon: '🏆',
    rarity: 'Rare',
    type: 'official',
    bgColor: '#7c3aed',
    textColor: '#c4b5fd',
  },
  4: {
    name: '特殊奖项',
    description: '杰出贡献者特殊奖项NFT，只授予最优秀的毕业生。',
    icon: '⭐',
    rarity: 'Legendary',
    type: 'official',
    bgColor: '#b45309',
    textColor: '#fcd34d',
  },
  // 个人纪念NFT
  101: {
    name: '校园回忆',
    description: '珍藏校园美好时光，记录难忘的大学生活。',
    icon: '🏫',
    rarity: 'Common',
    type: 'personal',
    bgColor: '#0891b2',
    textColor: '#a5f3fc',
  },
  102: {
    name: '青春印记',
    description: '记录青春岁月，留下最美的回忆。',
    icon: '✨',
    rarity: 'Common',
    type: 'personal',
    bgColor: '#db2777',
    textColor: '#fbcfe8',
  },
  103: {
    name: '金色时光',
    description: '闪耀的大学时代，金色的青春记忆。',
    icon: '🌟',
    rarity: 'Rare',
    type: 'personal',
    bgColor: '#d97706',
    textColor: '#fef3c7',
  },
  104: {
    name: '璀璨纪念',
    description: '最珍贵的毕业记忆，闪耀永恒的光芒。',
    icon: '💎',
    rarity: 'Legendary',
    type: 'personal',
    bgColor: '#7c3aed',
    textColor: '#e9d5ff',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const tokenId = parseInt(params.tokenId);
  const metadata = NFT_METADATA[tokenId];

  if (!metadata) {
    return NextResponse.json({ error: 'NFT not found' }, { status: 404 });
  }

  // 构建 OpenSea 兼容的元数据
  const baseUrl = request.nextUrl.origin;
  
  const response = {
    name: metadata.name,
    description: metadata.description,
    image: `${baseUrl}/api/image/${tokenId}`,
    external_url: baseUrl,
    attributes: [
      {
        trait_type: 'Rarity',
        value: metadata.rarity,
      },
      {
        trait_type: 'Type',
        value: metadata.type === 'official' ? 'Official Certificate' : 'Personal Memorial',
      },
      {
        trait_type: 'Token ID',
        value: tokenId.toString(),
      },
    ],
  };

  return NextResponse.json(response);
}

