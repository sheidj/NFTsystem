/**
 * @file 个人NFT IPFS上传API路由
 * @description 自动将个人NFT的SVG图片和JSON元数据上传到Pinata IPFS
 * 
 * 【功能概述】
 * 1. 接收个人NFT的铸造数据（tokenId, rarity, colorSeed, mintNumber）
 * 2. 动态生成独特的SVG图片
 * 3. 将SVG上传到IPFS并获取CID
 * 4. 生成包含IPFS图片URI的JSON元数据
 * 5. 将JSON元数据上传到IPFS并获取CID
 * 6. 返回两个CID和网关链接
 * 
 * 【技术要点】
 * - 使用axios和form-data进行multipart/form-data请求
 * - 与/api/image/[tokenId]的SVG生成逻辑保持一致
 * - 支持JWT或API Key两种Pinata认证方式
 * - 详细的错误日志用于调试
 * 
 * 【调用时机】
 * - 在学生成功铸造个人NFT后，由前端自动调用
 * - 位置：frontend/app/mint/page.tsx 的铸造成功处理中
 * 
 * @route POST /api/ipfs/upload-personal
 */

import { NextRequest, NextResponse } from 'next/server';

// ==========================================
// Pinata配置
// ==========================================

// 从环境变量获取Pinata认证凭证
const PINATA_JWT = process.env.PINATA_JWT;               // 推荐：JWT认证
const PINATA_API_KEY = process.env.PINATA_API_KEY;       // 备选：API Key认证
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY; // 备选：Secret Key认证

// Pinata API端点
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';   // 文件上传
const PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';   // JSON上传

// ==========================================
// 辅助函数
// ==========================================

/**
 * 获取Pinata认证请求头
 * @returns 认证请求头对象
 * @throws 如果凭证未配置则抛出错误
 * @description 优先使用JWT认证，其次使用API Key认证
 */
function getPinataHeaders() {
  if (PINATA_JWT) {
    // 方式1：JWT Bearer Token（推荐）
    return {
      'Authorization': `Bearer ${PINATA_JWT}`
    };
  } else if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    // 方式2：API Key + Secret Key
    return {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY
    };
  }
  throw new Error('Pinata credentials not configured');
}

/**
 * 根据颜色种子生成HSL颜色
 * @param seed 颜色种子（来自链上随机数）
 * @param offset 偏移量（用于生成多个不同的颜色）
 * @returns HSL颜色对象 {h, s, l}
 * @description 与/api/image/[tokenId]的逻辑完全一致，确保生成的SVG颜色相同
 */
function seedToColor(seed: bigint, offset: number = 0): { h: number; s: number; l: number } {
  const seedNum = Number(seed % BigInt(1000000));
  const h = (seedNum + offset * 137) % 360;  // 色相：0-360度
  const s = 60 + (seedNum % 30);             // 饱和度：60-90%
  const l = 35 + (seedNum % 20);             // 亮度：35-55%
  return { h, s, l };
}

/**
 * 将HSL颜色转换为十六进制颜色
 * @param h 色相（0-360）
 * @param s 饱和度（0-100）
 * @param l 亮度（0-100）
 * @returns 十六进制颜色字符串（如"#ff5733"）
 */
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

// 生成个人NFT的SVG（与image API保持一致）
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
  
  const color1 = seedToColor(colorSeed, 0);
  const color2 = seedToColor(colorSeed, 1);
  const color3 = seedToColor(colorSeed, 2);
  
  const bgColor1 = hslToHex(color1.h, color1.s, color1.l);
  const bgColor2 = hslToHex(color2.h, color2.s, color2.l + 15);
  const accentColor = hslToHex(color3.h, 70, 60);
  
  const isLegendary = rarity === 2;
  const isRare = rarity === 1;

  const patternElements = [];
  const patternSeed = Number(colorSeed % BigInt(10000));
  for (let i = 0; i < 15; i++) {
    const x = ((patternSeed * (i + 1) * 17) % 500);
    const y = ((patternSeed * (i + 1) * 23) % 500);
    const size = 2 + ((patternSeed * (i + 1)) % 4);
    const opacity = 0.1 + ((patternSeed * i) % 20) / 100;
    patternElements.push(`<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="${opacity}"/>`);
  }

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
  
  <rect width="500" height="500" fill="url(#bg)"/>
  <g>${patternElements.join('')}</g>
  ${legendaryEffect}
  <rect x="15" y="15" width="470" height="470" fill="none" stroke="${accentColor}" stroke-width="2" rx="20" opacity="0.6"/>
  <rect x="25" y="25" width="450" height="450" fill="none" stroke="${accentColor}" stroke-width="1" rx="15" opacity="0.3"/>
  <rect width="500" height="500" fill="url(#shine)"/>
  <rect x="140" y="35" width="220" height="40" rx="20" fill="rgba(0,0,0,0.5)"/>
  <text x="250" y="62" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">🎨 个人纪念 #${mintNumber}</text>
  <text x="250" y="230" text-anchor="middle" font-size="100" ${isLegendary ? 'filter="url(#glow)"' : ''}>${rarityIcon}</text>
  <text x="250" y="320" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="bold">毕业纪念 #${mintNumber}</text>
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
  }" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${rarityName}</text>
  <text x="250" y="425" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial, sans-serif" font-size="12">示例大学 · 2024届毕业纪念</text>
  <rect x="185" y="440" width="130" height="28" rx="14" fill="rgba(0,0,0,0.5)"/>
  <text x="250" y="460" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="monospace" font-size="12">Token #${tokenId}</text>
