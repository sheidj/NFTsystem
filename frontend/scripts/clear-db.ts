import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载 .env 文件
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clearDatabase() {
  console.log('🗑️  开始清空数据库...\n');

  try {
    // 删除所有数据（按依赖关系顺序）
    const deletedLogs = await prisma.activityLog.deleteMany();
    console.log(`✅ 删除 ${deletedLogs.count} 条活动日志`);

    const deletedStats = await prisma.statistics.deleteMany();
    console.log(`✅ 删除 ${deletedStats.count} 条统计记录`);

    const deletedNFTs = await prisma.nFTRecord.deleteMany();
    console.log(`✅ 删除 ${deletedNFTs.count} 条NFT记录`);

    const deletedUsers = await prisma.user.deleteMany();
    console.log(`✅ 删除 ${deletedUsers.count} 条用户记录`);

    console.log('\n✨ 数据库已清空！可以重新开始测试了。\n');
  } catch (error) {
    console.error('❌ 清空数据库失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

clearDatabase();

