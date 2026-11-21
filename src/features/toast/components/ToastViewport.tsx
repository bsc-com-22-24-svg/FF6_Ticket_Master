import type { Toast } from '../useToast';
import styles from './ToastViewport.module.css';

const ICONS: Record<Toast['variant'], string> = {
  success: '✓',
  error: '!',
  info: 'i',
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          className={`${styles.toast} ${styles[toast.variant]}`}
        >
          <span className={styles.icon}>{ICONS[toast.variant]}</span>
          <p className={styles.message}>{toast.message}</p>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
            className={styles.close}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
