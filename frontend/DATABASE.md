# 📘 数据库使用指南

## 🔄 开发流程

### 每次重新部署区块链时的步骤

当你重启 Hardhat 节点并重新部署合约时，需要同步清空数据库：

```bash
# 1. 停止前端服务器 (Ctrl + C)

# 2. 清空数据库
cd frontend
npm run db:clear

# 3. 重新启动前端
npm run dev
```

---

## 📋 常用命令

### 清空数据库
```bash
npm run db:clear
```
**何时使用：** 每次重启 Hardhat 节点后

### 查看数据库
```bash
npm run db:studio
```
**访问：** http://localhost:5555

### 数据库迁移
```bash
# 创建新的迁移
npx prisma migrate dev --name 迁移名称

# 重新生成 Prisma Client
npx prisma generate
```

---

## 🎯 不同环境的处理方式

### 开发环境（当前）
- **区块链：** Hardhat 本地节点（重启后数据清空）
- **数据库：** 本地 PostgreSQL（数据持久化）
- **解决方案：** 每次重启节点后运行 `npm run db:clear`

### 测试网环境（推荐用于毕设演示）
- **区块链：** Sepolia / Polygon Amoy（数据永久保存）
- **数据库：** 本地或云端 PostgreSQL
- **优点：** 
  - ✅ 数据永久保存，无需清空数据库
  - ✅ 可以随时刷新页面，数据不会丢失
  - ✅ 适合演示和答辩

### 生产环境
- **区块链：** 以太坊主网 / Polygon 主网
- **数据库：** 云端 PostgreSQL（如 Neon、Supabase）
- **部署：** Vercel / Netlify

---

## 🔍 数据一致性检查

如果发现数据不一致（链上和数据库不匹配），可以：

1. **方案一：清空数据库重新开始**
   ```bash
   npm run db:clear
   ```

2. **方案二：从链上同步数据（未来功能）**
   - 可以实现一个"从链上导入数据"的功能
   - 扫描所有链上事件，重建数据库

---

## 📊 数据库表结构

| 表名 | 说明 |
|------|------|
| `User` | 用户/毕业生信息 |
| `NFTRecord` | NFT铸造记录 |
| `ActivityLog` | 操作日志 |
| `Statistics` | 每日统计 |

---

## ⚠️ 常见问题

### Q: 为什么重启节点后数据还在数据库？
A: PostgreSQL 是持久化存储，不会因为区块链重启而清空。

### Q: 能自动同步吗？
A: 开发环境建议手动清空。测试网/主网环境则不需要清空，因为区块链数据永久保存。

### Q: 清空数据库会影响什么？
A: 只清空数据库中的记录，不会影响区块链上的数据。两者是独立的。

---

## 🚀 推荐：部署到测试网

为了避免频繁清空数据库，强烈建议部署到测试网：

```bash
# 部署到 Polygon Amoy 测试网
cd ..
npx hardhat run scripts/deploy.js --network amoy
```

部署后，区块链数据永久保存，数据库也不需要清空了！

