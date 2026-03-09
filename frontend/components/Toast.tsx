'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Toast 类型
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Toast 图标和样式配置
const toastConfig: Record<ToastType, { icon: string; bgClass: string; borderClass: string; textClass: string }> = {
  success: {
    icon: '✅',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    textClass: 'text-teal-700',
  },
  error: {
    icon: '❌',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-700',
  },
  warning: {
    icon: '⚠️',
    bgClass: 'bg-primary-50',
    borderClass: 'border-primary-200',
    textClass: 'text-primary-700',
  },
  info: {
    icon: 'ℹ️',
    bgClass: 'bg-accent-50',
    borderClass: 'border-accent-200',
    textClass: 'text-accent-700',
  },
};

// Toast 组件
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = toastConfig[toast.type];

  return (
    <div
      className={`${config.bgClass} ${config.borderClass} border-2 rounded-2xl p-4 shadow-lg flex items-start gap-3 animate-slide-up max-w-sm w-full`}
      role="alert"
    >
      <span className="text-2xl flex-shrink-0">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <h4 className={`font-bold ${config.textClass}`}>{toast.title}</h4>
        {toast.message && (
          <p className={`text-sm mt-1 ${config.textClass} opacity-80`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${config.textClass} opacity-60 hover:opacity-100 transition-opacity`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Toast 容器
function ToastContainer({ toasts, hideToast }: { toasts: Toast[]; hideToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    setToasts((prev) => [...prev, newToast]);

    // 自动关闭
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} hideToast={hideToast} />
    </ToastContext.Provider>
  );
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// 便捷方法
export function useToastHelpers() {
  const { showToast } = useToast();

  return {
    success: (title: string, message?: string) => showToast({ type: 'success', title, message }),
    error: (title: string, message?: string) => showToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) => showToast({ type: 'info', title, message }),
  };
}

