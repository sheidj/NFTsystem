/**
 * @file NFT铸造记录API路由
 * @description 将NFT铸造事件同步到PostgreSQL数据库
 * 
 * 【功能概述】
 * 1. 接收NFT铸造信息（链上事件的数据）
 * 2. 创建或更新用户记录
 * 3. 在数据库中创建NFT记录
 * 4. 记录活动日志（Activity Log）
 * 5. 更新每日统计数据
 * 
 * 【数据流】
 * 区块链事件 → 前端监听 → 调用此API → 存入PostgreSQL
 * 
 * 【调用场景】
 * 1. 管理员发放官方NFT后（frontend/app/admin/page.tsx）
 * 2. 学生铸造个人NFT后（frontend/app/mint/page.tsx）
 * 
 * 【数据模型】
 * - User: 用户基本信息
 * - NFTRecord: NFT所有权记录
 * - ActivityLog: 操作日志
 * - Statistics: 每日统计数据
 * 
 * @route POST /api/db/mint
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * 处理NFT铸造记录的POST请求
 * @param request 包含铸造信息的请求体
 * @returns NFT记录或错误信息
 */
export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { 
      walletAddress,   // 用户钱包地址
      tokenId,         // NFT的Token ID
      type,            // NFT类型：'official' 或 'personal'
      rarity,          // 稀有度（个人NFT专用）：0=普通, 1=稀有, 2=传说
      colorSeed,       // 颜色种子（个人NFT专用）
      mintNumber,      // 全局铸造序号（个人NFT专用）
      mintTime,        // 链上时间戳（秒）
      txHash,          // 交易哈希
      blockNumber      // 区块号（可选）
    } = body;

    // 【步骤1】验证必要字段
    if (!walletAddress || !tokenId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 【步骤2】确保用户存在
    // 查找用户，地址转小写以确保一致性
    let user = await prisma.user.findUnique({
      where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (!user) {
      // 如果用户不存在，创建新用户记录
      // 注意：正常情况下用户应该已通过/api/db/user注册
      user = await prisma.user.create({
        data: {
          walletAddress: walletAddress.toLowerCase(),
          isRegistered: false,  // 标记为未正式注册
        },
      });
    }

    // 【步骤3】创建NFT记录（使用链上时间）
    // 将链上时间戳（秒）转换为JavaScript Date对象（UTC时间）
    // 区块链时间戳已经是UTC，直接乘以1000转为毫秒
    const chainMintTime = mintTime 
      ? new Date(Number(mintTime) * 1000)  // 链上时间是UTC秒级时间戳
      : new Date();
    
    // 调试日志：对比区块链浏览器时间
    console.log('🕐 API时间转换调试:', {
      receivedMintTime: mintTime,
      mintTimeType: typeof mintTime,
      convertedISO: chainMintTime.toISOString(), // ISO 8601格式 (UTC)
      convertedUTC: chainMintTime.toUTCString(), // UTC字符串
      unixTimestamp: Math.floor(chainMintTime.getTime() / 1000), // 转回Unix时间戳对比
    });
    
    const nft = await prisma.nFTRecord.create({
      data: {
        tokenId: Number(tokenId),                                        // NFT ID
        userId: user.id,                                                 // 关联用户ID
        type,                                                            // 'official' 或 'personal'
        rarity: rarity !== undefined ? Number(rarity) : null,            // 稀有度（个人NFT）
        colorSeed: colorSeed ? String(colorSeed) : null,                 // 颜色种子（个人NFT）
        mintNumber: mintNumber !== undefined ? Number(mintNumber) : null, // 铸造序号（个人NFT）
        mintTime: type === 'personal' ? chainMintTime : null,            // 个人NFT铸造时间（链上时间）
        txHash,                                                          // 区块链交易哈希
        blockNumber: blockNumber ? Number(blockNumber) : null,           // 区块号
      },
    });

    // 【步骤3.5】如果是官方NFT铸造，更新用户的hasClaimed和mintedAt字段（使用链上时间）
    if (type === 'official') {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          hasClaimed: true,
          mintedAt: chainMintTime, // 使用链上时间
        },
      });
    }

    // 【步骤4】记录活动日志
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: type === 'official' ? 'MINT_OFFICIAL' : 'MINT_PERSONAL',  // 操作类型
        details: JSON.stringify({ tokenId, rarity }),                      // 详细信息
        txHash,                                                            // 交易哈希
      },
    });

    // 【步骤5】更新每日统计数据
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // 重置为当天0点

    // 使用upsert：如果今天的记录存在则更新，不存在则创建
    await prisma.statistics.upsert({
      where: { date: today },
      update: {
        // 根据NFT类型递增相应的计数器
        totalPersonalMints: type === 'personal' ? { increment: 1 } : undefined,
        totalOfficialMints: type === 'official' ? { increment: 1 } : undefined,
      },
      create: {
        date: today,
        totalPersonalMints: type === 'personal' ? 1 : 0,
        totalOfficialMints: type === 'official' ? 1 : 0,
        totalUsers: 0,  // 用户总数由其他逻辑维护
      },
    });

    // 返回创建的NFT记录
    return NextResponse.json(nft);
  } catch (error) {
    console.error('❌ 同步铸造记录失败:', error);
    
    // 处理重复记录错误（tokenId的唯一性约束）
    // 这种情况可能发生在用户刷新页面导致重复提交
    if (String(error).includes('Unique constraint failed')) {
      return NextResponse.json({ message: 'Record already exists' });
    }
    
    // 其他错误返回500
    return NextResponse.json({ error: 'Failed to sync mint' }, { status: 500 });
  }
}

