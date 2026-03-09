const hre = require("hardhat");

async function main() {
  console.log("开始部署 GraduationNFT 合约...\n");

  // 部署参数
  const universityName = "江西软件大学"; // 修改为你的学校名称
  
  // IPFS baseURI - 运行 upload-to-ipfs.js 后替换为实际的 CID
  // 查看 metadata/ipfs-upload-results.json 获取正确的 CID
  const baseURI = process.env.IPFS_BASE_URI || "ipfs://YOUR_IPFS_CID/";
  
  console.log("部署配置:");
  console.log("- 学校名称:", universityName);
  console.log("- Base URI:", baseURI);
  
  if (baseURI === "ipfs://YOUR_IPFS_CID/") {
    console.log("\n⚠️  警告: 尚未配置 IPFS baseURI");
    console.log("建议先运行: node scripts/upload-to-ipfs.js");
    console.log("然后更新 .env 文件中的 IPFS_BASE_URI\n");
  }

  // 获取部署者信息
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(balance), "ETH\n");

  // 部署合约
  const GraduationNFT = await hre.ethers.getContractFactory("GraduationNFT");
  const graduationNFT = await GraduationNFT.deploy(
    universityName,
    baseURI
  );

  await graduationNFT.waitForDeployment();
  const contractAddress = await graduationNFT.getAddress();

  console.log("✅ GraduationNFT 部署成功!");
  console.log("合约地址:", contractAddress);
  console.log("学校名称:", universityName);
  console.log("Base URI:", baseURI);
  console.log("\n" + "=".repeat(60));
  console.log("📋 下一步操作：");
  console.log("\n1. 将合约地址添加到前端 .env 文件:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n2. 重启前端服务器:");
  console.log("   cd frontend && npm run dev");
  console.log("\n3. 在 OpenSea 测试网查看你的 NFT:");
  if (hre.network.name === "sepolia") {
    console.log(`   https://testnets.opensea.io/assets/sepolia/${contractAddress}/1`);
  } else if (hre.network.name === "amoy") {
    console.log(`   https://testnets.opensea.io/assets/amoy/${contractAddress}/1`);
  }
  console.log("\n4. 验证 NFT 元数据显示是否正确");
  console.log("=".repeat(60) + "\n");

  // 如果不是本地网络，等待区块确认后验证合约
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("等待区块确认...");
    await graduationNFT.deploymentTransaction().wait(5);
    
    console.log("验证合约...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [universityName, baseURI],
      });
      console.log("✅ 合约验证成功!");
    } catch (error) {
      console.log("合约验证失败:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

