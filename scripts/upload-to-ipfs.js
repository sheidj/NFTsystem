/**
 * IPFS 上传脚本 - 使用 Pinata 服务
 * 
 * 功能：
 * 1. 上传 NFT 图片到 IPFS
 * 2. 上传元数据 JSON 到 IPFS
 * 3. 生成可用于合约的 baseURI
 * 
 * 使用方法：
 * node scripts/upload-to-ipfs.js
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Pinata 配置
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

// 验证环境变量
if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
  console.error('❌ 错误：请在 .env 文件中配置 Pinata 密钥');
  console.log('\n请访问 https://app.pinata.cloud 注册并获取 API 密钥');
  console.log('然后在 .env 文件中添加：');
  console.log('PINATA_JWT=your_jwt_token');
  console.log('或者：');
  console.log('PINATA_API_KEY=your_api_key');
  console.log('PINATA_SECRET_KEY=your_secret_key\n');
  process.exit(1);
}

// Pinata API 端点
const PINATA_PIN_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_PIN_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/**
 * 获取 Pinata 请求头
 */
function getPinataHeaders() {
  if (PINATA_JWT) {
    return {
      'Authorization': `Bearer ${PINATA_JWT}`
    };
  } else {
    return {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY
    };
  }
}

/**
 * 上传文件到 IPFS
 */
async function uploadFileToIPFS(filePath, fileName) {
  try {
    const data = new FormData();
    data.append('file', fs.createReadStream(filePath));
    
    const metadata = JSON.stringify({
      name: fileName,
    });
    data.append('pinataMetadata', metadata);

    const headers = {
      ...getPinataHeaders(),
      ...data.getHeaders()
    };

    const response = await axios.post(PINATA_PIN_FILE_URL, data, {
      maxBodyLength: Infinity,
      headers: headers
    });

    return response.data.IpfsHash;
  } catch (error) {
    console.error(`上传文件失败 ${fileName}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * 上传 JSON 到 IPFS
 */
async function uploadJSONToIPFS(jsonData, name) {
  try {
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
      headers: headers
    });

    return response.data.IpfsHash;
  } catch (error) {
    console.error(`上传 JSON 失败 ${name}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * 上传所有图片
 */
async function uploadImages() {
  console.log('📤 开始上传图片到 IPFS...\n');
  
  const imagesDir = path.join(__dirname, '../metadata/images');
  const imageFiles = {
    '1': 'diploma.svg',
    '2': 'badge.svg',
    '3': 'honor.svg',
    '4': 'special.svg'
  };

  const imageCIDs = {};

  for (const [tokenId, fileName] of Object.entries(imageFiles)) {
    const filePath = path.join(imagesDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  跳过 ${fileName}（文件不存在）`);
      continue;
    }

    process.stdout.write(`  上传 ${fileName}...`);
    const cid = await uploadFileToIPFS(filePath, fileName);
    imageCIDs[tokenId] = cid;
    console.log(` ✅ ${cid}`);
    
    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ 所有图片上传完成！');
  return imageCIDs;
}

/**
 * 更新并上传元数据
 */
async function uploadMetadata(imageCIDs) {
  console.log('\n📤 开始上传元数据到 IPFS...\n');
  
  const metadataDir = path.join(__dirname, '../metadata');
  const metadataFiles = ['1.json', '2.json', '3.json', '4.json'];

  const metadataCIDs = {};

  for (const fileName of metadataFiles) {
    const tokenId = fileName.replace('.json', '');
    const filePath = path.join(metadataDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  跳过 ${fileName}（文件不存在）`);
      continue;
    }

    // 读取元数据
    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // 更新图片 URI
    if (imageCIDs[tokenId]) {
      metadata.image = `ipfs://${imageCIDs[tokenId]}`;
    }

    process.stdout.write(`  上传 ${fileName}...`);
    const cid = await uploadJSONToIPFS(metadata, `metadata-${tokenId}.json`);
    metadataCIDs[tokenId] = cid;
    console.log(` ✅ ${cid}`);
    
    // 保存更新后的元数据到本地
    fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
    
    // 避免 API 限流
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✅ 所有元数据上传完成！');
  return metadataCIDs;
}

/**
 * 创建并上传合约元数据集合
 */
async function uploadCollection(imageCIDs) {
  console.log('\n📤 创建合约元数据集合...\n');
  
  const collectionMetadata = {
    name: "高校毕业纪念 NFT",
    description: "基于 ERC-1155 协议的高校毕业纪念 NFT 系统。将毕业记忆永久保存在区块链上，包含毕业证书、纪念徽章、荣誉证书和特殊奖项等多种类型的数字收藏品。",
    image: imageCIDs['1'] ? `ipfs://${imageCIDs['1']}` : "",
    external_link: "https://your-university.edu/graduation",
    seller_fee_basis_points: 0,
    fee_recipient: ""
  };

  process.stdout.write('  上传合约元数据...');
  const cid = await uploadJSONToIPFS(collectionMetadata, 'contract-metadata.json');
  console.log(` ✅ ${cid}`);
  
  return cid;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 IPFS 上传工具 - Pinata 版本\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. 上传图片
    const imageCIDs = await uploadImages();
    
    // 2. 上传元数据
    const metadataCIDs = await uploadMetadata(imageCIDs);
    
    // 3. 上传合约元数据
    const contractCID = await uploadCollection(imageCIDs);
    
    // 4. 显示结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 上传结果汇总\n');
    
    console.log('🖼️  图片 CID：');
    Object.entries(imageCIDs).forEach(([tokenId, cid]) => {
      const names = { '1': '毕业证书', '2': '纪念徽章', '3': '荣誉证书', '4': '特殊奖项' };
      console.log(`  Token ${tokenId} (${names[tokenId]}): ${cid}`);
    });
    
    console.log('\n📄 元数据 CID：');
    Object.entries(metadataCIDs).forEach(([tokenId, cid]) => {
      console.log(`  Token ${tokenId}: ${cid}`);
    });
    
    console.log(`\n📦 合约元数据 CID: ${contractCID}`);
    
    // 5. 生成配置信息
    console.log('\n' + '='.repeat(60));
    console.log('📋 下一步操作：\n');
    console.log('1. 将以下 baseURI 添加到部署脚本中：');
    console.log(`   const baseURI = "ipfs://${contractCID}/";`);
    console.log('\n2. 或者在合约部署后调用 setTokenURI 设置每个 Token 的 URI：');
    Object.entries(metadataCIDs).forEach(([tokenId, cid]) => {
      console.log(`   tokenId ${tokenId}: ipfs://${cid}`);
    });
    
    console.log('\n3. 在浏览器中查看（使用 IPFS 网关）：');
    console.log(`   https://gateway.pinata.cloud/ipfs/${contractCID}`);
    console.log(`   或 https://ipfs.io/ipfs/${contractCID}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ 所有操作完成！你的 NFT 元数据已永久存储在 IPFS 上！\n');
    
    // 保存结果到文件
    const results = {
      timestamp: new Date().toISOString(),
      contractCID,
      imageCIDs,
      metadataCIDs,
      baseURI: `ipfs://${contractCID}/`,
      gateway: `https://gateway.pinata.cloud/ipfs/${contractCID}`
    };
    
    fs.writeFileSync(
      path.join(__dirname, '../metadata/ipfs-upload-results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('💾 上传结果已保存到 metadata/ipfs-upload-results.json\n');
    
  } catch (error) {
    console.error('\n❌ 上传过程中出错：', error.message);
    process.exit(1);
  }
}

// 运行主函数
main();

