const hre = require("hardhat");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const [owner, admin, student1, student2, student3] = await hre.ethers.getSigners();
  
  console.log("=".repeat(60));
  console.log("🎓 高校毕业纪念NFT系统 - 交互测试脚本");
  console.log("=".repeat(60));
  console.log("\n📋 测试账户:");
  console.log(`   管理员: ${owner.address}`);
  console.log(`   学生1:  ${student1.address}`);
  console.log(`   学生2:  ${student2.address}`);
  console.log(`   学生3:  ${student3.address}`);

  const GraduationNFT = await hre.ethers.getContractFactory("GraduationNFT");
  const contract = GraduationNFT.attach(CONTRACT_ADDRESS);

  console.log("\n📜 合约信息:");
  console.log(`   合约地址: ${CONTRACT_ADDRESS}`);
  console.log(`   学校名称: ${await contract.universityName()}`);
  console.log(`   毕业年份: ${await contract.graduationYear()}`);

  // 1. 注册毕业生
  console.log("\n" + "=".repeat(60));
  console.log("📝 步骤 1: 注册毕业生");
  console.log("=".repeat(60));

  const students = [
    { address: student1.address, id: "202200001", name: "张三", major: "计算机科学与技术", college: "软件学院" },
    { address: student2.address, id: "202200002", name: "李四", major: "软件工程", college: "软件学院" },
    { address: student3.address, id: "202200003", name: "王五", major: "数据科学与大数据技术", college: "软件学院" },
  ];

  for (const student of students) {
    try {
      const isRegistered = await contract.isRegisteredGraduate(student.address);
      if (!isRegistered) {
        const tx = await contract.registerGraduate(
          student.address, student.id, student.name, student.major, student.college
        );
        await tx.wait();
        console.log(`   ✅ 已注册: ${student.name} (${student.id})`);
      } else {
        console.log(`   ⏭️  已存在: ${student.name} (${student.id})`);
      }
    } catch (error) {
      console.log(`   ❌ 注册失败: ${student.name} - ${error.message}`);
    }
  }

  const totalGraduates = await contract.getTotalGraduates();
  console.log(`\n   📊 已注册毕业生总数: ${totalGraduates}`);

  // 2. 管理员发放官方NFT
  console.log("\n" + "=".repeat(60));
  console.log("🏛️ 步骤 2: 管理员发放官方认证NFT");
  console.log("=".repeat(60));

  const officialNames = { 1: "毕业证书", 2: "纪念徽章", 3: "荣誉证书", 4: "特殊奖项" };

  // 为学生1发放毕业证书和纪念徽章
  for (const tokenId of [1, 2]) {
    try {
      let balance = await contract.balanceOf(student1.address, tokenId);
      if (balance == 0n) {
        const tx = await contract.mintOfficialNFT(student1.address, tokenId);
        await tx.wait();
        console.log(`   ✅ 已为 张三 发放: ${officialNames[tokenId]}`);
      } else {
        console.log(`   ⏭️  张三 已拥有: ${officialNames[tokenId]}`);
      }
    } catch (error) {
      console.log(`   ❌ 发放失败: ${error.message}`);
    }
  }

  // 3. 学生铸造个人纪念NFT
  console.log("\n" + "=".repeat(60));
  console.log("🎨 步骤 3: 学生铸造个人纪念NFT (唯一)");
  console.log("=".repeat(60));

  const rarityNames = ["普通", "稀有", "传说"];

  // 学生2铸造
  try {
    const contractAsStudent2 = contract.connect(student2);
    console.log(`   🎰 李四 正在铸造个人纪念NFT...`);
    const tx = await contractAsStudent2.mintPersonalNFT();
    const receipt = await tx.wait();
    
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
      const mintNumber = Number(parsed.args[4]);
      console.log(`   ✅ 李四 获得: 毕业纪念 #${mintNumber} (${rarityNames[rarity]}) - Token ID: ${tokenId}`);
    }
  } catch (error) {
    console.log(`   ❌ 铸造失败: ${error.message}`);
  }

  // 学生3铸造多次
  for (let i = 0; i < 3; i++) {
    try {
      const contractAsStudent3 = contract.connect(student3);
      console.log(`   🎰 王五 正在铸造第 ${i + 1} 个...`);
      const tx = await contractAsStudent3.mintPersonalNFT();
      const receipt = await tx.wait();
      
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
        const mintNumber = Number(parsed.args[4]);
        console.log(`   ✅ 王五 获得: 毕业纪念 #${mintNumber} (${rarityNames[rarity]}) - Token ID: ${tokenId}`);
      }
    } catch (error) {
      console.log(`   ❌ 铸造失败: ${error.message}`);
    }
  }

  // 4. 查询状态
  console.log("\n" + "=".repeat(60));
  console.log("📊 步骤 4: 查询状态");
  console.log("=".repeat(60));

  const totalPersonal = await contract.totalPersonalMinted();
  console.log(`\n   🎨 已铸造个人NFT总数: ${totalPersonal}`);

  for (const student of students) {
    const info = await contract.getGraduateInfo(student.address);
    const remaining = await contract.getRemainingDailyMints(student.address);
    console.log(`\n   👤 ${student.name}:`);
    console.log(`      个人铸造次数: ${info[6]}`);
    console.log(`      保底计数: ${info[7]}/20`);
    console.log(`      今日剩余: ${remaining}/5`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ 交互测试完成!");
  console.log("=".repeat(60));
  console.log("\n💡 提示:");
  console.log("   - 前端访问: http://localhost:3000");
  console.log("   - 铸造页面: http://localhost:3000/mint");
  console.log("   - 管理员私钥: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("   - 学生私钥(李四): 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a\n");
}

main().then(() => process.exit(0)).catch((error) => { console.error(error); process.exit(1); });
