const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const [owner, student] = await hre.ethers.getSigners();
  
  console.log("🎰 测试学生铸造个人纪念NFT...");
  console.log(`   学生地址: ${student.address}\n`);
  
  const GraduationNFT = await hre.ethers.getContractFactory("GraduationNFT");
  const contract = GraduationNFT.attach(CONTRACT_ADDRESS);

  // 使用学生账户连接合约
  const contractAsStudent = contract.connect(student);

  try {
    console.log("   📤 发送铸造交易...");
    const tx = await contractAsStudent.mintPersonalNFT({
      gasLimit: 500000  // 手动设置较高的 gas limit
    });
    console.log(`   ⏳ 等待确认... (tx: ${tx.hash})`);
    
    const receipt = await tx.wait();
    console.log(`   ✅ 铸造成功! Block: ${receipt.blockNumber}`);

    // 查找事件
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'PersonalNFTMinted';
      } catch { return false; }
    });
    
    if (event) {
      const parsed = contract.interface.parseLog(event);
      const tokenId = Number(parsed.args[1]);
      const rarity = Number(parsed.args[2]);
      const names = { 101: "校园回忆", 102: "青春印记", 103: "金色时光", 104: "璀璨纪念" };
      const rarities = ["普通", "稀有", "传说"];
      console.log(`\n   🎉 获得: ${names[tokenId]} (${rarities[rarity]})`);
    }
  } catch (error) {
    console.log(`\n   ❌ 铸造失败: ${error.message}`);
    if (error.reason) console.log(`   原因: ${error.reason}`);
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});

