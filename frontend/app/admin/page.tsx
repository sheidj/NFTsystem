'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useWalletClient } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BatchProgress } from '@/components/BatchProgress';
import { contractABI, contractAddress } from '@/lib/contract';
import { colleges, majorsByCollege } from '@/lib/universityData';
import { useToast } from '@/components/Toast';

// 管理员地址（部署合约的账户）
const ADMIN_ADDRESS = '0x3B0CeAf6021C9201CFbE76421738359b71cE2C00';

// 官方NFT类型
const OFFICIAL_NFTS = [
  { id: 1, name: '📜 毕业证书', description: '官方数字毕业证书' },
  { id: 2, name: '🏅 纪念徽章', description: '毕业纪念徽章' },
  { id: 3, name: '🏆 荣誉证书', description: '优秀毕业生荣誉证书（稀有）' },
  { id: 4, name: '⭐ 特殊奖项', description: '杰出贡献者特殊奖项（传说）' },
];

// 批量学生数据类型
interface StudentData {
  address: string;
  studentId: string;
  studentName: string;
  major: string;
  college: string;
  isValid: boolean;
  error?: string;
}

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'register' | 'batch-register' | 'mint' | 'batch-mint' | 'stats'>('register');
  
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  
  // 单个注册表单状态
  const [graduateAddress, setGraduateAddress] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  
  // 批量注册状态
  const [batchInput, setBatchInput] = useState('');
  const [parsedStudents, setParsedStudents] = useState<StudentData[]>([]);
  const [batchRegistering, setBatchRegistering] = useState(false);
  const [batchRegisterProgress, setBatchRegisterProgress] = useState({ current: 0, total: 0 });
  const [batchRegisterResults, setBatchRegisterResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  // 单个注册状态
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // 单个铸造状态
  const [mintAddress, setMintAddress] = useState('');
  const [mintTokenId, setMintTokenId] = useState('1');
  const [mintSuccess, setMintSuccess] = useState<{ tokenId: number; name: string } | null>(null);
  const [mintError, setMintError] = useState<string | null>(null);

  // 批量发放状态
  const [registeredStudents, setRegisteredStudents] = useState<Array<{ address: string; name: string; studentId: string }>>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [batchMintTokenId, setBatchMintTokenId] = useState('1');
  const [batchMinting, setBatchMinting] = useState(false);
  const [batchMintProgress, setBatchMintProgress] = useState({ current: 0, total: 0 });
  const [batchMintResults, setBatchMintResults] = useState<{ success: number; failed: number; skipped: number }>({ success: 0, failed: 0, skipped: 0 });
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 查询地址状态
  const [queryAddress, setQueryAddress] = useState('');

  useEffect(() => {
    setSelectedMajor('');
  }, [selectedCollege]);

  const currentMajors = selectedCollege ? majorsByCollege[selectedCollege] || [] : [];

  // 读取数据
  const { data: totalGraduates, refetch: refetchTotal } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getTotalGraduates',
  });

  const { data: universityName } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'universityName',
  });

  const { data: queryGraduateInfo, refetch: refetchGraduateInfo } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getGraduateInfo',
    args: queryAddress ? [queryAddress as `0x${string}`] : undefined,
  });

  // 查询该地址拥有的官方NFT余额
  const { data: queryBalance1, refetch: refetchQueryBalance1 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: queryAddress ? [queryAddress as `0x${string}`, BigInt(1)] : undefined,
  });
  const { data: queryBalance2, refetch: refetchQueryBalance2 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: queryAddress ? [queryAddress as `0x${string}`, BigInt(2)] : undefined,
  });
  const { data: queryBalance3, refetch: refetchQueryBalance3 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: queryAddress ? [queryAddress as `0x${string}`, BigInt(3)] : undefined,
  });
  const { data: queryBalance4, refetch: refetchQueryBalance4 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: queryAddress ? [queryAddress as `0x${string}`, BigInt(4)] : undefined,
  });

  const queryOfficialNFTs = {
    1: Number(queryBalance1 || 0),
    2: Number(queryBalance2 || 0),
    3: Number(queryBalance3 || 0),
    4: Number(queryBalance4 || 0),
  };

  const { data: isMintAddressRegistered } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'isRegisteredGraduate',
    args: mintAddress ? [mintAddress as `0x${string}`] : undefined,
  });

  // 读取铸造地址的NFT余额
  const { data: mintAddressBalance1, refetch: refetchBalance1 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: mintAddress ? [mintAddress as `0x${string}`, BigInt(1)] : undefined,
  });
  const { data: mintAddressBalance2, refetch: refetchBalance2 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: mintAddress ? [mintAddress as `0x${string}`, BigInt(2)] : undefined,
  });
  const { data: mintAddressBalance3, refetch: refetchBalance3 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: mintAddress ? [mintAddress as `0x${string}`, BigInt(3)] : undefined,
  });
  const { data: mintAddressBalance4, refetch: refetchBalance4 } = useReadContract({
    address: contractAddress, abi: contractABI, functionName: 'balanceOf',
    args: mintAddress ? [mintAddress as `0x${string}`, BigInt(4)] : undefined,
  });

  const mintAddressBalances: Record<number, number> = {
    1: Number(mintAddressBalance1 || 0),
    2: Number(mintAddressBalance2 || 0),
    3: Number(mintAddressBalance3 || 0),
    4: Number(mintAddressBalance4 || 0),
  };

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && hash && publicClient) {
      refetchTotal();
      refetchBalance1();
      refetchBalance2();
      refetchBalance3();
      refetchBalance4();
      
      if (activeTab === 'mint' && mintTokenId) {
        const nft = OFFICIAL_NFTS.find(n => n.id === parseInt(mintTokenId));
        setMintSuccess({ tokenId: parseInt(mintTokenId), name: nft?.name || 'NFT' });
      }
      
      setTimeout(() => {
        reset();
        setMintSuccess(null);
        setMintError(null);
      }, 5000);

      // 同步官方 NFT 铸造到数据库 (单个)
      if (activeTab === 'mint' && mintTokenId && mintAddress && isSuccess) {
        // 获取交易区块时间
        publicClient.getTransactionReceipt({ hash }).then((receipt: any) => {
          return publicClient.getBlock({ blockHash: receipt.blockHash });
        }).then((block: any) => {
          const mintTime = Number(block.timestamp); // 链上时间戳（秒）
          return fetch('/api/db/mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: mintAddress,
              tokenId: parseInt(mintTokenId),
              type: 'official',
              rarity: mintTokenId === '3' ? 1 : mintTokenId === '4' ? 2 : 0, // 简单的稀有度映射
              mintTime: mintTime, // 链上时间戳
              txHash: hash,
            }),
          });
        }).catch(console.error);
      }
    }
  }, [isSuccess, refetchTotal, reset, activeTab, mintTokenId, refetchBalance1, refetchBalance2, refetchBalance3, refetchBalance4, hash, publicClient, mintAddress]);

  // 解析批量输入
  const parseBatchInput = (input: string) => {
    const lines = input.trim().split('\n').filter(line => line.trim());
    const students: StudentData[] = [];
    
    for (const line of lines) {
      const parts = line.split(/[,\t]/).map(p => p.trim());
      
      if (parts.length < 3) {
        students.push({
          address: parts[0] || '',
          studentId: parts[1] || '',
          studentName: parts[2] || '',
          major: parts[3] || '',
          college: parts[4] || '',
          isValid: false,
          error: '格式错误：至少需要地址、学号、姓名',
        });
        continue;
      }

      const [addr, sid, sname, major = '', college = ''] = parts;
      
      // 验证地址格式
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(addr);
      
      students.push({
        address: addr,
        studentId: sid,
        studentName: sname,
        major,
        college,
        isValid: isValidAddress && sid.length > 0 && sname.length > 0,
        error: !isValidAddress ? '无效的钱包地址' : undefined,
      });
    }
    
    setParsedStudents(students);
  };

  // 批量注册
  const handleBatchRegister = async () => {
    const validStudents = parsedStudents.filter(s => s.isValid);
    if (validStudents.length === 0 || !publicClient || !walletClient) return;

    setBatchRegistering(true);
    setBatchRegisterProgress({ current: 0, total: validStudents.length });
    setBatchRegisterResults({ success: 0, failed: 0 });

    let success = 0;
    let failed = 0;

    for (let i = 0; i < validStudents.length; i++) {
      const student = validStudents[i];
      setBatchRegisterProgress({ current: i + 1, total: validStudents.length });

      try {
        // 检查地址是否已注册
        const isRegistered = await publicClient.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'isRegisteredGraduate',
          args: [student.address as `0x${string}`],
        });

        if (isRegistered) {
          console.log(`跳过: ${student.studentName} - 地址已注册`);
          failed++;
          continue;
        }

        // 检查学号是否已被使用
        const existingAddress = await publicClient.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'studentIdToAddress',
          args: [student.studentId],
        });

        if (existingAddress && existingAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`跳过: ${student.studentName} - 学号 ${student.studentId} 已被使用`);
          failed++;
          continue;
        }

          // 注册 - 使用 walletClient
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'registerGraduate',
          args: [
            student.address as `0x${string}`,
            student.studentId,
            student.studentName,
            student.major,
            student.college,
          ],
        });

        // 等待确认
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        
        if (receipt.status === 'success') {
          // 同步到数据库
          await fetch('/api/db/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: student.address,
              studentId: student.studentId,
              name: student.studentName,
              college: student.college,
              major: student.major,
              isRegistered: true,
            }),
          });
          success++;
        } else {
          console.error(`注册失败: ${student.studentName} - 交易回滚`);
          failed++;
        }
      } catch (error) {
        console.error(`注册失败: ${student.studentName}`, error);
        failed++;
      }
    }

    setBatchRegisterResults({ success, failed });
    setBatchRegistering(false);
    refetchTotal();
  };

  // 加载已注册学生列表
  const loadRegisteredStudents = async () => {
    if (!publicClient) return;
    setLoadingStudents(true);

    try {
      const total = Number(totalGraduates || 0);
      const students: typeof registeredStudents = [];

      // 这里简化处理，实际应该有一个获取所有学生地址的方法
      // 暂时通过查询合约事件来获取
      // 这里我们使用一个示例方法
      
      setRegisteredStudents(students);
    } catch (error) {
      console.error('加载学生列表失败:', error);
    }

    setLoadingStudents(false);
  };

  // 批量发放
  const handleBatchMint = async () => {
    if (selectedStudents.length === 0 || !publicClient || !walletClient) return;

    setBatchMinting(true);
    setBatchMintProgress({ current: 0, total: selectedStudents.length });
    setBatchMintResults({ success: 0, failed: 0, skipped: 0 });

    let success = 0;
    let failed = 0;
    let skipped = 0;
    const tokenId = parseInt(batchMintTokenId);

    for (let i = 0; i < selectedStudents.length; i++) {
      const studentAddr = selectedStudents[i];
      setBatchMintProgress({ current: i + 1, total: selectedStudents.length });

      try {
        // 检查是否已拥有
        const balance = await publicClient.readContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'balanceOf',
          args: [studentAddr as `0x${string}`, BigInt(tokenId)],
        });

        if (Number(balance) > 0) {
          skipped++;
          continue;
        }

        // 发放 - 使用 walletClient
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: contractABI,
          functionName: 'mintOfficialNFT',
          args: [studentAddr as `0x${string}`, BigInt(tokenId)],
        });

        // 同步到数据库
        await fetch('/api/db/mint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: studentAddr,
            tokenId: tokenId,
            type: 'official',
            rarity: tokenId === 3 ? 1 : tokenId === 4 ? 2 : 0,
            txHash: hash,
          }),
        });

        await publicClient.waitForTransactionReceipt({ hash });
        success++;
      } catch (error) {
        console.error(`发放失败: ${studentAddr}`, error);
        failed++;
      }
    }

    setBatchMintResults({ success, failed, skipped });
    setBatchMinting(false);
    setSelectedStudents([]);
  };

  // 使用 wagmi hook 处理注册交易
  const { 
    writeContract: writeRegister, 
    data: registerHash, 
    isPending: isRegisterPending,
    reset: resetRegister 
  } = useWriteContract();
  
  const { 
    isLoading: isRegisterConfirming, 
    isSuccess: isRegisterSuccess 
  } = useWaitForTransactionReceipt({ hash: registerHash });

  // 监听注册交易成功
  useEffect(() => {
    if (isRegisterSuccess && registerHash) {
      setIsRegistering(false);
      setRegisterSuccess(true);
      refetchTotal();
      
      showToast({
        type: 'success',
        title: '注册成功',
        message: `学生 ${studentName} (${studentId}) 已成功注册`,
      });

      // 同步到数据库
      const collegeName = colleges.find(c => c.id === selectedCollege)?.name || '';
      const majorName = currentMajors.find(m => m.id === selectedMajor)?.name || '';
      fetch('/api/db/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: graduateAddress,
          studentId: studentId,
          name: studentName,
          college: collegeName,
          major: majorName,
          isRegistered: true,
        }),
      }).catch(console.error);

      // 3秒后清除成功状态
      setTimeout(() => {
        setRegisterSuccess(false);
        resetRegister();
      }, 3000);
    }
  }, [isRegisterSuccess, registerHash, studentName, studentId, graduateAddress, selectedCollege, selectedMajor, refetchTotal, showToast, resetRegister]);

  // 单个注册
  const handleRegister = async () => {
    if (!graduateAddress || !studentId || !studentName) {
      showToast({
        type: 'warning',
        title: '信息不完整',
        message: '请填写必要信息（钱包地址、学号、姓名）',
      });
      return;
    }

    const collegeName = colleges.find(c => c.id === selectedCollege)?.name || '';
    const majorName = currentMajors.find(m => m.id === selectedMajor)?.name || '';

    setIsRegistering(true);
    setRegisterSuccess(false);

    try {
      writeRegister({
        address: contractAddress,
        abi: contractABI,
        functionName: 'registerGraduate',
        args: [graduateAddress as `0x${string}`, studentId, studentName, majorName, collegeName],
      });
    } catch (error) {
      console.error('注册失败:', error);
      setIsRegistering(false);
      showToast({
        type: 'error',
        title: '注册失败',
        message: '区块链交易发送失败，请检查网络连接',
      });
    }
  };

  // 单个发放
  const handleMint = async () => {
    setMintError(null);
    setMintSuccess(null);

    if (!mintAddress) {
      setMintError('请输入接收地址');
      return;
    }

    if (!isMintAddressRegistered) {
      setMintError('该地址尚未注册为毕业生，请先注册');
      return;
    }

    const tokenId = parseInt(mintTokenId);
    if (mintAddressBalances[tokenId] > 0) {
      const nft = OFFICIAL_NFTS.find(n => n.id === tokenId);
      setMintError(`该学生已拥有「${nft?.name}」，不能重复发放`);
      return;
    }

    writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'mintOfficialNFT',
      args: [mintAddress as `0x${string}`, BigInt(tokenId)],
    });
  };

  const tabs = [
    { id: 'register', label: '单个注册', icon: '📝' },
    { id: 'batch-register', label: '批量注册', icon: '📋' },
    { id: 'mint', label: '单个发放', icon: '🎁' },
    { id: 'batch-mint', label: '批量发放', icon: '📦' },
    { id: 'stats', label: '查询统计', icon: '📊' },
  ];

  // 非管理员提示
  if (isConnected && !isAdmin) {
    return (
      <div className="min-h-screen celebration-bg">
        <Header />
        <main className="pt-24 pb-20 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="card-colorful p-12 text-center">
              <div className="text-7xl mb-6">🔒</div>
              <h2 className="text-2xl font-bold mb-4 text-light-800">无访问权限</h2>
              <p className="text-light-500 mb-6">此页面仅限管理员访问。</p>
              <div className="bg-light-100 rounded-2xl p-4 text-left space-y-2 border-2 border-light-200">
                <div className="text-sm text-light-500 font-medium">当前账户:</div>
                <div className="font-mono text-sm break-all text-light-700">{address}</div>
                <div className="text-sm text-light-500 mt-4 font-medium">管理员账户:</div>
                <div className="font-mono text-sm break-all text-light-700">{ADMIN_ADDRESS}</div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen celebration-bg">
      <Header />
      
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 border-2 border-primary-300 text-primary-700 font-bold mb-3 sm:mb-4 shadow-sm text-sm sm:text-base">
              <span>👑</span> 管理员模式
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold mb-2 sm:mb-4 text-light-800">
              管理员 <span className="gradient-text">控制面板</span> ⚙️
            </h1>
          </div>

          {/* 统计卡片 - 优化为 3 列布局 */}
          <div className="card-colorful p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="stat-card gold">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🏫</div>
                <div className="text-xs sm:text-sm text-primary-500 font-medium mb-1">学校名称</div>
                <div className="font-bold text-primary-700 text-sm sm:text-base lg:text-lg truncate">{universityName as string || '江西软件大学'}</div>
              </div>
              <div className="stat-card teal">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">👥</div>
                <div className="text-xs sm:text-sm text-teal-500 font-medium mb-1">已注册学生</div>
                <div className="font-bold text-teal-700 text-xl sm:text-2xl lg:text-3xl">{totalGraduates?.toString() || '0'}</div>
              </div>
              <div className="stat-card rose">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📜</div>
                <div className="text-xs sm:text-sm text-rose-500 font-medium mb-1">合约地址</div>
                <div className="font-mono text-xs sm:text-sm truncate text-rose-700 font-bold">{contractAddress.slice(0, 10)}...{contractAddress.slice(-6)}</div>
              </div>
            </div>
          </div>

          {/* 标签页 - 横向滚动 */}
          <div className="overflow-x-auto pb-2 mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2 min-w-max sm:flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-white text-light-600 hover:bg-primary-50 hover:text-primary-600 border-2 border-light-200'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="hidden xs:inline">{tab.label}</span>
                  <span className="xs:hidden">{tab.label.slice(0, 2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="card-colorful p-4 sm:p-8">
            {/* 单个注册 */}
            {activeTab === 'register' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-light-800">📝 注册单个毕业生</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">钱包地址 *</label>
                    <input
                      type="text"
                      value={graduateAddress}
                      onChange={(e) => setGraduateAddress(e.target.value)}
                      placeholder="0x..."
                      className="input-field font-mono text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">学号 *</label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="202200001"
                      className="input-field"
                    />
                    <p className="text-xs text-light-500 mt-1">💡 提示：学号从 202200000 开始（对应2026届毕业生）</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">姓名 *</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="张三"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">学院</label>
                    <select
                      value={selectedCollege}
                      onChange={(e) => setSelectedCollege(e.target.value)}
                      className="select-field"
                    >
                      <option value="">-- 请选择 --</option>
                      {colleges.map((college) => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">专业</label>
                    <select
                      value={selectedMajor}
                      onChange={(e) => setSelectedMajor(e.target.value)}
                      className="select-field"
                      disabled={!selectedCollege}
                    >
                      <option value="">-- 请先选择学院 --</option>
                      {currentMajors.map((major) => (
                        <option key={major.id} value={major.id}>{major.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleRegister}
                  disabled={isRegisterPending || isRegisterConfirming || isRegistering || !isConnected}
                  className="btn-primary w-full text-sm sm:text-base"
                >
                  {isRegisterPending || isRegisterConfirming || isRegistering ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {isRegisterConfirming || isRegistering ? '确认中...' : '发送中...'}
                    </span>
                  ) : registerSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      ✅ 注册成功
                    </span>
                  ) : (
                    '✨ 注册毕业生'
                  )}
                </button>

                {registerSuccess && (
                  <div className="p-3 sm:p-4 bg-teal-100 border-2 border-teal-200 rounded-xl sm:rounded-2xl text-teal-700 font-medium text-sm">
                    ✅ 学生 {studentName} ({studentId}) 注册成功！
                  </div>
                )}
              </div>
            )}

            {/* 批量注册 */}
            {activeTab === 'batch-register' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2 text-light-800">📋 批量注册毕业生</h2>
                  <p className="text-light-500 text-xs sm:text-sm mb-2">
                    每行一个学生，格式：<code className="bg-primary-100 text-primary-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg font-bold text-xs">地址,学号,姓名,专业,学院</code>
                  </p>
                  <p className="text-xs text-accent-600 mb-4 sm:mb-6">
                    💡 提示：学号从 202200000 开始（对应2026届，2022年入学）
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">批量输入（支持逗号或Tab分隔）</label>
                  <textarea
                    value={batchInput}
                    onChange={(e) => {
                      setBatchInput(e.target.value);
                      parseBatchInput(e.target.value);
                    }}
                    placeholder={`0x1234...abcd,202200001,张三,计算机科学与技术,软件学院
0x5678...efgh,202200002,李四,软件工程,软件学院
0x9abc...ijkl,202200003,王五,数据科学与大数据技术,软件学院`}
                    className="input-field font-mono text-xs sm:text-sm h-32 sm:h-40"
                  />
                </div>

                {/* 解析预览 - 移动端使用卡片，桌面端使用表格 */}
                {parsedStudents.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-sm sm:text-base">预览 ({parsedStudents.filter(s => s.isValid).length}/{parsedStudents.length} 有效)</h3>
                    </div>
                    
                    {/* 移动端：卡片列表 */}
                    <div className="sm:hidden space-y-2 max-h-60 overflow-y-auto">
                      {parsedStudents.map((student, idx) => (
                        <div key={idx} className={`p-3 rounded-xl text-xs ${student.isValid ? 'bg-teal-50 border border-teal-200' : 'bg-rose-50 border border-rose-200'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold">{student.studentName || '无名'}</span>
                            <span className={student.isValid ? 'text-teal-600' : 'text-rose-600'}>
                              {student.isValid ? '✓ 有效' : '✗ 无效'}
                            </span>
                          </div>
                          <div className="text-light-500 space-y-1">
                            <div className="truncate">地址: {student.address.slice(0, 10)}...</div>
                            <div>学号: {student.studentId}</div>
                            {student.error && <div className="text-rose-500">{student.error}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 桌面端：表格 */}
                    <div className="hidden sm:block bg-light-100 rounded-xl overflow-hidden max-h-60 overflow-y-auto border border-light-200">
                      <table className="w-full text-sm">
                        <thead className="bg-light-200 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-light-600">状态</th>
                            <th className="px-3 py-2 text-left text-light-600">地址</th>
                            <th className="px-3 py-2 text-left text-light-600">学号</th>
                            <th className="px-3 py-2 text-left text-light-600">姓名</th>
                            <th className="px-3 py-2 text-left text-light-600">专业</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedStudents.map((student, i) => (
                            <tr key={i} className={`border-t border-light-200 ${!student.isValid ? 'opacity-50' : ''}`}>
                              <td className="px-3 py-2">
                                {student.isValid ? '✅' : '❌'}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {student.address.slice(0, 8)}...
                              </td>
                              <td className="px-3 py-2">{student.studentId}</td>
                              <td className="px-3 py-2">{student.studentName}</td>
                              <td className="px-3 py-2">{student.major || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 进度和结果显示 */}
                <BatchProgress
                  current={batchRegisterProgress.current}
                  total={batchRegisterProgress.total}
                  type="register"
                  isActive={batchRegistering}
                  results={!batchRegistering && (batchRegisterResults.success > 0 || batchRegisterResults.failed > 0) 
                    ? batchRegisterResults 
                    : undefined
                  }
                />

                <button
                  onClick={handleBatchRegister}
                  disabled={batchRegistering || parsedStudents.filter(s => s.isValid).length === 0}
                  className="btn-primary w-full text-sm sm:text-base"
                >
                  {batchRegistering ? `注册中 (${batchRegisterProgress.current}/${batchRegisterProgress.total})` : 
                    `批量注册 ${parsedStudents.filter(s => s.isValid).length} 人`}
                </button>
              </div>
            )}

            {/* 单个发放 */}
            {activeTab === 'mint' && (
              <div className="space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-light-800">🎁 发放官方NFT</h2>
                
                <div>
                  <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">接收地址 *</label>
                  <input
                    type="text"
                    value={mintAddress}
                    onChange={(e) => { setMintAddress(e.target.value); setMintError(null); }}
                    placeholder="0x..."
                    className="input-field font-mono text-xs sm:text-sm"
                  />
                  {mintAddress && !isMintAddressRegistered && (
                    <p className="text-rose-500 text-xs sm:text-sm mt-1">⚠️ 该地址尚未注册</p>
                  )}
                  {mintAddress && isMintAddressRegistered && (
                    <p className="text-teal-500 text-xs sm:text-sm mt-1">✅ 已注册毕业生</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm text-light-600 mb-1.5 sm:mb-2 font-medium">NFT类型 *</label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-4">
                    {OFFICIAL_NFTS.map((nft) => {
                      const alreadyOwned = mintAddressBalances[nft.id] > 0;
                      return (
                        <button
                          key={nft.id}
                          onClick={() => !alreadyOwned && setMintTokenId(nft.id.toString())}
                          disabled={alreadyOwned}
                          className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left relative ${
                            alreadyOwned ? 'border-light-200 bg-light-100 opacity-50 cursor-not-allowed' :
                            mintTokenId === nft.id.toString() ? 'border-primary-400 bg-primary-50' :
                            'border-light-200 hover:border-primary-300 bg-white'
                          }`}
                        >
                          <div className="font-medium text-sm sm:text-base text-light-800">{nft.name}</div>
                          <div className="text-xs sm:text-sm text-light-500">{nft.description}</div>
                          {alreadyOwned && (
                            <span className="absolute top-2 right-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full font-bold">
                              已发放
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {mintError && (
                  <div className="p-3 sm:p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
                    ❌ {mintError}
                  </div>
                )}

                <button
                  onClick={handleMint}
                  disabled={isPending || isConfirming || !isMintAddressRegistered}
                  className="btn-primary w-full text-sm sm:text-base"
                >
                  {isPending || isConfirming ? '发放中...' : '发放NFT'}
                </button>

                {mintSuccess && (
                  <div className="p-3 sm:p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-600 text-sm">
                    ✅ 发放成功！已为 {mintAddress.slice(0, 6)}...{mintAddress.slice(-4)} 发放「{mintSuccess.name}」
                  </div>
                )}
              </div>
            )}

            {/* 批量发放 */}
            {activeTab === 'batch-mint' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-2">📦 批量发放官方NFT</h2>
                <p className="text-light-500 text-sm mb-6">
                  输入多个已注册学生的地址（每行一个），批量发放同一种NFT
                </p>
                
                <div>
                  <label className="block text-sm text-light-600 mb-2">选择NFT类型</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {OFFICIAL_NFTS.map((nft) => (
                      <button
                        key={nft.id}
                        onClick={() => setBatchMintTokenId(nft.id.toString())}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          batchMintTokenId === nft.id.toString()
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-light-200 hover:border-light-300'
                        }`}
                      >
                        <div className="text-2xl mb-1">{nft.name.split(' ')[0]}</div>
                        <div className="text-xs text-light-500">{nft.name.split(' ').slice(1).join(' ')}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-light-600 mb-2">学生地址列表（每行一个地址）</label>
                  <textarea
                    value={selectedStudents.join('\n')}
                    onChange={(e) => {
                      const addresses = e.target.value.split('\n').map(a => a.trim()).filter(a => a);
                      setSelectedStudents(addresses);
                    }}
                    placeholder={`0x1234...abcd
0x5678...efgh
0x9abc...ijkl`}
                    className="input-field font-mono text-sm h-40"
                  />
                  <p className="text-light-500 text-sm mt-1">
                    已输入 {selectedStudents.filter(a => /^0x[a-fA-F0-9]{40}$/.test(a)).length} 个有效地址
                  </p>
                </div>

                {/* 进度和结果显示 */}
                <BatchProgress
                  current={batchMintProgress.current}
                  total={batchMintProgress.total}
                  type="mint"
                  isActive={batchMinting}
                  results={!batchMinting && (batchMintResults.success > 0 || batchMintResults.failed > 0 || batchMintResults.skipped > 0) 
                    ? batchMintResults 
                    : undefined
                  }
                />

                <button
                  onClick={handleBatchMint}
                  disabled={batchMinting || selectedStudents.filter(a => /^0x[a-fA-F0-9]{40}$/.test(a)).length === 0}
                  className="btn-primary w-full"
                >
                  {batchMinting ? `发放中 (${batchMintProgress.current}/${batchMintProgress.total})` :
                    `批量发放 ${OFFICIAL_NFTS.find(n => n.id === parseInt(batchMintTokenId))?.name}`}
                </button>
              </div>
            )}

            {/* 查询统计 */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">📊 查询毕业生信息</h2>
                
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={queryAddress}
                    onChange={(e) => setQueryAddress(e.target.value)}
                    placeholder="输入钱包地址查询..."
                    className="input-field flex-1 font-mono"
                  />
                  <button 
                    onClick={() => {
                      refetchGraduateInfo();
                      refetchQueryBalance1();
                      refetchQueryBalance2();
                      refetchQueryBalance3();
                      refetchQueryBalance4();
                    }} 
                    className="btn-secondary px-6"
                  >
                    查询
                  </button>
                </div>

                {queryAddress && queryGraduateInfo && (queryGraduateInfo as any)[0] && (
                  <div className="bg-white border-2 border-light-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-3xl">👤</div>
                      <div>
                        <div className="text-xl font-bold text-light-800">{(queryGraduateInfo as any)[1]}</div>
                        <div className="text-light-500">学号: {(queryGraduateInfo as any)[0]}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-light-500 text-sm">学院:</span>
                        <p className="font-medium text-light-800">{(queryGraduateInfo as any)[3] || '-'}</p>
                      </div>
                      <div>
                        <span className="text-light-500 text-sm">专业:</span>
                        <p className="font-medium text-light-800">{(queryGraduateInfo as any)[2] || '-'}</p>
                      </div>
                      <div>
                        <span className="text-light-500 text-sm">个人铸造次数:</span>
                        <p className="font-medium text-light-800">{(queryGraduateInfo as any)[6]?.toString() || '0'}</p>
                      </div>
                      <div>
                        <span className="text-light-500 text-sm">保底进度:</span>
                        <p className="font-medium text-light-800">{(queryGraduateInfo as any)[7]?.toString() || '0'}/20</p>
                      </div>
                    </div>

                    {/* 官方NFT展示 */}
                    <div className="mt-6 pt-6 border-t-2 border-light-200">
                      <h3 className="text-lg font-bold mb-4 text-light-800 flex items-center gap-2">
                        <span>🏛️</span>
                        已获得的官方NFT
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {OFFICIAL_NFTS.map((nft) => {
                          const balance = queryOfficialNFTs[nft.id as keyof typeof queryOfficialNFTs];
                          const hasNFT = balance > 0;
                          // 从name中提取emoji和文本
                          const emojiMatch = nft.name.match(/^([^\s]+)\s+(.+)$/);
                          const emoji = emojiMatch ? emojiMatch[1] : '🎁';
                          const name = emojiMatch ? emojiMatch[2] : nft.name;
                          return (
                            <div
                              key={nft.id}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                hasNFT
                                  ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-300 shadow-md'
                                  : 'bg-light-50 border-light-200 opacity-60'
                              }`}
                            >
                              <div className="text-3xl mb-2 text-center">{emoji}</div>
                              <div className="text-sm font-bold text-center mb-1 text-light-800">
                                {name}
                              </div>
                              <div className={`text-xs text-center font-medium ${
                                hasNFT ? 'text-primary-600' : 'text-light-400'
                              }`}>
                                {hasNFT ? `✅ 已拥有 (${balance})` : '❌ 未获得'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {queryAddress && queryGraduateInfo && !(queryGraduateInfo as any)[0] && (
                  <div className="bg-light-50 rounded-xl p-6 text-center text-light-500 border-2 border-light-200">
                    <div className="text-4xl mb-2">🔍</div>
                    该地址未注册
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
