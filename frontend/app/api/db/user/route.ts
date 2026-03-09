import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 创建或更新用户 (注册学生)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      walletAddress, 
      studentId, 
      name, 
      college, 
      major, 
      isRegistered,
      // 链上状态字段 (可选，用于同步链上数据)
      hasClaimed,
      mintedAt,
      selfMintCount,
      pityCounter,
    } = body;

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    // 构建更新数据
    const updateData: any = {
      studentId,
      name,
      college,
      major,
    };
    
    // 只有在明确传递时才更新链上状态字段
    if (hasClaimed !== undefined) updateData.hasClaimed = hasClaimed;
    if (mintedAt !== undefined) updateData.mintedAt = mintedAt ? new Date(Number(mintedAt) * 1000) : null;
    if (selfMintCount !== undefined) updateData.selfMintCount = Number(selfMintCount);
    if (pityCounter !== undefined) updateData.pityCounter = Number(pityCounter);
    
    // 处理注册状态
    if (isRegistered !== undefined) {
      updateData.isRegistered = isRegistered;
      if (isRegistered && !updateData.registeredAt) {
        updateData.registeredAt = new Date();
      }
    }

    // 使用 upsert: 如果存在则更新，不存在则创建
    const user = await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: updateData,
      create: {
        walletAddress: walletAddress.toLowerCase(),
        studentId,
        name,
        college,
        major,
        isRegistered: isRegistered ?? true,
        registeredAt: new Date(),
        hasClaimed: hasClaimed ?? false,
        mintedAt: mintedAt ? new Date(Number(mintedAt) * 1000) : null,
        selfMintCount: selfMintCount ?? 0,
        pityCounter: pityCounter ?? 0,
      },
    });

    // 记录日志
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'REGISTER',
        details: JSON.stringify({ studentId, name, college, hasClaimed, selfMintCount }),
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}

// 获取用户信息
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress: address.toLowerCase() },
      include: {
        nfts: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