</svg>
  `.trim();
}

// 上传文件到IPFS（使用axios和form-data）
async function uploadFileToIPFS(svgContent: string, fileName: string): Promise<string> {
  try {
    const FormData = (await import('form-data')).default;
    const axios = (await import('axios')).default;
    
    const formData = new FormData();
    
    // 将SVG内容作为Buffer添加
    formData.append('file', Buffer.from(svgContent, 'utf-8'), {
      filename: fileName,
      contentType: 'image/svg+xml',
    });
    
    const metadata = JSON.stringify({ name: fileName });
    formData.append('pinataMetadata', metadata);

    const headers = {
      ...getPinataHeaders(),
      ...formData.getHeaders(),
    };

    const response = await axios.post(PINATA_PIN_FILE_URL, formData, {
      headers: headers,
      maxBodyLength: Infinity,
    });

    return response.data.IpfsHash;
  } catch (error: any) {
    console.error(`上传文件失败 ${fileName}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.response?.data?.error || error.message);
  }
}

// 上传JSON到IPFS（使用axios）
async function uploadJSONToIPFS(jsonData: any, name: string): Promise<string> {
  try {
    const axios = (await import('axios')).default;
    
    const data = {
      pinataContent: jsonData,
      pinataMetadata: {
        name: name,
      }
    };

    const headers = {
      ...getPinataHeaders(),
      'Content-Type': 'application/json'
    };

    const response = await axios.post(PINATA_PIN_JSON_URL, data, {
      headers: headers,
    });

    return response.data.IpfsHash;
  } catch (error: any) {
    console.error(`上传 JSON 失败 ${name}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || error.response?.data?.error || error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📥 收到IPFS上传请求');
    
    // 检查Pinata配置
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
      console.error('❌ Pinata凭证未配置');
      return NextResponse.json(
        { error: 'Pinata credentials not configured' },
        { status: 500 }
      );
    }
    console.log('✓ Pinata凭证已配置');

    const body = await request.json();
    const { tokenId, rarity, colorSeed, mintNumber } = body;
    console.log('📦 请求数据:', { tokenId, rarity, colorSeed, mintNumber });

    if (!tokenId || rarity === undefined || !colorSeed || !mintNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenId, rarity, colorSeed, mintNumber' },
        { status: 400 }
      );
    }

    // 验证是个人NFT
    if (tokenId < 10001) {
      return NextResponse.json(
        { error: 'Only personal NFTs (tokenId >= 10001) can be uploaded' },
        { status: 400 }
      );
    }

    const rarityNames = ['Common', 'Rare', 'Legendary'];
    const rarityName = rarityNames[rarity] || 'Common';

    // 1. 生成SVG
    console.log('🎨 生成SVG图片...');
    const svgContent = generatePersonalNFTSVG(
      Number(tokenId),
      Number(rarity),
      BigInt(colorSeed),
      Number(mintNumber)
    );
    console.log(`✓ SVG生成成功 (${svgContent.length} 字节)`);

    // 2. 上传SVG到IPFS
    console.log('📤 上传SVG到Pinata...');
    const imageFileName = `personal-nft-${tokenId}.svg`;
    const imageCID = await uploadFileToIPFS(svgContent, imageFileName);
    const imageURI = `ipfs://${imageCID}`;
    console.log('✓ SVG上传成功，CID:', imageCID);

    // 3. 生成元数据
    const metadata = {
      name: `毕业纪念 #${mintNumber}`,
      description: `独一无二的毕业纪念NFT，稀有度：${rarityName}`,
      image: imageURI,
      external_url: request.nextUrl.origin,
      attributes: [
        {
          trait_type: 'Rarity',
          value: rarityName,
        },
        {
          trait_type: 'Type',
          value: 'Personal Memorial',
        },
        {
          trait_type: 'Token ID',
          value: tokenId.toString(),
        },
        {
          trait_type: 'Mint Number',
          value: mintNumber.toString(),
        },
        {
          trait_type: 'Color Seed',
          value: colorSeed.toString(),
        },
      ],
    };

    // 4. 上传元数据到IPFS
    console.log('📤 上传元数据到Pinata...');
    const metadataFileName = `personal-nft-metadata-${tokenId}.json`;
    const metadataCID = await uploadJSONToIPFS(metadata, metadataFileName);
    const metadataURI = `ipfs://${metadataCID}`;
    console.log('✓ 元数据上传成功，CID:', metadataCID);

    console.log('✅ IPFS上传完成！');
    return NextResponse.json({
      success: true,
      tokenId: Number(tokenId),
      imageCID,
      imageURI,
      metadataCID,
      metadataURI,
      gateway: {
        image: `https://gateway.pinata.cloud/ipfs/${imageCID}`,
        metadata: `https://gateway.pinata.cloud/ipfs/${metadataCID}`,
      },
    });
  } catch (error: any) {
    console.error('❌ IPFS上传失败:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}

