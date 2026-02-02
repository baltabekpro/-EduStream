import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

type ToastType = 'success' | 'info' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { settings } = useSettings();

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    // Проверка настроек перед показом
    if (type === 'error' && !settings.notifications.errors) return;
    if (type === 'info' && !settings.notifications.reports) return; // Info используем для отчетов/статусов
    // Success показываем всегда или можно добавить отдельную настройку
    // LowPerformance логика обычно реализуется на уровне вызова addToast в компоненте Analytics

    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, [settings]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border transition-all animate-slide-in-right pointer-events-auto
              ${toast.type === 'success' ? 'bg-surface border-green-500/50 text-green-400' : ''}
              ${toast.type === 'info' ? 'bg-surface border-primary/50 text-blue-400' : ''}
              ${toast.type === 'error' ? 'bg-surface border-red-500/50 text-red-400' : ''}
            `}
          >
            <span className="material-symbols-outlined">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}
            </span>
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};