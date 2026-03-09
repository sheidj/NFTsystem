const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const studentAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log("🔍 检查账户状态...");
  console.log(`   地址: ${studentAddress}\n`);
  
  const GraduationNFT = await hre.ethers.getContractFactory("GraduationNFT");
  const contract = GraduationNFT.attach(CONTRACT_ADDRESS);

  // 检查是否已注册
  const isRegistered = await contract.isRegisteredGraduate(studentAddress);
  console.log(`   ✅ 已注册毕业生: ${isRegistered}`);

  // 获取毕业生信息
  const info = await contract.getGraduateInfo(studentAddress);
  console.log(`   📋 学号: ${info[0]}`);
  console.log(`   📋 姓名: ${info[1]}`);
  console.log(`   📋 专业: ${info[2]}`);
  console.log(`   📋 学院: ${info[3]}`);
  console.log(`   📋 自铸造次数: ${info[6]}`);

  // 检查冷却时间
  const cooldown = await contract.getNextMintTime(studentAddress);
  console.log(`\n   ⏱️ 冷却剩余秒数: ${cooldown}`);
  if (cooldown > 0n) {
    console.log(`   ⚠️ 需要等待 ${Number(cooldown) / 60} 分钟后才能铸造`);
  } else {
    console.log(`   ✅ 冷却已结束，可以铸造`);
  }

  // 检查每日剩余次数
  const remaining = await contract.getRemainingDailyMints(studentAddress);
  console.log(`\n   📊 今日剩余铸造次数: ${remaining}/3`);
  if (remaining == 0n) {
    console.log(`   ⚠️ 今日次数已用完，明天再来`);
  }

  // 检查个人NFT持有情况
  console.log(`\n   🎨 个人纪念NFT持有:`);
  for (let i = 101; i <= 104; i++) {
    const balance = await contract.balanceOf(studentAddress, i);
    if (balance > 0n) {
      console.log(`      Token ${i}: ${balance}`);
    }
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});

