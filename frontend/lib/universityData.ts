// 学校配置数据 - 可根据实际情况修改

export const universityConfig = {
  name: '示例大学',
  year: 2024,
};

// 学院列表
export const colleges = [
  { id: 'info', name: '信息学院' },
  { id: 'business', name: '商学院' },
  { id: 'art', name: '艺术学院' },
  { id: 'engineering', name: '工程学院' },
  { id: 'science', name: '理学院' },
  { id: 'literature', name: '文学院' },
  { id: 'law', name: '法学院' },
  { id: 'medicine', name: '医学院' },
  { id: 'education', name: '教育学院' },
  { id: 'foreign', name: '外国语学院' },
];

// 专业列表 - 按学院分类
export const majorsByCollege: Record<string, { id: string; name: string }[]> = {
  info: [
    { id: 'cs', name: '计算机科学与技术' },
    { id: 'se', name: '软件工程' },
    { id: 'ai', name: '人工智能' },
    { id: 'ds', name: '数据科学与大数据技术' },
    { id: 'is', name: '信息安全' },
    { id: 'iot', name: '物联网工程' },
  ],
  business: [
    { id: 'ba', name: '工商管理' },
    { id: 'acc', name: '会计学' },
    { id: 'fin', name: '金融学' },
    { id: 'mkt', name: '市场营销' },
    { id: 'hr', name: '人力资源管理' },
    { id: 'ib', name: '国际商务' },
  ],
  art: [
    { id: 'vd', name: '视觉传达设计' },
    { id: 'pd', name: '产品设计' },
    { id: 'env', name: '环境设计' },
    { id: 'anim', name: '动画' },
    { id: 'dm', name: '数字媒体艺术' },
    { id: 'fa', name: '美术学' },
  ],
  engineering: [
    { id: 'me', name: '机械工程' },
    { id: 'ee', name: '电气工程' },
    { id: 'ce', name: '土木工程' },
    { id: 'che', name: '化学工程' },
    { id: 'auto', name: '自动化' },
    { id: 'mat', name: '材料科学与工程' },
  ],
  science: [
    { id: 'math', name: '数学与应用数学' },
    { id: 'phy', name: '物理学' },
    { id: 'chem', name: '化学' },
    { id: 'bio', name: '生物科学' },
    { id: 'stat', name: '统计学' },
  ],
  literature: [
    { id: 'chl', name: '汉语言文学' },
    { id: 'hist', name: '历史学' },
    { id: 'phil', name: '哲学' },
    { id: 'jour', name: '新闻学' },
    { id: 'adv', name: '广告学' },
  ],
  law: [
    { id: 'law', name: '法学' },
    { id: 'pol', name: '政治学' },
    { id: 'socio', name: '社会学' },
    { id: 'pa', name: '行政管理' },
  ],
  medicine: [
    { id: 'cm', name: '临床医学' },
    { id: 'nurs', name: '护理学' },
    { id: 'phar', name: '药学' },
    { id: 'tcm', name: '中医学' },
    { id: 'dent', name: '口腔医学' },
  ],
  education: [
    { id: 'edu', name: '教育学' },
    { id: 'psy', name: '心理学' },
    { id: 'pe', name: '体育教育' },
    { id: 'pre', name: '学前教育' },
    { id: 'spe', name: '特殊教育' },
  ],
  foreign: [
    { id: 'eng', name: '英语' },
    { id: 'jpn', name: '日语' },
    { id: 'kor', name: '韩语' },
    { id: 'fra', name: '法语' },
    { id: 'ger', name: '德语' },
    { id: 'spa', name: '西班牙语' },
  ],
};

// 获取所有专业（扁平化）
export const getAllMajors = () => {
  const allMajors: { id: string; name: string; collegeId: string }[] = [];
  Object.entries(majorsByCollege).forEach(([collegeId, majors]) => {
    majors.forEach((major) => {
      allMajors.push({ ...major, collegeId });
    });
  });
  return allMajors;
};

// NFT 类型
export const nftTypes = [
  { id: 1, name: '毕业证书', description: '官方数字毕业证书' },
  { id: 2, name: '纪念徽章', description: '专属毕业纪念徽章' },
  { id: 3, name: '荣誉证书', description: '优秀毕业生荣誉证书' },
  { id: 4, name: '特殊奖项', description: '杰出贡献者特殊奖项' },
];

