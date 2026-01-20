import { createContext, useCallback, useContext, useMemo, useState, type FC, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./ToastProvider.module.scss";

type ToastVariant = "success" | "error" | "info";

type ToastInput = {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = ToastInput & { id: string };

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const duration = toast.duration ?? 4000;
      const item: ToastItem = { id, ...toast };

      setToasts((prev) => [...prev, item]);

      window.setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(styles.toast, styles[toast.variant ?? "info"])}
            role="status"
          >
            <div className={styles.content}>
              {toast.title && <div className={styles.title}>{toast.title}</div>}
              <div className={styles.message}>{toast.message}</div>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => dismiss(toast.id)}
              aria-label="Fermer la notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
};
