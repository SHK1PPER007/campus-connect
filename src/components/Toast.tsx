import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  message: string;
  subMessage?: string;
  type?: 'success' | 'info' | 'error';
  duration?: number;
}

interface ToastContextValue {
  showToast: (item: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(({ message, subMessage, type = 'success', duration = 3000 }: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, message, subMessage, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Контейнер всплывающих тостов в нео-бруталистском стиле */}
      <div className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-2 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto border-2 shadow-brutal p-3 text-xs font-mono flex items-start justify-between gap-2.5 transition-all transform animate-in slide-in-from-bottom-2 duration-200 ${
              toast.type === 'error'
                ? 'bg-red-50 border-red-700 text-red-950'
                : toast.type === 'info'
                ? 'bg-blue-50 border-campus-dark text-campus-dark'
                : 'bg-white border-campus-border text-campus-text'
            }`}
          >
            <div className="flex items-start space-x-2 min-w-0">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4 text-campus-ai flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 space-y-0.5">
                <div className="font-bold leading-tight">{toast.message}</div>
                {toast.subMessage && (
                  <div className="text-[11px] text-campus-subtle leading-tight">
                    {toast.subMessage}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-black/5 text-campus-subtle hover:text-campus-text transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (item) => {
        console.log('[Toast fallback]:', item.message, item.subMessage);
      },
    };
  }
  return context;
}
