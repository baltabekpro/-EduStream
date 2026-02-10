import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';

type ToastType = 'success' | 'info' | 'error';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, action?: ToastAction) => void;
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

  const addToast = useCallback((message: string, type: ToastType = 'success', action?: ToastAction) => {
    // Проверка настроек перед показом
    if (type === 'error' && !settings.notifications.errors) return;
    if (type === 'info' && !settings.notifications.reports) return; // Info используем для отчетов/статусов
    // Success показываем всегда или можно добавить отдельную настройку
    // LowPerformance логика обычно реализуется на уровне вызова addToast в компоненте Analytics

    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, action ? 5000 : 3000); // Больше времени если есть кнопка
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
            <span className="text-sm font-medium text-white flex-1">{toast.message}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action!.onClick();
                  setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                }}
                className="ml-2 px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-hover transition-colors"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};