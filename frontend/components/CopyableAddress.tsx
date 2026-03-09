'use client';

import { useState } from 'react';

interface CopyableAddressProps {
  address: string;
  label?: string;
  className?: string;
  shortened?: boolean;
}

export function CopyableAddress({ address, label, className = '', shortened = true }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const displayAddress = shortened
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : address;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {label && <span className="text-light-500">{label}</span>}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 font-mono text-light-700 hover:text-primary-600 transition-colors group"
        title="点击复制完整地址"
      >
        <span className="text-xs sm:text-sm">{displayAddress}</span>
        <span className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">
          {copied ? '✅' : '📋'}
        </span>
      </button>
      {copied && (
        <div className="absolute right-0 mt-1 px-2 py-1 bg-green-500 text-white text-xs rounded shadow-lg animate-fade-in">
          已复制完整地址！
        </div>
      )}
    </div>
  );
}

