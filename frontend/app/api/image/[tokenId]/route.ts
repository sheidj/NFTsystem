import { NextRequest, NextResponse } from 'next/server';

// 官方NFT 图片配置
const OFFICIAL_NFT_CONFIG: Record<number, {
  name: string;
  icon: string;
  rarity: string;
  bgGradient: [string, string];
  accentColor: string;
}> = {
  1: { name: '毕业证书', icon: '📜', rarity: '官方', bgGradient: ['#1e3a8a', '#3b82f6'], accentColor: '#60a5fa' },
  2: { name: '纪念徽章', icon: '🏅', rarity: '官方', bgGradient: ['#14532d', '#22c55e'], accentColor: '#4ade80' },
  3: { name: '荣誉证书', icon: '🏆', rarity: '稀有', bgGradient: ['#581c87', '#a855f7'], accentColor: '#c084fc' },
  4: { name: '特殊奖项', icon: '⭐', rarity: '传说', bgGradient: ['#78350f', '#f59e0b'], accentColor: '#fbbf24' },
};

// 根据颜色种子生成HSL颜色
function seedToColor(seed: bigint, offset: number = 0): { h: number; s: number; l: number } {
  const seedNum = Number(seed % BigInt(1000000));
  const h = (seedNum + offset * 137) % 360;
  const s = 60 + (seedNum % 30);
  const l = 35 + (seedNum % 20);
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// 生成个人NFT的SVG
function generatePersonalNFTSVG(
  tokenId: number,
  rarity: number,
  colorSeed: bigint,
  mintNumber: number
): string {
  const rarityNames = ['普通', '稀有', '传说'];
  const rarityIcons = ['🎨', '🌟', '💎'];
  const rarityName = rarityNames[rarity] || '普通';
  const rarityIcon = rarityIcons[rarity] || '🎨';
  
  // 根据种子生成颜色
  const color1 = seedToColor(colorSeed, 0);
  const color2 = seedToColor(colorSeed, 1);
  const color3 = seedToColor(colorSeed, 2);
  
  const bgColor1 = hslToHex(color1.h, color1.s, color1.l);
  const bgColor2 = hslToHex(color2.h, color2.s, color2.l + 15);
  const accentColor = hslToHex(color3.h, 70, 60);
  
  const isLegendary = rarity === 2;
  const isRare = rarity === 1;

  // 生成装饰图案
  const patternElements = [];
  const patternSeed = Number(colorSeed % BigInt(10000));
  for (let i = 0; i < 15; i++) {
    const x = ((patternSeed * (i + 1) * 17) % 500);
    const y = ((patternSeed * (i + 1) * 23) % 500);
    const size = 2 + ((patternSeed * (i + 1)) % 4);
    const opacity = 0.1 + ((patternSeed * i) % 20) / 100;
    patternElements.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="${opacity}"/>`);
  }

  // 传说级特效
  const legendaryEffect = isLegendary ? `
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <g opacity="0.5">
      ${Array.from({ length: 30 }, (_, i) => {
        const sx = (patternSeed * (i + 1) * 31) % 500;
        const sy = (patternSeed * (i + 1) * 37) % 500;
        const ss = 1 + (patternSeed * i) % 3;
        return `<circle cx="${sx}" cy="${sy}" r="${ss}" fill="#fff"/>`;
      }).join('')}
    </g>
  ` : '';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor1}"/>
      <stop offset="100%" style="stop-color:${bgColor2}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.15)"/>
      <stop offset="50%" style="stop-color:rgba(255,255,255,0)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.1)"/>
    </linearGradient>
    ${isLegendary ? '<filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' : ''}
  </defs>
  
  <!-- 背景 -->
  <rect width="500" height="500" fill="url(#bg)"/>
  
  <!-- 装饰图案 -->
  <g>
    ${patternElements.join('')}
  </g>
  ${legendaryEffect}
  
  <!-- 边框 -->
  <rect x="15" y="15" width="470" height="470" fill="none" stroke="${accentColor}" stroke-width="2" rx="20" opacity="0.6"/>
  <rect x="25" y="25" width="450" height="450" fill="none" stroke="${accentColor}" stroke-width="1" rx="15" opacity="0.3"/>
  
  <!-- 光泽 -->
  <rect width="500" height="500" fill="url(#shine)"/>
  
  <!-- 顶部标签 -->
  <rect x="140" y="35" width="220" height="40" rx="20" fill="rgba(0,0,0,0.5)"/>
  <text x="250" y="62" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    🎨 个人纪念 #${mintNumber}
  </text>
  
  <!-- 主图标 -->
  <text x="250" y="230" text-anchor="middle" font-size="100" ${isLegendary ? 'filter="url(#glow)"' : ''}>
    ${rarityIcon}
  </text>
  
  <!-- NFT名称 -->
  <text x="250" y="320" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">
    毕业纪念 #${mintNumber}
  </text>
  
  <!-- 稀有度标签 -->
  <rect x="175" y="345" width="150" height="35" rx="17" fill="${
    isLegendary ? 'rgba(251, 191, 36, 0.4)' : 
    isRare ? 'rgba(168, 85, 247, 0.4)' : 
    'rgba(100, 116, 139, 0.4)'
  }" stroke="${
    isLegendary ? '#fbbf24' : 
    isRare ? '#a855f7' : 
    '#94a3b8'
  }" stroke-width="1"/>
  <text x="250" y="370" text-anchor="middle" fill="${
    isLegendary ? '#fef3c7' : 
    isRare ? '#e9d5ff' : 
    '#e2e8f0'
  }" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
    ${rarityName}
  </text>
  
  <!-- 底部信息 -->
  <text x="250" y="425" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="12">
    示例大学 · 2024届毕业纪念
  </text>
  
  <!-- Token ID -->
  <rect x="185" y="440" width="130" height="28" rx="14" fill="rgba(0,0,0,0.5)"/>
  <text x="250" y="460" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="monospace" font-size="12">
    Token #${tokenId}
  </text>
</svg>
  `.trim();
}

// 生成官方NFT的SVG
function generateOfficialNFTSVG(tokenId: number): string {
  const config = OFFICIAL_NFT_CONFIG[tokenId];
  if (!config) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect fill="#333" width="500" height="500"/><text x="250" y="250" text-anchor="middle" fill="#fff" font-size="24">NFT Not Found</text></svg>`;
  }

  const isLegendary = config.rarity === '传说';
  const isRare = config.rarity === '稀有';

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${config.bgGradient[0]}"/>
      <stop offset="100%" style="stop-color:${config.bgGradient[1]}"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.2)"/>
      <stop offset="50%" style="stop-color:rgba(255,255,255,0)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.1)"/>
    </linearGradient>
    ${isLegendary ? '<filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' : ''}
  </defs>
  
  <rect width="500" height="500" fill="url(#bg)"/>
  <rect x="15" y="15" width="470" height="470" fill="none" stroke="${config.accentColor}" stroke-width="2" rx="20" opacity="0.5"/>
  <rect x="25" y="25" width="450" height="450" fill="none" stroke="${config.accentColor}" stroke-width="1" rx="15" opacity="0.3"/>
  <rect width="500" height="500" fill="url(#shine)"/>
  
  <rect x="150" y="40" width="200" height="36" rx="18" fill="rgba(0,0,0,0.4)"/>
  <text x="250" y="65" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    🏛️ 官方认证
  </text>
  
  <text x="250" y="240" text-anchor="middle" font-size="120" ${isLegendary ? 'filter="url(#glow)"' : ''}>
    ${config.icon}
  </text>
  
  <text x="250" y="330" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="bold">
    ${config.name}
  </text>
  
  <rect x="175" y="355" width="150" height="32" rx="16" fill="${
    isLegendary ? 'rgba(251, 191, 36, 0.3)' : 
    isRare ? 'rgba(168, 85, 247, 0.3)' : 
    'rgba(59, 130, 246, 0.3)'
  }" stroke="${
    isLegendary ? '#fbbf24' : 
    isRare ? '#a855f7' : 
    '#3b82f6'
  }" stroke-width="1"/>
  <text x="250" y="378" text-anchor="middle" fill="${
    isLegendary ? '#fef3c7' : 
    isRare ? '#e9d5ff' : 
    '#bfdbfe'
  }" font-family="Arial, sans-serif" font-size="14" font-weight="bold">
    ${config.rarity}
  </text>
  
  <text x="250" y="430" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="Arial, sans-serif" font-size="12">
    示例大学 · 2024届毕业纪念
  </text>
  
  <rect x="200" y="445" width="100" height="24" rx="12" fill="rgba(0,0,0,0.4)"/>
  <text x="250" y="462" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="monospace" font-size="12">
    #${tokenId}
  </text>
</svg>
  `.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tokenId: string } }
) {
  const tokenId = parseInt(params.tokenId);
  
  // 从URL参数获取个人NFT数据
  const searchParams = request.nextUrl.searchParams;
  const rarity = parseInt(searchParams.get('rarity') || '0');
  const colorSeed = BigInt(searchParams.get('colorSeed') || '0');
  const mintNumber = parseInt(searchParams.get('mintNumber') || tokenId.toString());

  let svg: string;
  
  if (tokenId >= 1 && tokenId <= 4) {
    // 官方NFT
    svg = generateOfficialNFTSVG(tokenId);
  } else if (tokenId >= 10001) {
    // 个人纪念NFT
    svg = generatePersonalNFTSVG(tokenId, rarity, colorSeed, mintNumber);
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect fill="#1a1a2e" width="500" height="500"/><text x="250" y="250" text-anchor="middle" fill="#fff" font-size="20">NFT #${tokenId}</text></svg>`;
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
