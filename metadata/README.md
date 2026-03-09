# 📦 NFT 元数据文件夹

## 📁 文件结构

```
metadata/
├── images/                    # NFT 图片资源（SVG 格式）
│   ├── diploma.svg           # Token 1 - 毕业证书
│   ├── badge.svg             # Token 2 - 纪念徽章
│   ├── honor.svg             # Token 3 - 荣誉证书
│   └── special.svg           # Token 4 - 特殊奖项
│
├── 1.json                    # Token 1 元数据（官方毕业证书）
├── 2.json                    # Token 2 元数据（纪念徽章）
├── 3.json                    # Token 3 元数据（荣誉证书）
├── 4.json                    # Token 4 元数据（特殊奖项）
├── contract.json             # 合约集合元数据（OpenSea 集合信息）
│
├── ipfs-upload-results.json  # IPFS 上传结果（运行上传脚本后生成）
├── IPFS_SETUP.md            # IPFS 详细配置文档
└── README.md                # 本文件
```

---

## 🎨 图片资源说明

所有图片均为 **SVG 格式**，优点：
- ✅ 矢量图形，无限放大不失真
- ✅ 文件小，上传 IPFS 成本低
- ✅ 可在浏览器直接显示
- ✅ 支持动画和交互（未来可扩展）

**图片尺寸：** 500x500 像素（推荐）

**设计风格：**
- 渐变背景，现代化设计
- 使用 Emoji 作为主图标
- 符合 Web3 美学

---

## 📄 元数据格式

遵循 **OpenSea 元数据标准**（ERC-1155）：

```json
{
  "name": "NFT 名称",
  "description": "NFT 描述",
  "image": "ipfs://QmXXX/image.svg",
  "external_url": "https://your-website.com",
  "attributes": [
    {
      "trait_type": "属性名称",
      "value": "属性值"
    }
  ]
}
```

**字段说明：**
- `name`：NFT 名称，显示在 OpenSea 标题
- `description`：详细描述
- `image`：图片 IPFS URI（`ipfs://CID`）
- `external_url`：点击 NFT 时跳转的链接
- `attributes`：属性数组，显示在 OpenSea 的 Properties 区域

---

## 🎯 NFT 类型说明

### Token ID 1 - 毕业证书 📜

**用途：** 官方数字毕业证书  
**发放：** 管理员批量发放给所有毕业生  
**供应量：** 10,000（默认）  
**稀有度：** 普通  
**图片：** diploma.svg - 蓝色渐变，证书样式  

---

### Token ID 2 - 纪念徽章 🏅

**用途：** 毕业纪念徽章  
**发放：** 管理员发放  
**供应量：** 10,000（默认）  
**稀有度：** 普通  
**图片：** badge.svg - 绿色渐变，徽章样式  

---

### Token ID 3 - 荣誉证书 🏆

**用途：** 优秀毕业生荣誉证书  
**发放：** 管理员选择性发放  
**供应量：** 1,000（限量）  
**稀有度：** 稀有  
**图片：** honor.svg - 紫色渐变，奖杯元素  

---

### Token ID 4 - 特殊奖项 ⭐

**用途：** 杰出贡献者特殊奖项  
**发放：** 管理员发放给特殊贡献者  
**供应量：** 100（极度限量）  
**稀有度：** 传说  
**图片：** special.svg - 金色渐变，星星元素  

---

### Token ID 10001+ - 个人纪念 NFT 🎨

**用途：** 学生自己铸造的个人纪念品  
**发放：** 学生自行铸造（每日限制 5 次）  
**供应量：** 无限（每个唯一）  
**稀有度：** 随机（普通 70%、稀有 25%、传说 5%）  
**图片：** 前端 API 动态生成（SVG）  

**元数据 API：** `https://your-domain.com/api/metadata/[tokenId]`  
**图片 API：** `https://your-domain.com/api/image/[tokenId]`

---

## 🚀 使用流程

### 1. 准备阶段（开发时）

创建 NFT 图片和元数据文件（已完成✅）

### 2. 上传到 IPFS

```bash
npm run ipfs:upload
```

这会：
1. 上传所有图片到 IPFS
2. 更新元数据中的图片链接
3. 上传所有元数据到 IPFS
4. 生成 `ipfs-upload-results.json`

### 3. 配置合约

将上传结果中的 `baseURI` 添加到 `.env`：

```env
IPFS_BASE_URI="ipfs://QmYourCID/"
```

### 4. 部署合约

```bash
npm run deploy:sepolia
# 或
npm run deploy:amoy
```

### 5. 验证

在 OpenSea 测试网查看你的 NFT：
- Sepolia: `https://testnets.opensea.io/assets/sepolia/合约地址/1`
- Amoy: `https://testnets.opensea.io/assets/amoy/合约地址/1`

---

## 📝 自定义元数据

### 修改现有元数据

1. 编辑 `1.json`、`2.json`、`3.json`、`4.json`
2. 重新运行 `npm run ipfs:upload`
3. 获取新的 CID
4. 更新合约的 URI（如果已部署）

### 修改图片

1. 编辑 `images/*.svg` 文件
2. 重新运行 `npm run ipfs:upload`
3. 获取新的 CID

### 添加新属性

在元数据 JSON 的 `attributes` 数组中添加：

```json
{
  "trait_type": "学院",
  "value": "信息学院"
}
```

**常用属性类型：**
- `trait_type`: 普通属性
- `display_type: "number"`: 数字属性（可显示进度条）
- `display_type: "date"`: 日期属性（Unix 时间戳）
- `display_type: "boost_number"`: 加成属性（游戏用）
- `display_type: "boost_percentage"`: 百分比加成

---

## 🔍 验证元数据

### 检查 JSON 格式

```bash
# 验证 JSON 语法
node -e "console.log(JSON.parse(require('fs').readFileSync('metadata/1.json')))"
```

### 在线验证工具

- [JSONLint](https://jsonlint.com/) - 验证 JSON 格式
- [OpenSea Metadata Validator](https://testnets.opensea.io/get-listed) - 验证元数据标准

---

## 📚 参考资源

- [OpenSea 元数据标准](https://docs.opensea.io/docs/metadata-standards)
- [ERC-1155 元数据 URI](https://eips.ethereum.org/EIPS/eip-1155#metadata)
- [IPFS 文档](https://docs.ipfs.tech/)
- [Pinata 文档](https://docs.pinata.cloud/)

---

## 💡 最佳实践

1. **上传前验证** - 确保所有 JSON 格式正确
2. **测试图片** - 在浏览器中打开 SVG 文件预览
3. **保存 CID** - 备份 `ipfs-upload-results.json`
4. **使用网关** - 测试时使用 Pinata 网关访问内容
5. **版本控制** - 提交元数据文件到 Git（可选）

---

需要帮助？查看 [IPFS_SETUP.md](IPFS_SETUP.md) 获取详细说明！

