import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // 禁用缓存，确保数据最新

export async function GET() {
  try {
    // 1. 基础统计
    const totalUsers = await prisma.user.count({
      where: { isRegistered: true }
    });

    const totalOfficial = await prisma.nFTRecord.count({
      where: { type: 'official' }
    });

    const totalPersonal = await prisma.nFTRecord.count({
      where: { type: 'personal' }
    });

    // 2. 学院分布
    const collegeStats = await prisma.user.groupBy({
      by: ['college'],
      where: { 
        isRegistered: true,
        college: { not: null } 
      },
      _count: {
        _all: true
      },
    });

    // 3. 稀有度分布 (个人NFT)
    const rarityStats = await prisma.nFTRecord.groupBy({
      by: ['rarity'],
      where: { type: 'personal' },
      _count: {
        _all: true
      },
    });

    // 4. 最近活动 (最新的20条铸造记录)
    const recentMints = await prisma.nFTRecord.findMany({
      take: 20,
      orderBy: { syncedAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            walletAddress: true,
          }
        }
      }
    });

    return NextResponse.json({
      summary: {
        users: totalUsers,
        officialNFTs: totalOfficial,
        personalNFTs: totalPersonal,
      },
      distribution: {
        college: collegeStats.map(s => ({ name: s.college, count: s._count._all })),
        rarity: rarityStats.map(s => ({ rarity: s.rarity, count: s._count._all })),
      },
      recentActivity: recentMints.map(m => ({
        tokenId: m.tokenId,
        type: m.type,
        rarity: m.rarity,
        user: m.user?.name || m.user?.walletAddress.slice(0, 6) + '...' || 'Unknown',
        time: m.syncedAt,
      }))
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

