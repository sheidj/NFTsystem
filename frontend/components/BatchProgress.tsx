'use client';

import { useEffect, useState } from 'react';

interface BatchProgressProps {
  current: number;
  total: number;
  type: 'register' | 'mint';
  isActive: boolean;
  results?: {
    success: number;
    failed: number;
    skipped?: number;
  };
  currentItem?: string; // 当前处理的项目名称
}

export function BatchProgress({ 
  current, 
  total, 
  type, 
  isActive, 
  results,
  currentItem 
}: BatchProgressProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('计算中...');

  // 计算进度百分比
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  // 开始计时
  useEffect(() => {
    if (isActive && !startTime) {
      setStartTime(Date.now());
    }
    if (!isActive) {
      setStartTime(null);
    }
  }, [isActive, startTime]);

  // 计算预估剩余时间
  useEffect(() => {
    if (isActive && startTime && current > 0) {
      const elapsed = Date.now() - startTime;
      const avgTimePerItem = elapsed / current;
      const remaining = (total - current) * avgTimePerItem;
      
      if (remaining < 1000) {
        setEstimatedTime('即将完成');
      } else if (remaining < 60000) {
        setEstimatedTime(`约 ${Math.ceil(remaining / 1000)} 秒`);
      } else {
        setEstimatedTime(`约 ${Math.ceil(remaining / 60000)} 分钟`);
      }
    }
  }, [current, total, startTime, isActive]);

  const typeConfig = {
    register: {
      title: '批量注册',
      icon: '📝',
      activeText: '正在注册学生信息...',
      completedText: '注册完成',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      progressColor: 'bg-gradient-to-r from-primary-400 to-primary-500',
      textColor: 'text-primary-700',
    },
    mint: {
      title: '批量发放',
      icon: '🎁',
      activeText: '正在发放NFT...',
      completedText: '发放完成',
      bgColor: 'bg-accent-50',
      borderColor: 'border-accent-200',
      progressColor: 'bg-gradient-to-r from-accent-400 to-accent-500',
      textColor: 'text-accent-700',
    },
  };

  const config = typeConfig[type];

  // 显示结果
  if (!isActive && results && (results.success > 0 || results.failed > 0)) {
    const totalProcessed = results.success + results.failed + (results.skipped || 0);
    return (
      <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-4 sm:p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <h3 className={`font-bold ${config.textColor}`}>{config.title}完成</h3>
            <p className="text-sm text-light-500">共处理 {totalProcessed} 项</p>
          </div>
        </div>

        {/* 结果统计 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-teal-100 rounded-xl p-3 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-teal-600">{results.success}</div>
            <div className="text-xs text-teal-600 font-medium">✅ 成功</div>
          </div>
          <div className="bg-rose-100 rounded-xl p-3 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-rose-600">{results.failed}</div>
            <div className="text-xs text-rose-600 font-medium">❌ 失败</div>
          </div>
          {results.skipped !== undefined && (
            <div className="bg-light-100 rounded-xl p-3 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-light-600">{results.skipped}</div>
              <div className="text-xs text-light-600 font-medium">⏭️ 跳过</div>
            </div>
          )}
        </div>

        {/* 成功率 */}
        <div className="mt-4 pt-4 border-t border-light-200">
          <div className="flex justify-between text-sm">
            <span className="text-light-500">成功率</span>
            <span className={`font-bold ${results.success === totalProcessed ? 'text-teal-600' : 'text-primary-600'}`}>
              {totalProcessed > 0 ? Math.round((results.success / totalProcessed) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 显示进度
  if (!isActive) return null;

  return (
    <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-4 sm:p-6 animate-pulse-slow`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm animate-bounce">
            <span className="text-xl">{config.icon}</span>
          </div>
          <div>
            <h3 className={`font-bold ${config.textColor}`}>{config.activeText}</h3>
            {currentItem && (
              <p className="text-xs text-light-500 truncate max-w-[200px]">
                当前: {currentItem}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${config.textColor}`}>{percentage}%</div>
          <div className="text-xs text-light-500">{current}/{total}</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="relative mb-3">
        <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
          <div 
            className={`h-full ${config.progressColor} transition-all duration-300 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* 进度点 */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-primary-400 transition-all duration-300"
          style={{ left: `calc(${percentage}% - 10px)` }}
        />
      </div>

      {/* 底部信息 */}
      <div className="flex justify-between text-xs text-light-500">
        <span>⏱️ 预计剩余: {estimatedTime}</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></span>
          处理中
        </span>
      </div>
    </div>
  );
}

