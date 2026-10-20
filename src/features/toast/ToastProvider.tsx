import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastVariant } from './useToast';
import { ToastViewport } from './components/ToastViewport';

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
