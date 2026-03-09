const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GraduationNFT", function () {
  let graduationNFT;
  let owner;
  let admin;
  let student1;
  let student2;
  let nonStudent;

  const DIPLOMA = 1;
  const MEMORIAL_BADGE = 2;
  const HONOR_CERTIFICATE = 3;

  beforeEach(async function () {
    [owner, admin, student1, student2, nonStudent] = await ethers.getSigners();

    const GraduationNFT = await ethers.getContractFactory("GraduationNFT");
    graduationNFT = await GraduationNFT.deploy(
      "测试大学",
      2024,
      "ipfs://test/"
    );
    await graduationNFT.waitForDeployment();

    // 给admin授予ADMIN_ROLE
    const ADMIN_ROLE = await graduationNFT.ADMIN_ROLE();
    await graduationNFT.grantRole(ADMIN_ROLE, admin.address);
  });

  describe("部署", function () {
    it("应该正确设置学校名称和毕业年份", async function () {
      expect(await graduationNFT.universityName()).to.equal("测试大学");
      expect(await graduationNFT.graduationYear()).to.equal(2024);
    });

    it("应该正确设置合约名称", async function () {
      const name = await graduationNFT.name();
      expect(name).to.include("测试大学");
      expect(name).to.include("2024");
    });

    it("应该设置正确的默认最大供应量", async function () {
      expect(await graduationNFT.maxSupply(DIPLOMA)).to.equal(10000);
      expect(await graduationNFT.maxSupply(MEMORIAL_BADGE)).to.equal(10000);
      expect(await graduationNFT.maxSupply(HONOR_CERTIFICATE)).to.equal(1000);
    });
  });

  describe("毕业生注册", function () {
    it("管理员可以注册毕业生", async function () {
      await graduationNFT.connect(admin).registerGraduate(
        student1.address,
        "2024001",
        "张三",
        "计算机科学",
        "信息学院"
      );

      const info = await graduationNFT.getGraduateInfo(student1.address);
      expect(info.studentId).to.equal("2024001");
      expect(info.studentName).to.equal("张三");
      expect(info.major).to.equal("计算机科学");
      expect(info.hasClaimed).to.equal(false);
    });

    it("非管理员不能注册毕业生", async function () {
      await expect(
        graduationNFT.connect(nonStudent).registerGraduate(
          student1.address,
          "2024001",
          "张三",
          "计算机科学",
          "信息学院"
        )
      ).to.be.reverted;
    });

    it("不能重复注册同一地址", async function () {
      await graduationNFT.connect(admin).registerGraduate(
        student1.address,
        "2024001",
        "张三",
        "计算机科学",
        "信息学院"
      );

      await expect(
        graduationNFT.connect(admin).registerGraduate(
          student1.address,
          "2024002",
          "李四",
          "软件工程",
          "信息学院"
        )
      ).to.be.revertedWith("Already registered");
    });

    it("不能重复使用同一学号", async function () {
      await graduationNFT.connect(admin).registerGraduate(
        student1.address,
        "2024001",
        "张三",
        "计算机科学",
        "信息学院"
      );

      await expect(
        graduationNFT.connect(admin).registerGraduate(
          student2.address,
          "2024001",
          "李四",
          "软件工程",
          "信息学院"
        )
      ).to.be.revertedWith("Student ID already used");
    });
  });

  describe("批量注册", function () {
    it("可以批量注册多个毕业生", async function () {
      await graduationNFT.connect(admin).batchRegisterGraduates(
        [student1.address, student2.address],
        ["2024001", "2024002"],
        ["张三", "李四"],
        ["计算机科学", "软件工程"],
        ["信息学院", "信息学院"]
      );

      expect(await graduationNFT.isRegisteredGraduate(student1.address)).to.equal(true);
      expect(await graduationNFT.isRegisteredGraduate(student2.address)).to.equal(true);
      expect(await graduationNFT.getTotalGraduates()).to.equal(2);
    });
  });

  describe("NFT铸造", function () {
    beforeEach(async function () {
      await graduationNFT.connect(admin).registerGraduate(
        student1.address,
        "2024001",
        "张三",
        "计算机科学",
        "信息学院"
      );
    });

    it("可以为注册的毕业生铸造NFT", async function () {
      await graduationNFT.mintToGraduate(student1.address, DIPLOMA);
      
      expect(await graduationNFT.balanceOf(student1.address, DIPLOMA)).to.equal(1);
    });

    it("铸造后应更新领取状态", async function () {
      await graduationNFT.mintToGraduate(student1.address, DIPLOMA);
      
      const info = await graduationNFT.getGraduateInfo(student1.address);
      expect(info.hasClaimed).to.equal(true);
      expect(info.mintedAt).to.be.gt(0);
    });

    it("不能为未注册的地址铸造", async function () {
      await expect(
        graduationNFT.mintToGraduate(nonStudent.address, DIPLOMA)
      ).to.be.revertedWith("Graduate not registered");
    });
  });

  describe("自行领取", function () {
    beforeEach(async function () {
      await graduationNFT.connect(admin).registerGraduate(
        student1.address,
        "2024001",
        "张三",
        "计算机科学",
        "信息学院"
      );
    });

    it("注册的毕业生可以自行领取NFT", async function () {
      await graduationNFT.connect(student1).claimNFT(DIPLOMA);
      
      expect(await graduationNFT.balanceOf(student1.address, DIPLOMA)).to.equal(1);
    });

    it("不能重复领取同类型NFT", async function () {
      await graduationNFT.connect(student1).claimNFT(DIPLOMA);
      
      await expect(
        graduationNFT.connect(student1).claimNFT(DIPLOMA)
      ).to.be.revertedWith("Already claimed this type");
    });

    it("可以领取不同类型的NFT", async function () {
      await graduationNFT.connect(student1).claimNFT(DIPLOMA);
      await graduationNFT.connect(student1).claimNFT(MEMORIAL_BADGE);
      
      expect(await graduationNFT.balanceOf(student1.address, DIPLOMA)).to.equal(1);
      expect(await graduationNFT.balanceOf(student1.address, MEMORIAL_BADGE)).to.equal(1);
    });

    it("未注册的地址不能领取", async function () {
      await expect(
        graduationNFT.connect(nonStudent).claimNFT(DIPLOMA)
      ).to.be.revertedWith("Not registered as graduate");
    });
  });

  describe("批量铸造", function () {
    beforeEach(async function () {
      await graduationNFT.connect(admin).batchRegisterGraduates(
        [student1.address, student2.address],
        ["2024001", "2024002"],
        ["张三", "李四"],
        ["计算机科学", "软件工程"],
        ["信息学院", "信息学院"]
      );
    });

    it("可以批量铸造给多个毕业生", async function () {
      await graduationNFT.batchMint(
        [student1.address, student2.address],
        DIPLOMA
      );
      
      expect(await graduationNFT.balanceOf(student1.address, DIPLOMA)).to.equal(1);
      expect(await graduationNFT.balanceOf(student2.address, DIPLOMA)).to.equal(1);
    });

    it("批量铸造会跳过未注册的地址", async function () {
      await graduationNFT.batchMint(
        [student1.address, nonStudent.address, student2.address],
        DIPLOMA
      );
      
      expect(await graduationNFT.balanceOf(student1.address, DIPLOMA)).to.equal(1);
      expect(await graduationNFT.balanceOf(nonStudent.address, DIPLOMA)).to.equal(0);
      expect(await graduationNFT.balanceOf(student2.address, DIPLOMA)).to.equal(1);
    });
  });

  describe("URI", function () {
    it("应该返回正确的token URI", async function () {
      const uri = await graduationNFT.uri(DIPLOMA);
      expect(uri).to.equal("ipfs://test/1.json");
    });

    it("应该返回正确的contract URI", async function () {
      const uri = await graduationNFT.contractURI();
      expect(uri).to.equal("ipfs://test/contract.json");
    });

    it("管理员可以设置自定义token URI", async function () {
      await graduationNFT.connect(admin).setTokenURI(DIPLOMA, "ipfs://custom/diploma.json");
      
      const uri = await graduationNFT.uri(DIPLOMA);
      expect(uri).to.equal("ipfs://custom/diploma.json");
    });
  });

  describe("供应量控制", function () {
    it("管理员可以修改最大供应量", async function () {
      await graduationNFT.connect(admin).setMaxSupply(DIPLOMA, 5000);
      
      expect(await graduationNFT.maxSupply(DIPLOMA)).to.equal(5000);
    });

    it("不能将最大供应量设置为低于当前供应量", async function () {
      await graduationNFT.connect(admin).registerGraduate(
        student1.address,
        "2024001",
        "张三",
        "计算机科学",
        "信息学院"
      );
      await graduationNFT.mintToGraduate(student1.address, DIPLOMA);

      await expect(
        graduationNFT.connect(admin).setMaxSupply(DIPLOMA, 0)
      ).to.be.revertedWith("Cannot set below current supply");
    });
  });
});

