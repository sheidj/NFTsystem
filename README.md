# 🎓 毕业纪念 NFT 系统

基于区块链技术的毕业纪念品管理系统，使用 ERC-1155 标准实现官方证书和个人纪念品的发放与管理。

> **📖 重要文档**：
> - **[技术实现文档](./技术实现文档.md)** - 详细说明系统功能的具体实现流程和代码位置
> - **[数据库设置说明](./frontend/DATABASE.md)** - 数据库管理和维护指南
> - **智能合约** - 详细的中文注释，查看 `contracts/GraduationNFT.sol`
> - **API文档** - 详细的接口注释，查看 `frontend/app/api/` 目录

---

## 📋 目录

1. [项目简介](#项目简介)
2. [技术栈](#技术栈)
3. [系统架构](#系统架构)
4. [功能特性](#功能特性)
5. [快速开始](#快速开始)
6. [开发指南](#开发指南)
7. [部署指南](#部署指南)
8. [使用手册](#使用手册)
9. [常见问题](#常见问题)
10. [技术细节](#技术细节)
11. [代码说明](#代码说明)

---

## 🎯 项目简介

这是一个基于以太坊区块链的毕业纪念品管理系统，专为**江西软件大学 2026届**毕业生设计。系统支持：

- 🏛️ **官方NFT发放** - 毕业证书、荣誉证书等官方认证NFT
- 🎨 **个人NFT铸造** - 学生自主铸造专属纪念品
- 🔄 **NFT转移** - 个人NFT可在学生间转移
- 📊 **数据统计** - 实时统计和可视化展示
- 💾 **数据持久化** - PostgreSQL数据库同步区块链数据

### 项目特点

✨ **永久保存** - 数据存储在区块链上，永久不可篡改  
🎲 **稀有度系统** - 普通(70%)、稀有(25%)、传说(5%)  
🎯 **保底机制** - 20次必出稀有或传说  
📱 **响应式设计** - 完美适配移动端和桌面端  
🔐 **安全可靠** - 智能合约经过测试，权限管理完善  

---

## 🛠️ 技术栈

### 区块链层
- **Solidity** - 智能合约开发语言
- **Hardhat** - 以太坊开发环境
- **ERC-1155** - 多代币标准协议
- **OpenZeppelin** - 安全的智能合约库

### 前端层
- **Next.js 14** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化CSS框架
- **Wagmi** - React Hooks for Ethereum
- **RainbowKit** - 钱包连接组件库

### 存储层
- **IPFS** - 去中心化存储（通过 Pinata）
- **PostgreSQL** - 关系型数据库
- **Prisma** - 现代化 ORM

### 测试网络
- **Sepolia** - 以太坊测试网
- **Polygon Amoy** - Polygon 测试网（可选）

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户界面层                           │
│  Next.js + React + TypeScript + Tailwind CSS + RainbowKit │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   区块链交互层   │    │   数据持久化层    │
│  Wagmi + Viem   │    │  Prisma + PG     │
└────────┬────────┘    └────────┬─────────┘
         │                      │
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│   智能合约层     │    │   PostgreSQL     │
│  ERC-1155       │    │   数据库         │
│  Sepolia        │    │                  │
└─────────────────┘    └──────────────────┘
         │
         ▼
┌─────────────────┐
│   存储层        │
│  IPFS (Pinata)  │
└─────────────────┘
```

---

## ✨ 功能特性

### 1. 官方NFT管理

**管理员功能：**
- ✅ 注册学生信息（学号、姓名、专业、学院）
- ✅ 批量注册学生
- ✅ 发放官方NFT（毕业证书、荣誉证书等）
- ✅ 批量发放NFT
- ✅ 查询学生信息

**官方NFT类型：**
1. 🎓 **毕业证书** - 毕业认证（金色史诗）
2. 🏆 **荣誉证书** - 优秀毕业生（紫色传说）
3. ⭐ **特殊成就** - 特殊贡献奖（蓝色稀有）
4. 🎖️ **学业徽章** - 学术成就（绿色稀有）

### 2. 个人NFT铸造

**学生功能：**
- ✅ 每日可铸造5次个人NFT
- ✅ 随机稀有度（普通70%、稀有25%、传说5%）
- ✅ 保底机制（20次必出稀有或传说）
- ✅ 每个NFT拥有独特颜色和编号
- ✅ 实时查看铸造结果和属性

**稀有度系统：**
- 🎨 **普通(70%)** - 基础纪念品
- 🌟 **稀有(25%)** - 闪耀的回忆
- 💎 **传说(5%)** - 璀璨珍藏

### 3. NFT收藏管理

- ✅ 查看所有拥有的NFT（官方+个人）
- ✅ 按类型筛选（全部/官方/个人）
- ✅ 按稀有度筛选（仅个人NFT）
- ✅ 搜索功能（Token ID）
- ✅ 查看NFT详细信息
- ✅ 导入NFT到MetaMask

### 4. NFT转移功能

- ✅ 转移个人NFT给其他学生
- ✅ 官方NFT不可转移（保证权威性）
- ✅ 实时更新持有状态

### 5. 数据统计

**统计内容：**
- 📊 学校信息和毕业生总数
- 📊 NFT总铸造量
- 📊 官方NFT发放统计
- 📊 个人NFT稀有度分布
- 📊 学院分布统计
- 📊 最近活动记录

### 6. 响应式设计

- 📱 完美适配手机（320px+）
- 💻 平板和笔记本优化
- 🖥️ 桌面大屏支持
- ⚡ 流畅的动画和过渡效果

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 14.0
- **MetaMask** 浏览器扩展

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd NFT
```

### 2. 安装依赖

```bash
# 安装合约依赖
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 3. 配置环境变量

#### 根目录 `.env`

```env
# Pinata IPFS 配置
PINATA_JWT=your_pinata_jwt_token

# IPFS Base URI
IPFS_BASE_URI=ipfs://your_ipfs_cid/

# 部署账户私钥（不含0x前缀）
PRIVATE_KEY=your_private_key_without_0x

# Sepolia RPC URL
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Etherscan API Key（用于合约验证）
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### 前端目录 `frontend/.env`

```env
# 合约地址
NEXT_PUBLIC_CONTRACT_ADDRESS=0x447191C99A73bcb6f58F17313048bd22457966B3

# 数据库连接
DATABASE_URL="postgresql://postgres:123456@localhost:5432/graduation_nft?schema=public"
```

### 4. 配置数据库

```bash
# 创建数据库
psql -U postgres
CREATE DATABASE graduation_nft;
\q

# 运行迁移
cd frontend
npx prisma migrate deploy
```

### 5. 上传元数据到 IPFS

```bash
# 编辑 metadata/images 中的SVG文件（可选）
# 编辑 metadata/*.json 元数据文件（可选）

# 上传到 IPFS
node scripts/upload-to-ipfs.js

# 记下输出的 Base URI，更新到 .env
```

### 6. 部署合约到 Sepolia

```bash
npm run deploy:sepolia
```

**记下合约地址，更新到 `frontend/.env`**

### 7. 启动前端

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000

### 8. 连接钱包

1. 打开 MetaMask
2. 切换到 Sepolia 测试网
3. 点击右上角"连接钱包"
4. 授权连接

---

## 📖 开发指南

### 项目结构

```
NFT/
├── contracts/              # 智能合约
│   └── GraduationNFT.sol  # 主合约
├── scripts/               # 脚本文件
│   ├── deploy.js         # 部署脚本
│   ├── interact.js       # 交互脚本
│   ├── upload-to-ipfs.js # IPFS上传脚本
│   └── register-student.js
├── test/                  # 合约测试
├── metadata/             # NFT元数据
│   ├── images/          # SVG图片
│   ├── 1.json          # 毕业证书元数据
│   ├── 2.json          # 荣誉证书元数据
│   └── ...
├── frontend/            # 前端应用
│   ├── app/            # Next.js 页面
│   ├── components/     # React 组件
│   ├── lib/           # 工具库
│   ├── prisma/        # 数据库
│   └── scripts/       # 前端脚本
├── hardhat.config.js  # Hardhat 配置
├── package.json       # 项目依赖
└── README.md         # 本文档
```

### 本地开发流程

#### 方式一：使用 Hardhat 本地网络（快速测试）

```bash
# 终端1：启动本地节点
npx hardhat node

# 终端2：部署合约
npx hardhat run scripts/deploy.js --network localhost

# 终端3：启动前端
cd frontend
npm run dev

# MetaMask 导入 Hardhat 测试账户
# 网络：http://127.0.0.1:8545
# Chain ID: 31337
```

#### 方式二：使用 Sepolia 测试网（正式测试）

```bash
# 1. 部署合约
npm run deploy:sepolia

# 2. 更新前端配置（frontend/.env）
# NEXT_PUBLIC_CONTRACT_ADDRESS=新合约地址

# 3. 清空数据库
cd frontend
npm run db:clear

# 4. 启动前端
npm run dev

# MetaMask 切换到 Sepolia 网络
```

### 开发技巧

#### 1. 查看数据库

```bash
cd frontend
npm run db:studio
```

访问 http://localhost:5555 使用 Prisma Studio

#### 2. 清空数据库

```bash
cd frontend
npm run db:clear
```

#### 3. 重新编译合约

```bash
npx hardhat clean
npx hardhat compile
```

#### 4. 测试合约

```bash
npx hardhat test
```

#### 5. 在 Etherscan 查看合约

```
https://sepolia.etherscan.io/address/[合约地址]
```

---

## 🌐 部署指南

### 部署到 Sepolia 测试网

#### 准备工作

1. **获取 Sepolia ETH**
   - 访问 [Sepolia Faucet](https://sepoliafaucet.com/)
   - 或 [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - 输入你的钱包地址获取测试币

2. **配置 Pinata**
   - 注册 [Pinata](https://www.pinata.cloud/)
   - 创建 API Key
   - 复制 JWT Token

3. **配置环境变量**
   - 编辑根目录 `.env`
   - 填入 `PINATA_JWT`、`PRIVATE_KEY`、`SEPOLIA_RPC_URL`

#### 部署步骤

```bash
# 1. 上传元数据到 IPFS
node scripts/upload-to-ipfs.js

# 2. 更新 .env 中的 IPFS_BASE_URI

# 3. 部署合约
npm run deploy:sepolia

# 4. 记录输出的合约地址

# 5. 更新 frontend/.env
# NEXT_PUBLIC_CONTRACT_ADDRESS=新合约地址

# 6. 清空数据库
cd frontend
npm run db:clear

# 7. 启动前端
npm run dev
```

#### 验证部署

1. **在 Etherscan 查看合约**
   ```
   https://sepolia.etherscan.io/address/[合约地址]
   ```

2. **测试基本功能**
   - 连接 MetaMask（Sepolia）
   - 访问管理面板
   - 注册测试学生
   - 发放测试NFT

### 部署前端到生产环境

#### Vercel 部署（推荐）

```bash
cd frontend

# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 生产环境部署
vercel --prod
```

**环境变量配置：**
在 Vercel 项目设置中添加：
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `DATABASE_URL`

---

## 📚 使用手册

### 管理员操作

#### 1. 访问管理面板

访问 `/admin` 页面，使用管理员钱包连接。

**管理员地址：** `0x3B0CeAf6021C9201CFbE76421738359b71cE2C00`

#### 2. 注册学生

**单个注册：**
1. 选择"单个注册"标签
2. 填写学生信息：
   - 钱包地址：`0x...`
   - 学号：`202200001`（从202200001开始）
   - 姓名：`张三`
   - 专业：`软件工程`
   - 学院：`软件学院`
3. 点击"注册学生"
4. 在 MetaMask 确认交易

**批量注册：**
1. 选择"批量注册"标签
2. 按格式输入（每行一个学生）：
   ```
   0x1234...abcd,202200001,张三,软件工程,软件学院
   0x5678...efgh,202200002,李四,计算机科学与技术,软件学院
   ```
3. 点击"批量注册"
4. 逐个确认交易

#### 3. 发放官方NFT

**单个发放：**
1. 选择"单个发放"标签
2. 输入学生钱包地址
3. 选择NFT类型（毕业证书/荣誉证书等）
4. 点击"发放NFT"
5. 确认交易

**批量发放：**
1. 选择"批量发放"标签
2. 选择NFT类型
3. 输入地址列表（每行一个）：
   ```
   0x1234...abcd
   0x5678...efgh
   ```
4. 点击"批量发放"
5. 逐个确认交易

#### 4. 查询学生信息

1. 选择"查询统计"标签
2. 输入学生钱包地址
3. 点击"查询"
4. 查看学生信息和铸造统计

### 学生操作

#### 1. 连接钱包

1. 点击右上角"连接钱包"
2. 选择 MetaMask
3. 切换到 Sepolia 网络
4. 授权连接

#### 2. 铸造个人NFT

1. 访问"铸造NFT"页面（`/mint`）
2. 查看今日剩余次数（每日5次）
3. 点击"铸造NFT"
4. 确认交易
5. 查看铸造结果（稀有度、编号等）

**提示：**
- 每天重置铸造次数
- 20次必出稀有或传说（保底机制）
- 每个NFT颜色和编号独一无二

#### 3. 查看我的NFT

1. 访问"我的NFT"页面（`/my-nfts`）
2. 查看所有拥有的NFT
3. 使用筛选器：
   - 类型：全部/官方/个人
   - 稀有度：全部/普通/稀有/传说（个人NFT）
   - 搜索：输入Token ID
4. 点击NFT卡片查看详情

#### 4. 查看NFT详情

1. 在NFT卡片上点击
2. 查看完整信息：
   - Token ID、稀有度、供应量
   - 编号、颜色种子（个人NFT）
   - 合约地址、持有量
3. 操作：
   - 🖼️ 查看原图
   - 📋 复制信息
   - 🦊 添加到MetaMask

#### 5. 转移NFT

1. 访问"转移NFT"页面（`/transfer`）
2. 选择要转移的个人NFT
3. 输入接收方地址
4. 点击"转移NFT"
5. 确认交易

**注意：** 官方NFT无法转移！

#### 6. 查看统计

访问"数据统计"页面（`/stats`）查看：
- 学校和毕业生信息
- NFT总铸造量
- 官方NFT发放统计
- 个人NFT稀有度分布
- 学院分布
- 最近活动

---

## ❓ 常见问题

### 合约相关

**Q: 合约部署失败？**

A: 检查：
1. 是否有足够的 Sepolia ETH（≥0.02 ETH）
2. `.env` 中的 `PRIVATE_KEY` 是否正确（64位十六进制，不含0x）
3. `SEPOLIA_RPC_URL` 是否可用
4. `IPFS_BASE_URI` 是否正确设置

**Q: 交易失败？**

A: 常见原因：
1. Gas 费不足 - 确保钱包有足够ETH
2. 未注册 - 学生必须先注册才能铸造
3. 每日次数用完 - 等待第二天重置
4. 网络拥堵 - 增加 Gas Price

**Q: 如何更新合约？**

A: 合约部署后无法更新，需要重新部署：
```bash
npm run deploy:sepolia
# 更新 frontend/.env 中的合约地址
# 清空数据库
cd frontend && npm run db:clear
```

### 前端相关

**Q: 前端无法连接合约？**

A: 检查：
1. `frontend/.env` 中的 `NEXT_PUBLIC_CONTRACT_ADDRESS` 是否正确
2. MetaMask 是否切换到 Sepolia 网络
3. 是否刷新页面

**Q: NFT图片不显示？**

A: 可能原因：
1. IPFS 网关响应慢 - 等待或刷新
2. Pinata Pin 失效 - 重新上传到 IPFS
3. 浏览器缓存 - 清除缓存重试

**Q: 统计页面数据不对？**

A: 可能原因：
1. 数据库未同步 - 检查 API 路由日志
2. 区块链数据更新延迟 - 等待几秒刷新
3. 缓存问题 - 硬刷新（Ctrl+Shift+R）

### 数据库相关

**Q: 数据库连接失败？**

A: 检查：
1. PostgreSQL 是否运行
2. `DATABASE_URL` 是否正确
3. 数据库是否创建（`graduation_nft`）
4. 用户名密码是否正确

**Q: 数据库迁移失败？**

A: 解决方法：
```bash
cd frontend
# 重置迁移
npx prisma migrate reset
# 重新迁移
npx prisma migrate deploy
```

**Q: 如何查看数据库数据？**

A: 使用 Prisma Studio：
```bash
cd frontend
npm run db:studio
```
访问 http://localhost:5555

### IPFS 相关

**Q: 元数据上传失败？**

A: 检查：
1. `PINATA_JWT` 是否正确
2. Pinata 账户是否有配额
3. 图片文件是否存在

**Q: 如何更新元数据？**

A: 
1. 编辑 `metadata/*.json` 文件
2. 重新运行上传脚本：
   ```bash
   node scripts/upload-to-ipfs.js
   ```
3. 更新 `.env` 中的 `IPFS_BASE_URI`
4. 重新部署合约（如果需要）

---

## 🔧 技术细节

### 智能合约

#### Token ID 设计

```
1-1000: 官方NFT
  1: 毕业证书
  2: 荣誉证书
  3: 特殊成就
  4: 学业徽章

10001+: 个人NFT（自增）
```

#### 稀有度算法

```solidity
uint256 random = uint256(keccak256(abi.encodePacked(
    block.timestamp,
    msg.sender,
    _randomNonce
))) % 100;

// 保底机制
if (graduate.pityCounter >= 20) {
    rarity = (random % 2 == 0) ? Rarity.Rare : Rarity.Legendary;
    graduate.pityCounter = 0;
} else {
    if (random < 5) rarity = Rarity.Legendary;
    else if (random < 30) rarity = Rarity.Rare;
    else rarity = Rarity.Common;
    
    if (rarity >= Rarity.Rare) {
        graduate.pityCounter = 0;
    } else {
        graduate.pityCounter++;
    }
}
```

#### 每日限制机制

```solidity
uint256 public constant DAILY_MINT_LIMIT = 5;
mapping(address => uint256) public dailyMintCount;
mapping(address => uint256) public lastMintDay;

function getRemainingMints(address user) public view returns (uint256) {
    uint256 today = block.timestamp / 1 days;
    if (lastMintDay[user] < today) {
        return DAILY_MINT_LIMIT;
    }
    return DAILY_MINT_LIMIT > dailyMintCount[user] 
        ? DAILY_MINT_LIMIT - dailyMintCount[user] 
        : 0;
}
```

### 前端架构

#### 状态管理

使用 React Hooks + Wagmi：
- `useAccount` - 钱包账户
- `useReadContract` - 读取合约
- `useWriteContract` - 写入合约
- `usePublicClient` - 公共客户端
- `useWalletClient` - 钱包客户端

#### 数据同步

```typescript
// 铸造成功后同步到数据库
await fetch('/api/db/mint', {
  method: 'POST',
  body: JSON.stringify({
    tokenId,
    ownerAddress,
    rarity,
    colorSeed,
    mintNumber,
    txHash,
    blockNumber,
  }),
});
```

#### API 路由

- `/api/db/user` - 用户同步
- `/api/db/mint` - NFT铸造同步
- `/api/db/stats` - 统计数据查询
- `/api/image/[tokenId]` - 动态生成NFT图片
- `/api/metadata/[tokenId]` - 动态生成NFT元数据

### 数据库设计

#### 表结构

**User（用户表）**
- id, address, studentId, studentName, major, college
- createdAt, updatedAt

**NFTRecord（NFT记录表）**
- id, tokenId, type, rarity, colorSeed, mintNumber
- ownerAddress, txHash, blockNumber, createdAt

**Statistics（统计表）**
- id, date, totalUsers, totalNFTs
- officialNFTs, personalNFTs, updatedAt

**ActivityLog（活动日志表）**
- id, type, description, address, tokenId, createdAt

---

## 📝 开发日志

### v1.0.0 (2025-12-06)

**初始版本发布**

✅ 完成功能：
- ERC-1155 智能合约实现
- 官方NFT和个人NFT系统
- 前端完整功能（注册、铸造、转移、查看）
- PostgreSQL数据库集成
- IPFS元数据存储
- Sepolia测试网部署
- 响应式设计优化

🎯 合约地址：`0x447191C99A73bcb6f58F17313048bd22457966B3`

---

## 📄 许可证

MIT License

---

## 👥 贡献者

感谢所有为这个项目做出贡献的人！

---

## 📚 代码说明

### 代码注释

本项目所有核心代码都已添加详细的中文注释，方便理解和维护：

#### 智能合约注释
- **文件位置**：`contracts/GraduationNFT.sol`
- **注释内容**：
  - 完整的合约功能说明
  - 每个函数的详细注释（参数、返回值、业务逻辑）
  - 数据结构和状态变量的说明
  - 事件定义和触发时机
  - 安全机制和权限控制说明
  - 盲盒机制和保底系统的详细解释

#### 前端代码注释
- **主要文件**：
  - `frontend/app/mint/page.tsx` - 学生铸造页面（包含完整的交易处理流程）
  - `frontend/app/admin/page.tsx` - 管理员面板（注册、发放、查询功能）
- **注释特点**：
  - 组件功能说明
  - 关键业务逻辑解释
  - 状态管理说明
  - 与智能合约的交互细节

#### 后端API注释
- **主要文件**：
  - `frontend/app/api/db/mint/route.ts` - NFT铸造记录同步
  - `frontend/app/api/ipfs/upload-personal/route.ts` - IPFS自动上传
  - `frontend/app/api/db/user/route.ts` - 用户注册同步
  - `frontend/app/api/db/stats/route.ts` - 统计数据查询
- **注释内容**：
  - API功能概述
  - 参数说明
  - 数据流和处理步骤
  - 错误处理机制

### 技术文档

#### 1. 技术实现文档
**文件**：`技术实现文档.md`

这是最详细的技术说明文档，包含：
- **系统架构概览** - 技术栈和文件结构
- **核心功能实现** - 5大功能的完整实现流程
  - 毕业生注册（单个/批量）
  - 官方NFT发放（防重复机制）
  - 个人NFT铸造（盲盒+保底）
  - NFT展示（动态SVG生成）
  - 管理员查询（数据展示）
- **数据流详解** - 链上链下数据同步机制
- **代码位置索引** - 快速定位功能代码

**适合人群**：
- 新加入的开发者
- 需要理解系统实现原理的人员
- 进行功能扩展和维护的开发者

#### 2. 数据库文档
**文件**：`frontend/DATABASE.md`

包含数据库的：
- 初始化和清理步骤
- 常用管理命令
- 环境配置说明
- 数据一致性检查

### 代码结构说明

```
项目根目录
├── contracts/               # 智能合约（详细注释）
│   └── GraduationNFT.sol   # 主合约（800+行，全中文注释）
│
├── frontend/                # 前端应用
│   ├── app/                 # Next.js页面和API
│   │   ├── mint/           # 铸造页面（详细注释）
│   │   ├── admin/          # 管理员面板（详细注释）
│   │   └── api/            # API路由（详细注释）
│   │
│   ├── components/          # React组件
│   ├── lib/                 # 工具库和配置
│   └── prisma/              # 数据库模型
│
├── 技术实现文档.md          # 详细技术说明
├── README.md                # 项目说明（本文件）
└── frontend/DATABASE.md     # 数据库文档
```

### 学习路径建议

**对于新开发者**：
1. 阅读 `README.md`（本文件）了解项目概况
2. 阅读 `技术实现文档.md` 理解具体实现
3. 查看 `contracts/GraduationNFT.sol` 理解智能合约逻辑
4. 查看前端核心页面（`mint/page.tsx` 和 `admin/page.tsx`）
5. 根据需要查看API路由和数据库操作

**对于维护人员**：
- 使用 `技术实现文档.md` 的"关键代码位置索引"快速定位
- 查看相应文件的详细注释理解业务逻辑
- 参考"数据流详解"理解系统交互

**对于功能扩展**：
- 先理解现有功能的实现方式（查看技术文档）
- 参考类似功能的代码和注释
- 遵循现有的代码风格和注释规范

---

## 📞 联系方式

- 项目地址：[GitHub仓库地址]
- 问题反馈：[GitHub Issues]
- 邮箱：[your-email]

---

## 🎓 致谢

感谢以下开源项目：
- [OpenZeppelin](https://www.openzeppelin.com/)
- [Hardhat](https://hardhat.org/)
- [Next.js](https://nextjs.org/)
- [Wagmi](https://wagmi.sh/)
- [RainbowKit](https://www.rainbowkit.com/)
- [Prisma](https://www.prisma.io/)
- [Pinata](https://www.pinata.cloud/)

---

**🎉 祝江西软件大学 2026届全体毕业生前程似锦！**
