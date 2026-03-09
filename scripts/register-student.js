const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const [owner] = await hre.ethers.getSigners();
  
  // 要注册的学生地址
  const studentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log("📝 注册学生账户...");
  console.log(`   学生地址: ${studentAddress}`);
  
  const GraduationNFT = await hre.ethers.getContractFactory("GraduationNFT");
  const contract = GraduationNFT.attach(CONTRACT_ADDRESS);

  // 检查是否已注册
  const isRegistered = await contract.isRegisteredGraduate(studentAddress);
  if (isRegistered) {
    console.log("   ⚠️ 该地址已经注册过了!");
    return;
  }

  // 注册学生
  const tx = await contract.registerGraduate(
    studentAddress,
    "202200004",
    "测试学生",
    "软件工程",
    "软件学院"
  );
  await tx.wait();
  
  console.log("   ✅ 注册成功!");
  console.log(`   学号: 202200004`);
  console.log(`   姓名: 测试学生`);
  console.log(`   专业: 软件工程`);
  console.log(`   学院: 信息学院`);
  console.log("\n🎉 现在可以使用该账户铸造个人纪念NFT了!");
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});

