import { useCallback, useRef, useState, useEffect, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastVariant } from './useToast';
import { ToastViewport } from './components/ToastViewport';

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    const currentTimeouts = timeouts.current;
    return () => {
      currentTimeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeout = timeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeouts.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, variant }]);
      const timeout = setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
      timeouts.current.set(id, timeout);
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
